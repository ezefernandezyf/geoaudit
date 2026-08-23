# Design: Sprint 4 — Stripe Integration

## Technical Approach

Año `src/billing/` domain per Screaming Architecture: Stripe client (lazy singleton), subscription service (get-or-create customer → checkout/portal), a testable `aplicaSubscriptionEvent` (tier sync), and an idempotent signature-verified webhook. A single `Tier` enum (FREE/PRO/ENTERPRISE) drives both `User.tier` and `Subscription.plan`. Enforcement extends `src/lib/audit/tier.ts` with a paid monthly counter reset at `currentPeriodEnd`; FREE keeps its 30-day moving window. Checkout/Portal are Server Actions; the webhook is a `runtime: nodejs` API route.

## Architecture Decisions

| Decision | Option A | Option B | Choice | Rationale |
|---|---|---|---|---|
| Enum | `Tier` shared by `User.tier`+`Subscription.plan` | separate `Plan` | **A** | Proposal decision 1: zero divergence. Zod `tierSchema` mirrors it; a contract test asserts value parity. |
| Tier source of truth at enforcement | read `User.tier` from DB | add `tier` to JWT session | **A** | Webhook syncs tier async; a JWT claim would go stale until re-login. `session.user` only carries `id` (verified in auth.config.ts). |
| Idempotency | `StripeWebhookEvent` table (`id` = Stripe event id, PK) | rely on natural upsert idempotency | **A** | BLG-8 requires observable "no mutation" on replay; P2002 on insert is a clean, testable exactly-once gate. |
| Stripe client | `getStripe(): Stripe \| null`, lazy, `globalThis` cached | throw at import (prisma pattern) | **A** | BLG-4 "fail safe, never crash": prisma throwing at import (src/lib/prisma.ts) is the *anti*-pattern here — billing must degrade to an error state, not crash `pnpm dev`. |
| Checkout link | `client_reference_id = userId` on session | metadata only | **A** | `checkout.session.completed` resolves customer→user without a metadata round-trip. |
| Paid counter | `auditsUsed`/`auditsResetAt` on `Subscription`, lazy reset | cron job | **A** | Proposal decision 2: no cron. Reset happens in `resolvePaidCounter` when `currentPeriodEnd` passes. |

## Data Model (`prisma/schema.prisma`)

```prisma
enum Tier {
  FREE
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  TRIALING
  PAST_DUE
  CANCELED
  UNPAID
  INCOMPLETE
  INCOMPLETE_EXPIRED
}

model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  stripeCustomerId     String             @unique
  stripeSubscriptionId String?            @unique
  plan                 Tier
  status               SubscriptionStatus
  currentPeriodEnd     DateTime?
  auditsUsed           Int                @default(0)
  auditsResetAt        DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
  user                 User               @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model StripeWebhookEvent {
  id        String   @id // Stripe event id (evt_…)
  type      String
  createdAt DateTime @default(now())
}
```

`User` adds `subscription Subscription?`; `User.tier` gains `ENTERPRISE`. Migration: single additive `prisma migrate dev --name add_subscription_and_billing` (new tables + enum value; no destructive ops; `prisma generate` after). Rollback = drop `Subscription`/`StripeWebhookEvent` + revert enum value.

## `src/billing/` Structure

```
src/billing/
  stripe.ts                    # getStripe() singleton (lazy, env-guarded)
  types.ts                     # NormalizedSubscriptionEvent, priceId→Tier mapping
  subscription-service.ts      # getOrCreateCustomer, createCheckoutSession, createPortalSession
  actions.ts                   # "use server": checkoutAction, portalAction
  apply-subscription-event.ts  # aplicaSubscriptionEvent (pure, transactional)
  webhook-handler.ts           # handleStripeEvent: dedupe + dispatch
  pricing-cards.tsx            # presentational plan cards
  checkout-button.tsx          # "use client" useActionState + loading/error
  __tests__/
src/app/api/webhooks/stripe/route.ts
src/app/pricing/page.tsx
src/dashboard/billing-cta.tsx
src/lib/contracts/billing.ts  # zod: tierSchema, subscriptionStatusSchema, checkoutPlanSchema
```

## Stripe Client Singleton

```ts
// src/billing/stripe.ts
import Stripe from "stripe";
const g = globalThis as unknown as { stripe?: Stripe };

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;              // BLG-4: fail safe, never throw at import
  g.stripe ??= new Stripe(key);       // memoized per process (prisma lesson: globalThis cache)
  return g.stripe;
}
```

## Server Actions

