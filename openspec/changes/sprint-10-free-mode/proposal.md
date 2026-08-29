# Proposal: Sprint 10 — Free Mode (drop Stripe, fix Vercel deploy)

## Intent

GeoAudit must validate demand before any monetization. Vercel **Hobby** policy forbids commercial use, and the preview (`geoaudit-tau.vercel.app`) is currently **broken**: `src/lib/prisma.ts` throws on module load when `DATABASE_URL` is absent (digest `1768612064`), and the whole report/dashboard chain imports it → 500. This change removes Stripe + paid tiers entirely (complete deletion, git history preserves code), raises the FREE limit, and makes the Vercel Free deploy work end-to-end.

## Scope

### In Scope
- **Delete Stripe + paid tiers**: `src/billing/`, webhook route, `/pricing` page, billing contracts, Prisma models (`Subscription`, `StripeWebhookEvent`, `SubscriptionStatus` enum, `Tier` PRO/ENTERPRISE), `stripe` dep, env vars, `docs/stripe-test-setup.md`, `e2e/stripe-checkout.spec.ts`.
- **FREE limit 10 audits / 30 days** (was 3), single constant — replaces every tier gate.
- **Un-gate paid features**: multi-page audit, PDF export, share links become FREE (see Open Questions).
- **Fix Vercel deploy**: configure `DATABASE_URL` (+ auth env) in preview/prod, run `prisma migrate deploy` in build, verify audit + login + PDF end-to-end.
- Keep: rate limit 5 req/60s, PDF (Puppeteer), temporary URL.

### Out of Scope
- Cloudflare migration; custom domain; re-introducing payments; UI redesign; PDF engine changes.

## Capabilities

> Contract for `sdd-spec`. Researched against `openspec/specs/`.

### New Capabilities
None.

### Modified Capabilities
- `billing` — **REMOVED** (capability deleted).
- `pricing` — **REMOVED** (capability deleted).
- `tier-limits` — FREE 10/30d; drop paid counters, `getTierLimit`/`isPaidTier`/`resolvePaidCounter`, `Tier` enum.
- `pdf-export` — remove PRO gate (`requirePaidTier`); FREE users export PDF.
- `share-links` — remove PRO gate; FREE users create/revoke links.
- `multi-page-audit` — remove PRO gate; FREE users run multi-page (counts as 1 audit).
- `dashboard` — remove billing CTA (`BillingCta`, `portalAction`).
- `app-shell` — nav plan pill always "Free"; multi-page link always visible.
- `e2e-testing` — drop Stripe checkout flow; update PDF expectations.

## Approach

1. **DB**: new down-migration drops `Subscription`, `StripeWebhookEvent`, `Tier`/`SubscriptionStatus` enums, `User.tier` + `User.subscription`.
2. **Simplify tier layer** to `FREE_AUDIT_LIMIT = 10` in `src/lib/audit/tier.ts`: `countAuditsInWindow` + `hasFreeAuditsLeft` only. Delete `enforcement.ts` paid path, `feature-gate.ts`, `resolvePaidCounter`.
3. **Lift gates** in `multi-page-actions.ts`, `share-actions.ts`, `pdf/route.ts`, `audit-runner.tsx`, `multi-page-persist.ts`; delete `billing/`, `app/pricing/`, `app/api/webhooks/stripe/`.
4. **Deploy**: set env vars, add `prisma migrate deploy` to build, smoke-test on `geoaudit-tau.vercel.app`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/billing/` (8 files + 8 tests) | Removed | actions, checkout-button, pricing-cards, stripe, subscription-service, types, apply-subscription-event, webhook-handler |
| `src/app/api/webhooks/stripe/` | Removed | route + test |
| `src/app/pricing/` | Removed | page + 2 tests |
| `src/lib/contracts/billing.ts` + test | Removed | `Tier`, `SubscriptionStatus`, `checkoutPlanSchema` |
| `prisma/schema.prisma` + migration | Modified | drop models/enums; new down-migration |
| `src/lib/audit/tier.ts` + `enforcement.ts` + `feature-gate.ts` | Simplified/Removed | single FREE constant |
| `src/lib/nav-plan.ts`, `src/ui/navbar.tsx`, `nav-links.tsx` | Simplified | always-Free pill; multi-page link always on |
| `src/report/audit-runner.tsx`, `multi-page-actions.ts`, `share-actions.ts`, `multi-page-persist.ts`, `api/report/[id]/pdf/route.ts` | Modified | lift PRO gates |
| `src/app/dashboard/page.tsx`, `profile/page.tsx`, `src/dashboard/billing-cta.tsx` | Modified | drop billing CTA/portal |
| `src/lib/copy.ts`, `src/app/page.tsx` | Modified | remove pricing/PRO copy; landing teaser |
| `.env.example`, `package.json`, `docs/stripe-test-setup.md`, `e2e/`, `ci.yml`, `README.md`, `AGENTS.md`, `config.yaml` | Modified/Removed | drop Stripe refs |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Down-migration destructive on a live DB | Low (pre-launch, no paying users) | Confirm no paying users; migration is reversible via git history + re-up |
| Orphaned `Tier` references break typecheck | Med | Delete `Tier` type last after all consumers simplified; `tsc --noEmit` gate |
| Vercel env misconfig repeats the 500 | Med | Verify with a real preview deploy + e2e smoke before closing |

## Rollback Plan

Revert the PR (squash-merged to `develop`). Stripe code is fully recoverable from git history (`sprint-4-stripe-integration` + later commits). DB: re-run the `add_subscription_and_billing` migration to restore schema. Env: re-add Stripe vars from `.env.example` history.

## Dependencies

- Vercel project env vars (DATABASE_URL, GITHUB_ID/SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL) — user-provided.
- Supabase connection string reachable from Vercel (no IP allowlist blocking).

## Success Criteria

- [ ] `geoaudit-tau.vercel.app` serves landing, login, and audit flow with no 500 (digest gone).
- [ ] Audit + PDF download + GitHub login verified end-to-end on the live preview.
- [ ] `grep -ri "stripe\|@/billing" src/` returns zero matches; no dead billing code.
- [ ] FREE limit is 10/30d (single constant), rate limit still 5/60s.
- [ ] `pnpm test` + `pnpm run lint && pnpm run typecheck && pnpm run build` green.

## Open Questions

1. **Fate of multi-page audit & share links** (currently PRO-gated): make them FREE for everyone under the 10/30d limit (recommended — matches "single FREE flow"), or remove them and keep only single-page + PDF? "PDF stays as-is" is unambiguous; the other two PRO features are not.
2. **Landing pricing section**: `/pricing` is deleted — remove the landing teaser + "Ver Planes" CTA entirely, or repoint it to signup?
