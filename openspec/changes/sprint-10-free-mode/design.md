# Design: Sprint 10 — Free Mode (drop Stripe, fix Vercel deploy)

## Technical Approach

Remove the monetization layer in reverse-dependency order, collapse the tier model to a single FREE limit, and make the Vercel Free deploy run migrations at build. The change is a **deletion-first refactor**: no new business logic, only removal + one constant change (`3` → `10`). Every decision anchors to a delta spec requirement.

Deletion order (gate: `pnpm typecheck` must stay green after each phase):
1. **Paid leaf modules** — `src/billing/`, `src/app/api/webhooks/stripe/`, `src/app/pricing/`, `e2e/stripe-checkout.spec.ts`, `docs/stripe-test-setup.md`, `stripe` dep.
2. **Tier abstraction** — simplify `tier.ts`, `enforcement.ts`; delete `feature-gate.ts`.
3. **Lift gates** — rewrite consumers (`share-actions`, `multi-page-actions`, `pdf/route`, `audit-runner`, `nav-plan`, navbar, landing, dashboard, profile, audit-detail).
4. **Contracts + schema** — delete `contracts/billing.ts`, drop Prisma models/enums, generate down-migration.
5. **Env / CI / copy** — `.env.example`, `copy.ts`, `ci.yml`, `config.yaml`, `README`, `AGENTS.md`.

`Tier` type is deleted **last** (step 4): it is imported by 9 files, so every consumer must stop importing it before the contract can go. `tsc --noEmit` is the orphan-reference gate.

## Architecture Decisions

| Decision | Option | Tradeoff | Chosen |
|---|---|---|---|
| Enforcement shape for the single limit | (A) Delete `enforcement.ts`, inline `countAuditsInWindow`+`hasFreeAuditsLeft` at 3 call sites | 3×2-line duplication | **(B) Keep `checkTierLimit`** (FREE-only) in `enforcement.ts`; delete `recordPaidAudit` + `PaidAuditTx` — one tested enforcement point (TLM-3/4 shared), matches existing pattern |
| Multi-page limit accounting | (A) Add a counter | (B) rely on `Audit`-row window | **(B)** — `countAuditsInWindow` counts the `Audit` table only, not `AuditPage`. `persistMultiPageAudit` already creates exactly one master `Audit` row, so TLM-10 is satisfied structurally; the `recordPaidAudit` call is simply removed (no per-page increment ever existed on `Audit`) |
| Migration path for PRO users | (A) keep `tier` nullable | (B) drop column | **(B)** — down-migration drops `User.tier`/`User.subscription`; pre-launch, zero paying users, data loss acceptable (rollback = git history + re-run `add_subscription_and_billing`) |
| Vercel migrate location | (A) GitHub Actions deploy job | (B) Vercel Build Command | **(B)** — no deploy workflow exists (`ci.yml` is PR-gated lint/typecheck/test/e2e only); deploy is Vercel Git integration, so `prisma migrate deploy` runs in the Build Command via a new `build:vercel` script |
| Navbar plan pill | (A) keep pill linking to `/pricing` | (B) static "Free" pill | **(B)** — SHL-2: static "Free" pill, no `/pricing` href (route deleted); usage `used/10` still shown |

## Data Flow

