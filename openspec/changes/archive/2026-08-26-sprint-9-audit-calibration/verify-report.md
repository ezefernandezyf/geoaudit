```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:894c1541c46f2787e89a0fc835fc7fe7b25af1028694169e5b8ec48f34c43404
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 16/16
scenarios: 32/32
test_command: pnpm test
test_exit_code: 0
test_output_hash: sha256:3a9b0812fc336c826424c9e09664a3ea0c4fd9bcac4d0f9bdd742261b7453e2f
build_command: pnpm run typecheck
build_exit_code: 0
build_output_hash: sha256:8366207267355d3e3d5bf3bf6e8c94c5f93f6078c34f08973fa2b38cdda6cc92
```

## Verification Report

**Change**: sprint-9-audit-calibration
**Mode**: Standard verify (Strict TDD runner present but not declared active for this phase)
**Persistence**: both (OpenSpec + Engram)
**Evidence revision**: `1aa2f57` (feat/s9-wu4, tip of the WU-1..4 chain)

### Completeness

| WU | Tasks | Complete | Pending |
|----|-------|----------|---------|
| WU-1 | 1.1–1.8 | 8/8 | — |
| WU-2 | 2.1–2.3 | 3/3 | — |
| WU-3 | 3.1–3.13 | 13/13 | — |
| WU-4 | 4.1–4.7 | 6/7 | 4.7 (gate — executed by this verifier, see below) |

Task 4.7 is the full-suite gate (`pnpm test` + lint + typecheck + build). This verifier executed the required gate commands (test/typecheck/lint) and they pass; the `[x]` mark on 4.7 remains bookkeeping for the orchestrator. `build` is intentionally not run per the repo convention (AGENTS.md: "Never build after changes").

### Build & Tests Execution

**Tests**: ✅ 1008 passed / ❌ 0 failed / ⚠️ 1 skipped (1009 total)
```text
$ pnpm test   (vitest run)
Test Files  126 passed (126)
     Tests  1008 passed | 1 skipped (1009)
```
Skipped (documented skip-if-no-env): `src/lib/__tests__/prisma.test.ts` (needs `DATABASE_URL`). The `a11y-contrast.test.ts` E2E RAN against the live dev server on `:3000` (server reachable, security headers present — confirmed via curl) and passed.

**Typecheck**: ✅ Passed (exit 0)
```text
$ pnpm run typecheck   (tsc --noEmit)
```

**Lint**: ✅ 0 errors, 1 warning (generated artifact, non-blocking)
```text
$ pnpm run lint   (eslint)  → exit 0
coverage/block-navigation.js 1:1 warning Unused eslint-disable directive
```

**Coverage**: ➖ Not gated (informational only).

### Spec Compliance Matrix (16 requirements / 32 scenarios)

