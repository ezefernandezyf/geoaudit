# Tasks: Sprint 10 - Free Mode

## Review Workload Forecast

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

## WU-1: Billing Removal - PR 1 - ~1,900 lines - test: `pnpm typecheck && pnpm test` - harness: local suite - rollback: git revert

- [ ] 1.1 Delete `src/billing/` (8+8 tests) + `src/app/api/webhooks/stripe/` (+test) - BLG-4..8
- [ ] 1.2 Delete `src/app/pricing/` (+2 tests) + `/pricing` refs (`sitemap.ts`, `og.ts`, a11y/crawl tests) - PRC-1..8
- [ ] 1.3 Delete `billing-cta.tsx` (+test); drop `BillingCta`/`portalAction` in dashboard/profile - DSH-6
- [ ] 1.4 Delete `e2e/stripe-checkout.spec.ts`, `docs/stripe-test-setup.md`, `stripe` dep - E2E-4
- [ ] 1.5 Gate: `rg -ri "stripe|@/billing" src/` empty; typecheck + test green

## WU-2: Lift PRO Gates - PR 2 - ~700 lines - test: `pnpm test -- src/lib/audit src/ui/__tests__/navbar.test.tsx` - harness: unit suite - rollback: revert rewrites

- [ ] 2.1 `share-actions.ts` + `multi-page-actions.ts` (+tests): remove gate/lookup; drop `"upgrade"` - SHR-3, MPA-8
- [ ] 2.2 `multi-page-persist.ts` (+test): drop `recordPaidAudit`; tx no `PaidAuditTx` - TLM-10
- [ ] 2.3 `pdf/route.ts` + `audit-runner.tsx` (+tests): no tier gate; export/create always - PDF-3/9, TLM-4
- [ ] 2.4 `audits/[id]/page.tsx`, share-modal, `multipage/page.tsx`, `multi-page-form.tsx` (+tests): ungated share/PDF/multi-page - ADP-7/8, MPU-2/3
- [ ] 2.5 `nav-plan.ts` (+test): `{used,limit}`; navbar/nav-links/footer (+tests): "Free" pill, multi-page link - SHL-2/MPU-6
- [ ] 2.6 `copy.ts`: drop `upgrade` + PRO wording - TLM-5
- [ ] 2.7 Gate: `pnpm typecheck` green

## WU-3: Collapse Tier Layer - PR 3 - ~350 lines - test: `pnpm test -- src/lib/audit/__tests__/tier.test.ts src/lib/audit/__tests__/enforcement.test.ts` - harness: unit suite - rollback: revert tier files

- [ ] 3.1 RED `tier.test.ts`: limit 10, 9 ok / 10 blocked - TLM-2
- [ ] 3.2 GREEN `tier.ts`: limit/window/count/hasLeft; delete paid helpers
- [ ] 3.3 RED `enforcement.test.ts`: blocks at 10 - TLM-3
- [ ] 3.4 GREEN `enforcement.ts`: FREE-only `checkTierLimit`; delete paid tx
- [ ] 3.5 Delete `feature-gate.ts` (+test) - TLM-9
- [ ] 3.6 Gate: typecheck + test green

## WU-4: Contracts + Schema - PR 4 - ~250 lines - test: `pnpm run prisma:generate && pnpm typecheck` - harness: `prisma migrate dev` (Supabase) - rollback: re-run `add_subscription_and_billing`

- [ ] 4.1 Delete `contracts/billing.ts` (+test) - BLG-1
- [ ] 4.2 `schema.prisma`: drop models/enums/`User.tier`; keep `RateLimitEntry` - R4
- [ ] 4.3 Down-migration `--create-only` review; apply; `prisma generate` - DBC
- [ ] 4.4 Gate: typecheck + test green

## WU-5: Landing, Copy, Deploy - PR 5 - ~170 lines - test: `pnpm test && pnpm run lint && pnpm run typecheck && pnpm run build` - harness: live smoke `geoaudit-tau.vercel.app` - rollback: revert config/env

- [ ] 5.1 `page.tsx` (+test): `auth()`; CTA dashboard/"Auditar gratis"; no teaser - LND-6
- [ ] 5.2 `copy.ts`: limit 3->10; delete checkout/pricing copy - TLM-5
- [ ] 5.3 `.env.example`/`ci.yml`/README/AGENTS/config.yaml: drop Stripe refs
- [ ] 5.4 `package.json`: add `build:vercel` (generate + migrate deploy + build) - DPV-2
- [ ] 5.5 `e2e/pdf-download.spec.ts`: drop PRO skip - E2E-5
- [ ] 5.6 Full gate: test + lint + typecheck + build
- [ ] 5.7 Vercel env/Build Command/OAuth callback; smoke audit+login+PDF - DPV-1/3/4