```ts
// src/billing/actions.ts — "use server"
export type BillingActionState = { error: string | null };

export async function checkoutAction(prev: BillingActionState, formData: FormData): Promise<BillingActionState>
// auth() → !user.id → {error:"auth"}; checkoutPlanSchema.parse(plan) → {error:"invalid-plan"}
// getStripe() null → {error:"config"}; priceId = plan==="PRO" ? STRIPE_PRICE_PRO : STRIPE_PRICE_ENTERPRISE
// getOrCreateCustomer(prisma, stripe, user.id, user.email) → checkout.sessions.create({
//   customer, mode:"subscription", client_reference_id: user.id,
//   line_items:[{price: priceId, quantity:1}], success_url, cancel_url })
// redirect(checkout.url!)

export async function portalAction(prev: BillingActionState, formData: FormData): Promise<BillingActionState>
// auth() → subscription.stripeCustomerId (must exist) → billingPortal.sessions.create → redirect
```

Both call `redirect()` (NEXT_REDIRECT throw) only on success; failure returns `{error}` for `useActionState`. Registered `"use server"` like `src/lib/audit/actions.ts`.

## Webhook Handler

```ts
// src/app/api/webhooks/stripe/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();                    // raw, before any parse
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !signature || !secret) return new Response("Not configured", { status: 400 });
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(body, signature, secret); }
  catch { return new Response("Invalid signature", { status: 400 }); }  // BLG-7: never trust body
  await handleStripeEvent(prisma, stripe, event);   // dispatch + idempotency
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

`handleStripeEvent` (in `webhook-handler.ts`, injected deps → testable):

1. **Idempotency**: `prisma.stripeWebhookEvent.create({ id: event.id, type: event.type })`; on P2002 → `{processed:false}` (no-op).
2. **Dispatch**: `checkout.session.completed` → expand `session.subscription`, build normalized event from `client_reference_id`; `customer.subscription.updated` / `.deleted` → build from `event.data.object`. Each calls `aplicaSubscriptionEvent`. Unhandled types → acknowledge.

```
Stripe ──POST──▶ route.ts ──constructEvent──▶ handleStripeEvent ──create(evt.id)──┐
                                              (P2002 → 200 no-op)                │
                                                                     aplicaSubscriptionEvent(tx, event, env)
                                                                          │
                                                              Subscription.upsert + User.tier sync
```

## `aplicaSubscriptionEvent`

```ts
// src/billing/apply-subscription-event.ts — pure, takes a structural tx client
export type NormalizedSubscriptionEvent = {
  customerId: string;
  subscriptionId: string;
  status: SubscriptionStatus;
  priceId: string | null;
  currentPeriodEnd: number | null; // Stripe epoch seconds
};

