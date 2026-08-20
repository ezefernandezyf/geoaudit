# Tasks: Sprint 4 — Stripe Integration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1.060 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 4 chained PRs (U1→U4) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | schema+billing lib (Subscription, enums, zod contracts, stripe client) | PR 1 (base `feat/sprint-4-stripe`) | `pnpm test contracts/billing` + `pnpm test billing/stripe` | `pnpm prisma:migrate` + `pnpm generate`; `pnpm dev` boots without crash | drop `Subscription`/`StripeWebhookEvent`, revert `Tier.ENTERPRISE`; remove `stripe` dep |
| 2 | checkout+portal Server Actions | PR 2 (base PR1) | `pnpm test billing/subscription-service` + `pnpm test billing/actions` | `pnpm dev`; trigger checkoutAction/portalAction via UI | remove `subscription-service.ts`/`actions.ts`; no data written |
| 3 | webhook+tier sync (`aplicaSubscriptionEvent`, handler, route) | PR 3 (base PR2) | `pnpm test billing/apply-subscription-event` + `pnpm test billing/webhook-handler` | `stripe listen` forwarding to `/api/webhooks/stripe`; send test events | delete route + `STRIPE_*` webhook env; drop `StripeWebhookEvent` |
| 4 | pricing+enforcement (`/pricing`, CTA, tier.ts/enforcement.ts, audit gate) | PR 4 (base PR3) | `pnpm test lib/audit/tier` + `pnpm test lib/audit/enforcement` + component tests | `pnpm dev`; audit as FREE/PRO/ENTERPRISE; open `/pricing` | revert `tier.ts` to FREE-only; remove `/pricing` + CTA |

## Phase 1 (U1): Schema + Billing Lib — PR 1

- [x] U1.1 Install `stripe` dep (pin stable `apiVersion` at install); add `STRIPE_PRICE_PRO`/`STRIPE_PRICE_ENTERPRISE` to `.env.example` (BLG-5/R4).
- [x] U1.2 `prisma/schema.prisma`: add `Tier.ENTERPRISE`, `SubscriptionStatus` enum (ACTIVE/TRIALING/PAST_DUE/CANCELED/UNPAID/INCOMPLETE/INCOMPLETE_EXPIRED), `Subscription` 1:1 `User`, `StripeWebhookEvent`, `User.subscription` (BLG-1/2/3, TLM-1, R4/R7).
- [x] U1.3 RED test: `contracts/billing.ts` — `tierSchema`/`subscriptionStatusSchema`/`checkoutPlanSchema` parse/parse-fail + enum-value parity with Prisma `Tier` (BLG-1).
- [x] U1.4 `src/lib/contracts/billing.ts`: zod `tierSchema`, `subscriptionStatusSchema`, `checkoutPlanSchema` (BLG-1/5).
- [x] U1.5 RED test: `billing/stripe.ts` — `getStripe()` returns `null` when `STRIPE_SECRET_KEY` missing; returns memoized instance otherwise (BLG-4).
- [x] U1.6 `src/billing/stripe.ts`: lazy `globalThis`-cached `getStripe(): Stripe | null`, env-guarded (BLG-4).
- [x] U1.7 `src/billing/types.ts`: `NormalizedSubscriptionEvent`, priceId→Tier mapping (BLG-9).
- [x] U1.8 Run `prisma migrate dev --name add_subscription_and_billing` + `prisma generate`; verify additive (R4).

## Phase 2 (U2): Checkout + Portal — PR 2 (depends U1)

- [x] U2.1 RED test: `subscription-service.ts` — getOrCreateCustomer, createCheckoutSession (env priceId, `client_reference_id=userId`), createPortalSession (BLG-5/6).
- [x] U2.2 `src/billing/subscription-service.ts`: implement `getOrCreateCustomer`, `createCheckoutSession`, `createPortalSession` (BLG-5/6).
- [ ] U2.3 RED test: `actions.ts` — auth reject, invalid plan, missing key → `{error}`; success `redirect` (BLG-4/5/6, PRC-4).
- [ ] U2.4 `src/billing/actions.ts` (`"use server"`): `checkoutAction` (auth→customer→session→redirect), `portalAction` (auth+stripeCustomerId→portal→redirect) (BLG-5/6).

