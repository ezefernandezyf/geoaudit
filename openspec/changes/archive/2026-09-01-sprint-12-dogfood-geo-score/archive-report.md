# Archive Report — sprint-12-dogfood-geo-score

**Change**: sprint-12-dogfood-geo-score
**Archived**: 2026-09-01 → `openspec/changes/archive/2026-09-01-sprint-12-dogfood-geo-score/`
**Mode**: hybrid (OpenSpec filesystem + Engram)
**Verdict**: PASS WITH WARNINGS → **CLOSED** (0 CRITICAL, 0 blockers; one documented product exception reconciled in the archived delta spec; one external pending documented, not blocking)

## Final State (at close)

Per the Final-State Authority hierarchy, this report reflects the state AT CLOSE, not the intermediate snapshots:

- **Verify**: PASS WITH WARNINGS, 0 CRITICAL, 0 blockers. Strict envelope validates (verdict `pass_with_warnings`, evidence_revision `sha256:6fcfdfa7984504efebe5cf1c05a8360aa7141549026f988ebb8ce47f13adc83e`, requirements 5/5, scenarios 11/11, `pnpm test` 915 passed / 4 skipped / 0 failed across 112 files, `typecheck` + `lint` exit 0).
- **Merged**: feature branch `feat/sprint-12-dogfood-geo-score` integrated to `develop` AND `main`; **main = develop = `cc01c84`** (pushed to origin). The 6 work commits (516cde0 → e329b73) plus the verify-report commit (`cc01c84 docs(openspec): add sprint 12 dogfood verify report`) are all in both branches.
- **Build**: `pnpm run build` passed at the merge gate before merge (verify-report's "build deferred" row superseded by orchestrator-confirmed final state).
- **Live verification (real network, 2026-09-01)**: re-audit of `relevy.app` shows the schema breakdown at **61 real** (never the old "10" proxy) — RSC-14 propagation confirmed in production; `llms.txt` responds 200 (LND-10 baseline intact); ScoreHero evidence re-pinned to the best real candidate `moz.com` at 53 (poor) with post-fix breakdown.
- **80+ objective**: stretch target of the proposal, to be validated by a final post-deploy re-audit of `relevy.app` (the landing changes are merged but the Vercel deploy is the user's step). The schema-row fix (10→61) is proven and merged; total-score movement is **pending external deploy**, not a code failure.

## Documented Product Exception (reconciled at archive)

**FAQ visible SIN FAQPage JSON-LD** — the spec `LND-13` textually requested a `FAQPage` JSON-LD block; the final product decision emits only the visible FAQ section because the schema engine docks `FAQPage` as deprecated (`deprecated_faqpage`, RSC-7, criterion 12 "No deprecated" −5). The exception is recorded in tasks 2.4/3.2, apply-progress deviation #1, verify-report WARNING #1, and `page.test.tsx:402-412` asserts the absence explicitly.

Per the archive instruction ("reconciled delta specs: the archive records the FINAL state"), the archived delta spec `specs/landing-page/spec.md` was reconciled to reflect the final decision: LND-13 now reads "FAQ section visible, FAQPage JSON-LD omitted (product decision)" and the compliance matrix was updated accordingly. The original wording is preserved in git history (`e329b73`). The canonical `openspec/specs/landing-page/spec.md` received the same reconciled text on merge. Design D4 (verify SUGGESTION #3) was also reconciled in the archived `design.md` for a clean audit trail.

## Gates

- **Native Review Receipt Gate**: `reviewGate` structurally ABSENT in native status — receipt-driven development kill switch OFF, zero review artifacts for this candidate (`reviews/` directory does not exist). Archive proceeded under ordinary repository policy; nothing to read or block on.
- **Task Completion Gate**: `tasks.md` on disk shows **16/16 `[x]`, 0 `[ ]`** (verified before the move). Matches authoritative Engram tasks observation #1848 (16/16 complete) and apply-progress #1849. No reconciliation needed.
- **CRITICAL issues**: 0 in verify-report. No override accepted or needed.
- **Action Context Guard**: `allowedEditRoots = [/home/ezeyf/Escritorio/geo-saas]`; all archive operations stayed inside the workspace root. No `workspace-planning` mode.

## Specs Synced (canonical `openspec/specs/`)

All 3 delta domains had existing canonicals → **merged** (non-delta requirements preserved):

| Domain | Action | Requirements |
|--------|--------|--------------|
| schema-engine | MODIFIED + ADDED | RSC-13 updated (rubric `score` MUST be carried in the shared contract, never a proxy); RSC-14 ADDED (`SchemaResult` exposes engine score 0-100, `toContractResult` maps, `emptySchemaResult` defaults 0) |
| audit-presenters | MODIFIED | APT-6 updated (Datos estructurados uses real `schema.score`; shared derivation web/PDF/findings; new scenario "Derivation is shared across web, PDF, and findings") |
| landing-page | MODIFIED + ADDED | LND-9 updated (Organization gains knowsAbout/founder/address/contactPoint/email/foundingDate with real data); LND-13 ADDED (visible FAQ WITHOUT FAQPage JSON-LD — reconciled product decision, dates/byline/alt) |

Header change lines and Purpose paragraphs updated per domain to record `sprint-12-dogfood-geo-score`; compliance matrices updated. No REMOVED or RENAMED requirements in this change.

## Engram Observations Read (traceability)

- #1843 architecture — `sdd/sprint-12-dogfood-geo-score/proposal`
- #1844 architecture — `sdd/sprint-12-dogfood-geo-score/spec`
- #1845 architecture — `sdd/sprint-12-dogfood-geo-score/design`
- #1848 architecture — `sdd/sprint-12-dogfood-geo-score/tasks` (authoritative 16/16 `[x]`)
- #1849 architecture — `sdd/sprint-12-dogfood-geo-score/apply-progress` (16/16 tasks, TDD evidence, deviations)
- #1850 architecture — `sdd/sprint-12-dogfood-geo-score/verify-report`

## Verification of the Archive Operation

- `diff -r` snapshot (pre-move recursive copy) vs `openspec/changes/archive/2026-09-01-sprint-12-dogfood-geo-score/` → **empty** (byte-identical; only `archive-report.md` added after the readback, additive-only). Verbatim `diff -r` output included in the phase result.
- Active changes dir no longer contains this change (only legacy `sprint-6-ui-redesign` remains, untouched).
- Archived folder contains: proposal.md, design.md, tasks.md (16/16 `[x]`), verify-report.md, specs/ (3 delta domains: schema-engine, audit-presenters, landing-page).

## External Pending (user step, NOT a code failure)

- **Post-deploy re-audit of `relevy.app`**: validate the 80+ total GEO Score objective after Vercel deploys the merged landing changes (FAQ + enriched JSON-LD + dates/byline). The schema-row fix is proven live at 61; total-score movement depends on deploy.

## Debts Transferred to Sprint 13 (Brand Authority) and Launch

1. **Sprint 13 — Brand Authority engine** (6th engine): brand mention scanning across platforms AI systems rely on (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews, Bing Copilot), weighted 20% of the GEO Score. Planned as its own SDD change.
2. **Sprint 14 — Launch**: Stripe production + Sentry production monitoring + marketing.
3. **Sprint-11 debts carried forward**: confirm the manual GitHub repo rename `geoaudit` → `relevy` landed; live smoke of the rebrand on `relevy.app` (visual confirmation on next release).
4. **Verify-report SUGGESTION #2** (stale comment `copy.ts:206-207` reads "backed by the FAQPage JSON-LD"): optional copy cleanup, not merged in this change (no app code touched at archive).

## Intentional-with-Warnings Notes

- Archive proceeded with 0 CRITICAL findings and no user override required. The single WARNING-class item (FAQPage JSON-LD omission) is a documented product decision, not a defect: the visible FAQ IS emitted, the schema engine docks FAQPage as deprecated (RSC-7), and the archived delta spec + canonical spec were reconciled to the final state. The 80+ objective remains external pending (post-deploy re-audit) and is explicitly not asserted in this slice.
- The `next build` row in verify-report was superseded at close: the orchestrator confirmed `pnpm run build` OK at the merge gate before merging to develop/main.

## SDD Cycle Complete

The change has been fully planned (propose → spec → design → tasks), implemented (6 commits, strict TDD, 16/16 tasks), verified (PASS WITH WARNINGS, 915 tests, live schema 61), merged to `develop` and `main` (`cc01c84`), and archived. Ready for the next change (Sprint 13 — Brand Authority).