| Requirement | Scenario | Covering test | Result |
|-------------|----------|---------------|--------|
| RGS-1 | All engines score 80 | `calculator.test.ts > "RGS-1: all engines at 80 → composite 80"` | ✅ COMPLIANT |
| RGS-1 | Citability stays dominant | `calculator.test.ts > "RGS-1: v2 weights keep citability dominant and sum to 100"` | ✅ COMPLIANT |
| RGS-1 | Weights reflect calibration decision | `calculator.test.ts > "weights config defaults to GEO_SCORE_V2_WEIGHTS"` + `"keeps SPRINT_1_WEIGHTS as historical"` | ✅ COMPLIANT |
| RGS-5 | Score 92 → Excellent | `calculator.test.ts > "RGS-4/RGS-5: 92.3 → rounds to 92 → Excellent"` | ✅ COMPLIANT |
| RGS-5 | Score 74 → Fair | `calculator.test.ts > "RGS-4/RGS-5: 73.8 → rounds to 74 → Fair"` | ✅ COMPLIANT |
| RGS-5 | Score 39 → Critical | `calculator.test.ts > "RGS-5: 39 → Critical"` | ✅ COMPLIANT |
| RGS-5 | Score 100 cap | `calculator.test.ts > "RGS-4: 103 → capped at 100 → Excellent"` | ✅ COMPLIANT |
| RGS-5 | Recalibration does not shift bands | `calculator.test.ts > "RGS-6 severity band boundaries follow P3 (90/75/60/40)"` | ✅ COMPLIANT |
| RGS-7 | Version field present | `audit-result.test.ts > "rejects scoringModelVersion other than 2.0.0"` + `run-audit.test.ts > "completes…Zod-valid"` | ✅ COMPLIANT |
| RCI-3 | Definition pattern detected | `scorer.test.ts > "scores a definition-pattern block >= 70…"` | ✅ COMPLIANT |
| RCI-3 | No answer pattern | `scorer.test.ts > "scores a narrative block… < 40"` | ✅ COMPLIANT |
| RCI-3 | Partial answer pattern | `scorer.test.ts > "awards intermediate credit for a definition whose answer is buried"` | ✅ COMPLIANT |
| RCI-5 | Partial structure earns intermediate credit | `scorer.test.ts > "awards intermediate credit when only some paragraphs are in the band"` | ✅ COMPLIANT |
| RCI-6 | Stats-rich block | `scorer.test.ts > "scores a stats-rich block >= 70…"` | ✅ COMPLIANT |
| RCI-6 | Partial stat block | `scorer.test.ts > "awards intermediate credit to a partial-stat block"` | ✅ COMPLIANT |
| RCI-6 | Stats-poor block | `scorer.test.ts > "scores a stats-poor block <= 10…"` | ✅ COMPLIANT |
| REE-3 | Partial authority earns intermediate credit | `authoritativeness.test.ts > "awards sameAs credit without authority citations (REE-3 partial)"` | ✅ COMPLIANT |
| REE-3 | Full authority signals | `authoritativeness.test.ts > "approaches the cap with authority citations and sameAs links"` | ✅ COMPLIANT |
| RSC-13 | Partial schema earns intermediate credit | `schema/__tests__/index.test.ts > "awards intermediate credit…"` + `"awards partial credit for a WebSite node without SearchAction"` | ✅ COMPLIANT |
| RSC-13 | Full schema earns the cap | `schema/__tests__/index.test.ts > "scores a full @graph page 98 with 12 criteria"` | ✅ COMPLIANT |
| LND-7 | Verified evidence shown | `page.test.tsx > renders SCOREHERO_EVIDENCE` (score 46 + auditDate + categoryScores) | ✅ COMPLIANT |
| LND-7 | No candidate reaches 90+ | `page.test.tsx > band derived from severityForScore` | ✅ COMPLIANT |
| LND-9 | Organization + WebSite present | `page.test.tsx` (inline `application/ld+json` Organization+WebSite+sameAs, SSR) | ✅ COMPLIANT |
| LND-10 | Assets served at root | `crawl-assets.test.ts` (robots.ts/sitemap.ts/llms.txt) | ✅ COMPLIANT |
| LND-11 | Answer-first copy with stats | `copy.test.ts` (LANDING_COPY hero/features answer-first + ≥1 stat) | ✅ COMPLIANT |
| LND-12 | Trust signals present | `footer.test.tsx` (terms/privacy/contact, HTTPS) | ✅ COMPLIANT |
| A11Y-6 | Progress bar is named | `a11y-contrast.test.ts` (`aria-progressbar-name` on ScoreBar fill) | ✅ COMPLIANT |
| A11Y-6 | Contrast and label mismatches resolved | `a11y-contrast.test.ts` (`color-contrast` + `label-content-name-mismatch` on landing/pricing/report) | ✅ COMPLIANT |
| SHL-7 | CSP + HSTS emitted | `a11y-contrast.test.ts > "sends the SHL-7 security headers"` | ✅ COMPLIANT |
| SHL-7 | CSP report-only before enforce | `next.config.ts` `Content-Security-Policy-Report-Only` (asserted in header test) | ✅ COMPLIANT |
| DSH-4 | New user sees a neutral empty state | `dashboard-empty-state.test.tsx > renders DASHBOARD_COPY.empty` | ✅ COMPLIANT |
| DSH-4 | No voseo in empty state | `dashboard-empty-state.test.tsx > "renders no voseo forms"` | ✅ COMPLIANT |

