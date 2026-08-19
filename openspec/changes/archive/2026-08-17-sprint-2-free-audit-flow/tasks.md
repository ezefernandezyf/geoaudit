# Tasks: Sprint 2 — Free Audit Flow

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated lines | ~2,300 |
| 400-line risk | High |
| Chained PRs | Yes |
| Delivery | ask-on-risk |
| Chain | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test | Harness | Rollback |
|------|------|-----------|--------------|---------|----------|
| U1 | Foundation | PR1 | `pnpm test src/ui` | N/A — jsdom-only | Revert PR1 |
| U2 | Landing | PR2 | `pnpm test src/lib/audit` | dev: submit→302 | Revert PR2 |
| U3 | Shell | PR3 | `pnpm test src/app/report` | dev: pulse/empty | Revert PR3 |
| U4 | Report | PR4 | `pnpm test src/report` | N/A — fixture matrix | Revert PR4 |
| U5 | Limits | PR5 | `pnpm test src/lib/rate-limit` | dev: exceed→429 | Revert PR5 / flag |

Tracker `feat/sprint-2-free-audit` (base develop) ← PR1(U1); PR2..PR5 base = prior PR branch; tracker→develop. Prior-PR leakage in child diff → retarget/rebase.

## U1 — Design Foundation (PR1)

- [x] U1.T1 `STYLE-BRIEF.md` (DNF-1) palette/type/spacing/animation/anti-patterns; done: committed
- [x] U1.T2 `src/app/globals.css` `@theme` tokens (DNF-2); done: class test
- [x] U1.T3 `src/app/layout.tsx` fonts, no /dashboard (DNF-3/D6); done: RTL
- [x] U1.T4 `src/ui/skeleton.tsx` (DNF-4) pulse+role=status+motion-reduce; done: RTL
- [x] U1.T5 `src/ui/severity-badge.tsx` (DNF-5) 5 bands→ES labels; done: RTL
- [x] U1.T6 `src/ui/button.tsx` (DNF-7) variants+loading aria-busy; done: RTL
- [x] U1.T7 `src/ui/text-field.tsx` (DNF-8) label+role=alert; done: RTL
- [x] U1.T8 `src/ui/card.tsx` (DNF-6) padding/border/slots; done: RTL

## U2 — Landing + Form + Action (PR2)

- [x] U2.T1 RED `src/lib/audit/__tests__/actions.test.ts`: filter/normalize/redirect (ADF-3/4/5)
- [x] U2.T2 `src/lib/audit/actions.ts`: Zod→filter→normalize→redirect, no audit; done: unit+integration
- [x] U2.T3 `src/ui/audit-form.tsx`: Zod, aria-busy, role=alert (ADF-2/6/7); done: RTL
- [x] U2.T4 `src/app/page.tsx`: landing + form, no dashboard (ADF-1/8); done: page RTL
- [x] U2.T5 Smoke dev: 302 + inline errors

## U3 — Report Shell (PR3)

- [x] U3.T1 `src/app/report/page.tsx`: force-dynamic+nodejs, url→Empty/Suspense (ARU-1/2/5); done: RTL
- [x] U3.T2 `src/app/report/loading.tsx` pulse skeleton (ARU-3); done: RTL
- [x] U3.T3 `src/app/report/error.tsx` boundary+Reintentar (ARU-4); done: RTL
- [x] U3.T4 Smoke dev: streaming (not jsdom-testable)

## U4 — Report MVP (PR4)

- [x] U4.T1 `src/report/audit-runner.tsx`: runAudit+FETCH_ERROR_COPY (ARU-6); done: RTL
- [x] U4.T2 `src/report/score-hero.tsx` score/band/url/duration (ARU-8); done: RTL
- [x] U4.T3 `src/report/domain-scorecard.tsx` 5 rows+"no disponible" (ARU-7/8); done: RTL
- [x] U4.T4 `src/report/top-findings.tsx` top3/bottom3+issues+bots (ARU-8); done: RTL
- [x] U4.T5 `src/report/report-meta.tsx` meta.errors (ARU-7); done: RTL

## U5 — Rate Limit + Polish (PR5)

- [x] U5.T1 RED `src/lib/rate-limit/__tests__/`: window/mock/kill switch (RTL-1/2/7)
- [x] U5.T2 `src/lib/rate-limit/store.ts`: RateLimitStore+InMemoryStore (RTL-2); done: green
- [x] U5.T3 `src/lib/rate-limit/index.ts`: fixed window, IP key, flag bypass (RTL-1/3/7); done: green
- [x] U5.T4 Wire action→429 inline (ADF-9/RTL-4/5)+JSDoc (RTL-6); done: integration
- [x] U5.T5 SHOULD ARU-9: AbortSignal in `src/platform/probes.ts`; defer if tight
- [x] U5.T6 lint+format+test+dev smoke (HARD GATE)

## Order

U1→U2→U3→U4→U5. U1 blocks all; U3 needs U2 (AuditForm empty); U5 needs U2+U4. TDD: RED→GREEN. Streaming/pulse/boundary NOT jsdom-testable → manual smoke.