export async function aplicaSubscriptionEvent(
  tx: SubscriptionTxClient,        // { subscription, user } structural mock
  event: NormalizedSubscriptionEvent,
  env: { pricePro: string | null; priceEnterprise: string | null },
): Promise<void>
// tier = resolveTier(status, priceId, env):
//   ACTIVE/TRIALING → priceId===pricePro ? PRO : priceId===priceEnterprise ? ENTERPRISE : FREE
//   CANCELED/UNPAID/INCOMPLETE_EXPIRED → FREE
// tx.subscription.upsert({ where:{stripeCustomerId}, create:{...}, update:{plan:tier,status,currentPeriodEnd,stripeSubscriptionId} })
// tx.user.update({ where:{/* userId */}, data:{ tier } })  // denormalized; only if changed
```

Wrapped by the caller in `prisma.$transaction((tx) => aplicaSubscriptionEvent(tx, ...))`.

## Enforcement (`src/lib/audit/tier.ts` + `src/lib/audit/enforcement.ts`)

Pure additions to `tier.ts` (structural, type-only prisma import — keeps mock-testability):

```ts
export const PAID_TIER_LIMITS = { PRO: 10, ENTERPRISE: 50 } as const;
export function getTierLimit(tier: Tier): number;               // FREE→3, else PAID_TIER_LIMITS
export function hasPaidAuditsLeft(used: number, tier: Tier): boolean; // used < getTierLimit
export function resolvePaidCounter(now: number, used: number, resetAt: Date | null, periodEnd: Date | null): { used: number; resetAt: Date | null };
// periodEnd <= now → { used: 0, resetAt: periodEnd }; else { used, resetAt }  (TLM-7 lazy reset)
export function isPaidTier(tier: Tier): boolean;                // PRO | ENTERPRISE
```

`enforcement.ts` (new, structural prisma mock):

```ts
export async function checkTierLimit(prisma, userId, now): Promise<{ allowed: boolean }>;
// loads user.tier → FREE: countAuditsInWindow+hasFreeAuditsLeft; paid: resolvePaidCounter(sub) → hasPaidAuditsLeft
export async function recordPaidAudit(tx, userId, now): Promise<void>;
// resolvePaidCounter → tx.subscription.update({ increments auditsUsed, sets auditsResetAt })
```

Consumers: `actions.ts` pre-check (TLM-3) and `audit-runner.tsx` authoritative gate (TLM-4), which now branches by tier and — for paid users — runs `recordPaidAudit` in the same `$transaction` as `prisma.audit.create` (TLM-7).

## Pricing Page + CTA

- `src/app/pricing/page.tsx` (public; middleware only guards `/dashboard/*`): server component → `auth()` → render `PricingCards` with a per-card `CheckoutButton` (or portal) driven by tier.
- `checkout-button.tsx` (`"use client"`): `useActionState(checkoutAction)` → loading (`Button loading`), error (`role="alert"`), idle. Success = redirect (no in-page success state needed, PRC-4).
- `src/dashboard/billing-cta.tsx`: FREE → `Link` "Upgrade" to `/pricing`; PRO/Enterprise → form triggering `portalAction` ("Gestionar suscripción") (DSH-6).

## Slicing (chained PRs)

| Slice | Files | ~lines | Depends |
|---|---|---|---|
| U1 schema+billing lib | schema.prisma, migration, contracts/billing.ts, billing/stripe.ts, billing/types.ts, .env.example, `stripe` dep | ~250 | — |
| U2 checkout+portal | subscription-service.ts, actions.ts | ~180 | U1 |
| U3 webhook+tier sync | apply-subscription-event.ts, webhook-handler.ts, route.ts | ~280 | U1 |
| U4 pricing+enforcement | pricing/page.tsx, pricing-cards.tsx, checkout-button.tsx, dashboard/billing-cta.tsx, tier.ts, enforcement.ts, actions.ts (pre-check), audit-runner.tsx | ~350 | U1+U3 |

Chain: U1 → `feat/sprint-4-stripe` (tracker); U2 → U1 branch; U3 → U2; U4 → U3. Each slice compiles + tests green independently, autonomous scope, clean revert. Forecast: **~1.060 líneas → `400-line budget risk: High` · `Chained PRs recommended: Yes` · `Decision needed before apply: Yes`** (ask-on-risk).

## Testing Strategy (strict TDD)

| Layer | What | How |
|---|---|---|
| Contract | tier/status/checkoutPlan zod schemas; enum value parity | vitest on `contracts/billing.ts` |
| Stripe client | null when key missing; memoized instance | `vi.mock("stripe")` + env stubbing |
| subscription-service | get-or-create, checkout/portal session args | mocked Stripe SDK + structural prisma |
| actions | auth reject, invalid plan, missing key → `{error}`; redirect on success | `vi.mock` next-auth + next/navigation |
| `aplicaSubscriptionEvent` | ACTIVE+PRO→PRO, ACTIVE+ENT→ENTERPRISE, CANCELED→FREE, unknown price→FREE | structural tx mock, assert exact upsert/update args |
| webhook | invalid signature → 400; duplicate event id → no mutation; unhandled type acked | mocked `constructEvent`, structural prisma |
| enforcement | resolvePaidCounter reset, getTierLimit, FREE-window vs paid-counter selection, recordPaidAudit | structural prisma mock (mirror `tier.test.ts`) |
| Components | 3 plans rendered, CTA tier switch, loading/error states | RTL |

Webhook testing: import `POST` directly, pass a `Request` with a fake `stripe-signature`, mock `stripe.webhooks.constructEvent` to return/throw; assert status codes and that `stripeWebhookEvent.create`/`aplicaSubscriptionEvent` side effects are (not) invoked.

## Threat Matrix

`N/A` — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. (The webhook is a request handler with signature verification, already covered by BLG-7/BLG-8 RED tests.)

## Migration / Rollout

Additive migration only; `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`/price ids must be set in Stripe test mode (`docs/stripe-test-setup.md`). No data migration, no feature flags. Webhook endpoint registered in Stripe Dashboard after U3.

## Open Questions

- [ ] Pin exact Stripe `apiVersion` at install time (latest stable) vs. SDK default.
- [ ] `success_url`/`cancel_url` base: derive from `NEXT_PUBLIC_APP_URL` or request origin? (recommend origin for now).