**Compliance summary**: 32/32 scenarios compliant — every scenario has a covering test that passed at runtime in the full suite.

### Correctness (Static Evidence)

| Decision (proposal/design) | Status | Notes |
|----------------------------|--------|-------|
| WU-1 JSON-LD inline SSR (Organization+WebSite+SearchAction+sameAs) | ✅ Implemented | `page.tsx` `OrganizationJsonLd`/`WebSiteJsonLd` inline `<script type="application/ld+json">` in the server component (`dynamic="force-dynamic"`); `extractJsonLd` + `server_rendered` criterion satisfied |
| WU-1 robots.ts allows AI crawlers | ✅ Implemented | `src/app/robots.ts` explicit `Allow /` for 17 bots + `*`; sitemap reference |
| WU-1 sitemap.xml | ✅ Implemented | `src/app/sitemap.ts` derives 4 public routes |
| WU-1 llms.txt | ✅ Implemented | `public/llms.txt` (title + summary + links) |
| WU-1 copy answer-first + stats | ✅ Implemented (⚠️ stale weights) | `LANDING_COPY` answer-first with stats; the percentage stats are pre-calibration v1 values (see WARNING) |
| WU-1 E-E-A-T (contacto/citas) | ✅ Implemented | `footer.tsx` terms/privacy/`mailto:` contact; landing external docs citations |
| A3.2 SCOREHERO_EVIDENCE real | ✅ Implemented (⚠️ stale weights) | `score-hero-evidence.ts` = stripe.com 46 (verified 2026-08-26) + `auditDate` + `categoryScores`, no placeholder; category weight labels are v1 |
| WU-2 diagnosis | ✅ Implemented | `docs/calibration-diagnosis.md` real 14-URL breakdown + post-calibration re-run |
| WU-3 scoringModelVersion 2.0.0 | ✅ Implemented | `audit-result.ts:88` `z.literal("2.0.0")`; casts `audit/index.ts:205/366/474`; fixture `:92`; `ENGINE_WEIGHT` from V2 |
| WU-3 weights 28/24/20/14/14 | ✅ Implemented | `GEO_SCORE_V2_WEIGHTS`; `SPRINT_1_WEIGHTS` kept for legacy |
| WU-3 citability partial credit | ✅ Implemented | `scorer.ts` answer/structure/stats tiers (`ANSWER_BASE_SCORE=20`, partial bonuses) |
| WU-3 eeat partial authority | ✅ Implemented | `authoritativeness.ts` `SAMEAS_PER_HIT=5` (cap 10) independent of citations |
| WU-3 schema intermediate points | ✅ Implemented | `index.ts` criteria 1/5/10/11 (15/13/10/7, 5/2, 10/7, 5/2) |
| WU-3 bands 90/75/60/40 intact | ✅ Implemented | `severityForScore` unchanged |
| WU-4 security headers | ✅ Implemented | `next.config.ts` CSP-Report-Only + HSTS + nosniff + Referrer-Policy + Permissions-Policy on `/(.*)` |
| WU-4 voseo removed + component test | ✅ Implemented | `dashboard-empty-state.tsx` consumes `DASHBOARD_COPY.empty`; new `dashboard-empty-state.test.tsx` |
| WU-4 4+ a11y fixes | ✅ Implemented | ScoreBar aria-label + `/100 #64748b`; badge `#047857`; navbar brand label (exact textContent match); hero/No-medido `#64748b` |
| WU-4 README + docs | ✅ Implemented | Real product README (v2.0.0 weights table); `.env.example`/`AGENTS.md` stale comments fixed |
| No-regression (contracts/auth/prisma/billing/middleware/engine) | ✅ Verified | Full suite 1008 pass; only the intended recalibration changed engine scores |
| Recalibration intentional (not fudged) | ✅ Verified | `calculator.test.ts` asserts v2 weights exactly (28/24/20/14/14), `rejects "1.0.0"/"0.9.0"`, keeps legacy `SPRINT_1_WEIGHTS` test; spec example `(60×.28+90×.24+50×.20+100×.14+40×.14)=68` |

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| JSON-LD via inline SSR `script`, not client JS | ✅ Yes | `page.tsx` server component blocks |
| Schemas Organization+WebSite(+SearchAction)+sameAs | ✅ Yes | matches LND-9 + schema criterion 5 |
| robots/sitemap via App Router metadata routes (`app/robots.ts`) | ✅ Yes | implemented in `src/app/robots.ts` (project uses `src/app/`) |
| llms.txt static in `public/` | ✅ Yes | `public/llms.txt` |
| A3.2 real evidence (never invented) | ✅ Yes | stripe.com 46 verified, honest band |
| WU-2 port into `scripts/scorehero-verify.test.ts` | ✅ Yes | 14 `CANDIDATE_URLS` + `categories` + per-category print |
| Calibration = soften rubrics (b) + rebalance (c), never band re-map (a) | ✅ Yes | rubrics partial-credit + weights 28/24/20/14/14; bands locked |
| v2 weights citability dominant | ✅ Yes | 28 vs 24/20/14/14 |
| Keep `SPRINT_1_WEIGHTS` for historical tests | ✅ Yes | legacy test preserved |
| CSP report-only first | ✅ Yes | `Content-Security-Policy-Report-Only` header |
| Literal propagates to all readers | ✅ Yes | contract + 3 casts + fixture + `ENGINE_WEIGHT`; PDF/presenters derive via `ENGINE_WEIGHT` |