```
auditAction ──rate-limit──> Zod ──> auth ──> checkTierLimit(countAuditsInWindow→hasFreeAuditsLeft(10))
                                                          │
report page ──runAudit──> checkTierLimit (authoritative) ─┴─> prisma.audit.create (1 row, FREE)
multiPageAction ──> checkTierLimit ──> runMultiPageAudit ──> persistMultiPageAudit (1 master Audit + N AuditPage)
shareToken   ──auth──> ownership findFirst ──> update shareToken        (no gate)
PDF GET      ──auth──> ownership findFirst(404) ──> buildReportHtml → renderPdf (no gate)
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/billing/` (8 src + 8 tests) | Delete | actions, checkout-button, pricing-cards, stripe, subscription-service, types, apply-subscription-event, webhook-handler |
| `src/app/api/webhooks/stripe/route.ts` (+ test) | Delete | webhook route removed |
| `src/app/pricing/page.tsx` (+ 2 tests) | Delete | pricing page removed |
| `src/lib/contracts/billing.ts` (+ test) | Delete | `Tier`, `SubscriptionStatus`, `checkoutPlanSchema` |
| `e2e/stripe-checkout.spec.ts` | Delete | E2E-4 removed |
| `docs/stripe-test-setup.md` | Delete | Stripe docs |
| `prisma/schema.prisma` + new migration | Modify | drop `Subscription`, `StripeWebhookEvent`, `Tier`, `SubscriptionStatus`, `User.tier`, `User.subscription`; **`RateLimitEntry` unchanged** |
| `src/lib/audit/tier.ts` (+ test) | Simplify | keep `FREE_AUDIT_LIMIT=10`, `FREE_AUDIT_WINDOW_MS`, `countAuditsInWindow`, `hasFreeAuditsLeft`; delete `PAID_TIER_LIMITS`/`getTierLimit`/`isPaidTier`/`hasPaidAuditsLeft`/`resolvePaidCounter` |
| `src/lib/audit/enforcement.ts` (+ test) | Simplify | `checkTierLimit` = `countAuditsInWindow`→`hasFreeAuditsLeft`; delete `recordPaidAudit`, `PaidAuditTx`, `TierEnforcementPrisma.subscription` |
| `src/lib/audit/feature-gate.ts` (+ test) | Delete | `requirePaidTier` gone |
| `src/lib/audit/share-actions.ts` (+ test) | Modify | remove `requirePaidTier` + tier lookup; drop `"upgrade"` from `ShareLinkErrorCode` |
| `src/lib/audit/multi-page-actions.ts` (+ test) | Modify | remove gate #4 + tier lookup; drop `"upgrade"` from `MultiPageErrorCode` |
| `src/lib/audit/multi-page-persist.ts` (+ test) | Modify | remove `recordPaidAudit`; `MultiPageTx` no longer extends `PaidAuditTx` |
| `src/app/api/report/[id]/pdf/route.ts` (+ test) | Modify | remove `requirePaidTier` + 403 branch; PDF-9 errors = missing/non-owner(404) + render(5xx) |
| `src/report/audit-runner.tsx` (+ test) | Modify | drop `isPaidTier` branch; always `prisma.audit.create` |
| `src/lib/nav-plan.ts` (+ test) | Simplify | `NavPlan = { used, limit }` (no `tier`); FREE window only |
| `src/ui/navbar.tsx`, `nav-links.tsx`, `footer.tsx` (+ tests) | Modify | static "Free" pill; `showMultiPage` for any authed user; drop "Precios"/pricing links |
| `src/app/page.tsx` (+ test) | Modify | remove §5 pricing teaser; anonymous CTA → "Auditar gratis" (LND-6) |
| `src/lib/copy.ts` | Modify | limit copy `3→10`; delete `CHECKOUT_ERROR_COPY`/`PRICING_COPY`; drop `"upgrade"` entries; strip PRO wording from `MULTIPAGE_COPY`/`PROFILE_COPY` |
| `src/app/dashboard/page.tsx`, `profile/page.tsx`, `audits/[id]/page.tsx`, `src/app/multipage/page.tsx` (+ tests) | Modify | remove `BillingCta`/`portalAction`/tier lookups; detail page always renders ShareModal + Export PDF |
| `src/dashboard/billing-cta.tsx` (+ test) | Delete | DSH-6 removed |
| `src/app/sitemap.ts`, `src/lib/og.ts`, `src/app/__tests__/a11y-contrast.test.ts`, `crawl-assets.test.ts` | Modify | remove `/pricing` route/OG/scan references (PRC-8, A11Y-2) |
| `package.json` | Modify | remove `stripe` dep; add `"build:vercel": "prisma generate && prisma migrate deploy && next build --turbopack"` |
| `.env.example` | Modify | remove `STRIPE_*`; keep DATABASE_URL + auth + rate-limit vars |
| `ci.yml` | Modify | drop Stripe/PRO references in e2e comment |