## Phase 3 (U3): Webhook + Tier Sync — PR 3 (depends U1)

- [ ] U3.1 RED test: `apply-subscription-event.ts` — ACTIVE+PRO→PRO, ACTIVE+ENT→ENTERPRISE, CANCELED/UNPAID/INCOMPLETE_EXPIRED→FREE, unknown price→FREE (BLG-9).
- [ ] U3.2 `src/billing/apply-subscription-event.ts`: pure `aplicaSubscriptionEvent(tx, event, env)` + `resolveTier`, upsert `Subscription`, sync `User.tier` only if changed (BLG-9, TLM-7).
- [ ] U3.3 RED test: `webhook-handler.ts` — duplicate event id → no mutation; dispatch by type; unhandled acked (BLG-8/10).
- [ ] U3.4 `src/billing/webhook-handler.ts`: `handleStripeEvent(prisma, stripe, event)` — idempotency via `stripeWebhookEvent.create` (P2002 no-op) + dispatch (BLG-8/10).
- [ ] U3.5 RED test: `route.ts` `POST` — invalid signature→400, no mutation; valid→200 (BLG-7/8).
- [ ] U3.6 `src/app/api/webhooks/stripe/route.ts`: `runtime: nodejs` + `force-dynamic`, raw `req.text()`, `constructEvent`, call `handleStripeEvent` (BLG-7/10).

## Phase 4 (U4): Pricing + Enforcement — PR 4 (depends U1+U3)

- [ ] U4.1 RED test: `lib/audit/tier.ts` additions — `PAID_TIER_LIMITS` (PRO=10/ENT=50), `getTierLimit` (FREE→3), `hasPaidAuditsLeft`, `resolvePaidCounter` reset at periodEnd, `isPaidTier` (TLM-2/7/8).
- [ ] U4.2 `src/lib/audit/tier.ts`: add paid-tier helpers + counter selection (FREE window vs paid counter) (TLM-2/7/8).
- [ ] U4.3 RED test: `lib/audit/enforcement.ts` — `checkTierLimit` by tier, `recordPaidAudit` increment+resetAt (TLM-3/7/8).
- [ ] U4.4 `src/lib/audit/enforcement.ts`: `checkTierLimit(prisma,userId,now)`, `recordPaidAudit(tx,userId,now)` (TLM-3/7/8).
- [ ] U4.5 `src/lib/audit/actions.ts`: add `checkTierLimit` pre-check before audit (TLM-3).
- [ ] U4.6 `src/report/audit-runner.tsx`: branch by tier; paid runs `recordPaidAudit` in same `$transaction` as `prisma.audit.create` (TLM-7/8).
- [ ] U4.7 RED component tests: `pricing-cards.tsx` renders 3 plans with price+limits (PRC-1/2).
- [ ] U4.8 `src/billing/pricing-cards.tsx`: presentational plan cards Free/Pro/Enterprise (PRC-1/2).
- [ ] U4.9 RED component test: `checkout-button.tsx` — loading/error/idle via `useActionState` (PRC-4).
- [ ] U4.10 `src/billing/checkout-button.tsx` (`"use client"`): `useActionState(checkoutAction)`, loading + `role="alert"` error (PRC-4).
- [ ] U4.11 RED test: `billing-cta.tsx` — FREE→"Upgrade" to `/pricing`; PRO/ENT→portal form (DSH-6, PRC-3).
- [ ] U4.12 `src/dashboard/billing-cta.tsx`: tier-adaptive CTA (DSH-6).
- [ ] U4.13 `src/app/pricing/page.tsx`: server component → `auth()` → render `PricingCards` with per-tier `CheckoutButton`/portal (PRC-1/3).
- [ ] U4.14 Wire `billing-cta.tsx` into dashboard; verify `/pricing` reachable from CTA (DSH-6, PRC-3).