### Issues Found

**CRITICAL**: None.

**WARNING**:
1. **Stale v1 weight percentages in user-facing landing copy + ScoreHero evidence** — `src/lib/copy.ts` feature cards (`18.75 %`, `31.25 %`, `25 %`, `12.5 %`, `12.5 %`) and `src/app/score-hero-evidence.ts` `categoryScores` weight labels (`18.75%`/`31.25%`/`25%`/`12.5%`/`12.5%`) still show the pre-calibration SPRINT_1 weights, while the engine, README and canonical spec now use v2.0.0 (28/24/20/14/14). Root cause: WU-1 (copy + A3.2) shipped before WU-3 (calibration) and was never re-synced. The landing — the sprint's dogfooding target — displays factually incorrect weight percentages. LND-11/LND-7 are technically satisfied (answer-first + stats; real verified score), but the specific numbers are wrong.
2. **Task 4.7 unmarked** in `tasks.md` — the full-suite gate. This verifier executed the gate (test/typecheck/lint all green); the `[x]` remains bookkeeping for the orchestrator/gatekeeper.
3. **Proposal success criteria "best real sites 60-75+" not reached** — post-calibration best is moz.com 53 (poor), honestly documented in `docs/calibration-diagnosis.md §Post-calibration`. Not a defect: the diagnosis explains it structurally (10/12 sites ship zero JSON-LD, so partial-credit rubrics cannot fire). The "landing 20→60+" criterion is also deferred to a post-deploy re-audit (documented TODO). Both are outcome misses, not requirement violations.

**SUGGESTION**:
1. Lint emits 1 warning in `coverage/block-navigation.js` (generated coverage artifact, not source). Ensure `coverage/` is gitignored/excluded from lint for a 100% clean gate.
2. After deploying WU-1 + WU-3 to production, re-run `pnpm verify:scorehero` against the landing to (a) capture the real post-fix A3.2 evidence and (b) re-sync `LANDING_COPY.features` and `SCOREHERO_EVIDENCE.categoryScores` weights to v2.0.0 — closing WARNING #1 and the A3.2 TODO in one pass.

### Verdict

**PASS WITH WARNINGS** — All 16 requirements and 32 scenarios implemented and covered by passing tests; full suite green (1008 passed / 1 env-gated skip), typecheck clean, lint 0 errors. The recalibration is intentional and internally coherent (contract literal, weights, rubrics, band thresholds, legacy weights). Three non-blocking warnings remain: stale v1 weight labels on the landing (pre-calibration residue), the unmarked 4.7 gate task, and the honestly-documented outcome miss on the 60-75+ discrimination target.