## Interfaces / Contracts

```ts
// src/lib/audit/tier.ts (post-change surface)
export const FREE_AUDIT_LIMIT = 10;
export const FREE_AUDIT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export function hasFreeAuditsLeft(count: number): boolean;
export function countAuditsInWindow(prisma: AuditCountClient, userId: string, now: number): Promise<number>;

// src/lib/audit/enforcement.ts
export async function checkTierLimit(
  prisma: AuditCountClient, userId: string, now: number,
): Promise<{ allowed: boolean }>; // countAuditsInWindow → hasFreeAuditsLeft

// src/lib/audit/share-actions.ts
export type ShareLinkErrorCode = "auth" | "not-found" | "failed";

// src/lib/audit/multi-page-actions.ts
export type MultiPageErrorCode = "rate-limited" | "invalid" | "auth" | "limit" | "failed";
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `FREE_AUDIT_LIMIT === 10`; `hasFreeAuditsLeft` boundary at 10 (9 allowed, 10 blocked); `countAuditsInWindow` window filter | rewrite `tier.test.ts` (delete paid-counter cases) |
| Unit | `checkTierLimit` blocks at 10 (TLM-3), multi-page counts once (TLM-10 — one master `Audit` row) | rewrite `enforcement.test.ts`, `multi-page-actions.test.ts`, `multi-page-persist.test.ts` (drop `recordPaidAudit` asserts) |
| Unit | `createShareToken`/`revokeShareToken` without tier; `multiPageAuditAction` without `upgrade` code | update `share-actions.test.ts`, `multi-page-actions.test.ts` |
| Unit | PDF route returns 404 (missing/non-owner) and 5xx (render), never 403 | update `route.test.ts` (remove `upgrade_required` case) |
| Unit/Integration | Landing has no pricing CTA; navbar pill "Free"; multi-page link visible for authed user; profile `used/10` | update page/navbar/profile tests |
| Typecheck | no orphaned `Tier`/`Subscription`/`@/billing` references | `pnpm typecheck` hard gate per phase |
| E2E | free audit; signup; PDF for any authed user (E2E-5, drop PRO requirement) | delete `stripe-checkout.spec.ts`; update `pdf-download.spec.ts` skip message |

## Threat Matrix

N/A — no new routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. The change **removes** a webhook route (Stripe) and removes tier gates; the Puppeteer PDF render pipeline, the fixed-window rate limiter, and the CI "PR commands" surface are untouched.

## Migration / Rollout

- Down-migration (`prisma migrate dev --name remove_subscription_and_billing`, review with `--create-only`): `DROP TABLE "StripeWebhookEvent"` → `DROP TABLE "Subscription"` → `ALTER TABLE "User" DROP COLUMN "tier"` → `DROP TYPE "SubscriptionStatus"` → `DROP TYPE "Tier"`. `User.subscription` is a relation, not a column (drops with the model). `RateLimitEntry` intact.
- Deploy: set Vercel env (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`); set Build Command to `pnpm build:vercel`; update the GitHub OAuth callback URL to the preview domain.
- Rollback: revert the squash-merged PR; re-run `add_subscription_and_billing` migration; re-add Stripe vars from git history.

## Open Questions

- [ ] Final anonymous landing CTA wording — LND-6 example "Auditar gratis"; confirm exact string.
- [ ] `LEGAL_COPY` still references "facturación"/"procesar pagos" (terms/privacy) — outside grep gate; confirm whether to strip now or defer.
