```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:6fcfdfa7984504efebe5cf1c05a8360aa7141549026f988ebb8ce47f13adc83e
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 5/5
scenarios: 11/11
test_command: pnpm test
test_exit_code: 0
test_output_hash: sha256:f2a6ec364fe8689ac8cb7aba2c4ea9e522b6ed7641e69cf2068a42949aedb73d
build_command: pnpm run lint && pnpm run typecheck
build_exit_code: 0
build_output_hash: sha256:616bec95ff229b4d4492114cab5d8ade788a3c6952116f01ad7ead3dde173d45
```

# Verification Report — sprint-12-dogfood-geo-score

## Verdict

**PASS WITH WARNINGS** — 0 blockers, 0 critical findings. 5/5 requirements and 11/11 scenarios verified against source and passing runtime tests. The schema-score propagation (RSC-14) is complete end-to-end: contract → engine → web/PDF/findings, and the landing emits the real JSON-LD Organization + visible FAQ + dates/byline. The single WARNING is the documented product exception that omits `FAQPage` JSON-LD (the spec LND-13 text literally requests it); the engine docks `FAQPage` as deprecated (RSC-7), so the orchestrator decided visible FAQ only.

## Completeness Table

| Dimension | Artifact | Status | Notes |
|-----------|----------|--------|-------|
| Completeness | proposal, specs, design, tasks | ✅ present | 3 delta specs (5 req / 11 scenarios) |
| Tasks | tasks.md (16/16 `[x]` on disk) | ✅ 16/16 | all checked on disk, matches apply-progress Engram #1849 |
| Correctness | specs → code | ✅ | each requirement matched to source + test |
| Coherence | design → code | ✅ | one documented deviation (FAQPage) breaks no spec intent beyond the acknowledged exception |

## Build / Tests / Coverage Evidence

| Command | Exit | Result |
|---------|------|--------|
| `pnpm test` | 0 | 915 passed / 4 skipped / 0 failed (112 files passed, 1 skipped) |
| `pnpm run typecheck` | 0 | 0 errors (`tsc --noEmit`) |
| `pnpm run lint` | 0 | 0 errors, 1 pre-existing warning (`coverage/block-navigation.js` — generated) |

Coverage: not run as a gating dimension (`coverage_threshold: 0`); not required.

## Spec Compliance Matrix

| Req | Requirement | Implementation Evidence | Covering Test (runtime green) |
|-----|-------------|------------------------|-------------------------------|
| RSC-13 | Partial-credit schema scoring (MODIFIED) | `src/schema/index.ts:159-348` 12-criterion rubric with partial tiers (org 13/10/7, website 2/5, validity 7/10, knowsAbout 2/5) | `schema/index.test.ts:113-156` (98 rich, 64 org, 13 partial, 7 dock, 2 website) |
| RSC-14 | SchemaResult exposes engine score (ADDED) | `audit-result.ts:41-48` `score: z.number().min(0).max(100)`; `schema/index.ts:356-369` `toContractResult` maps `result.score`; `audit/index.ts:140-149` `emptySchemaResult` → `score: 0`; fixture `score: 61` + 9 issues | `schema/index.test.ts:170-177` (carries rubric score); `findings.test.ts` (61→fair) |
| APT-6 | Category scores use real engine outputs (MODIFIED) | `domain-metrics.ts:31-33` `deriveSchemaScore` returns `schema.score ?? 0`; proxy `100 - issues*10` removed; `rowScore` + `deriveFindings` consume it | `domain-scorecard.test.tsx:43,52,59` (`61`, `[71,62,65,61,70]`, `fillOf(61)`); `findings.test.ts:99` |
| LND-9 | JSON-LD Organization + WebSite real data (MODIFIED) | `page.tsx:60-109` Organization (knowsAbout/founder/address/contactPoint/email/foundingDate/sameAs) + WebSite; `brand.ts:28-63` real constants | `page.test.tsx:294-351`; `brand.test.ts:44-83` |
| LND-13 | Content signals: FAQ, dates, byline, alt (ADDED) | `page.tsx:547-591` visible FAQ + `<time dateTime>` + byline; `copy.ts:208-242` FAQ/date/byline | `page.test.tsx:386-436` |

All 11 scenarios map to passing runtime test cases.

## Correctness Table (Static Evidence)

| Check | Result |
|-------|--------|
| Proxy `100 - issues*10` eliminated from src/ | ✅ only comment references documenting its removal (`domain-metrics.ts:29`, `findings.test.ts:98`, fixture `:65`, `score-hero-evidence.ts:22`) |
| `deriveSchemaScore` returns real engine score | ✅ `return schema.score ?? 0` (guard for legacy rows, never the proxy) |
| `emptySchemaResult` → `score: 0` | ✅ `audit/index.ts:147` degraded path |
| Fixture 9 warnings → score 61 (not 10) | ✅ `__fixtures__/audit-result.ts:48-66` |
| Findings severity from real schema score | ✅ `findings.ts:61-63` `severityForScore(deriveSchemaScore(schema))` → 61 "fair" |
| JSON-LD name "Relevy", sameAs real profiles | ✅ `page.tsx:68,73` + `brand.ts:28-32` (GitHub/LinkedIn/portfolio) |
| No FAQPage JSON-LD emitted | ✅ only Organization + WebSite scripts (product decision, RSC-7) |

## Design Coherence Table

| Design Decision | Code | Coherent |
|-----------------|------|----------|
| D1 `score` required in Zod (0-100) | `audit-result.ts:47` | ✅ |
| D2 `deriveSchemaScore` → `schema.score`, proxy deleted | `domain-metrics.ts:31-33` | ✅ |
| D3 fixture `score: 61` + 9 issues | `__fixtures__/audit-result.ts:48-66` | ✅ |
| D4 FAQ + FAQPage — **OVERRIDDEN** (no FAQPage, documented) | `page.tsx:547-591` FAQ visible, no FAQPage | ⚠️ deviation (WARNING) |
| D5 constants in `brand.ts` + `copy.ts` | `brand.ts`, `copy.ts:208-242` | ✅ |
| D6 real dates/byline/alt | `copy.ts:235-242`, `page.tsx:579-590` | ✅ |

## Issues

### WARNING

1. **FAQPage JSON-LD omitted (LND-13 textual deviation)** — the spec `landing-page/spec.md` scenario "FAQ section and FAQPage JSON-LD" requires a `<script type="application/ld+json">` block of `@type FAQPage`. The orchestrator's product decision omits it because the schema engine docks `FAQPage` as `deprecated_faqpage` (RSC-7, criterion 12 "No deprecated" = −5). The visible FAQ IS emitted; the FAQPage JSON-LD is NOT. This is a documented exception, not a defect: the deviation is recorded in tasks 2.4/3.2 and apply-progress deviation #1, and the test `page.test.tsx:402-412` asserts the absence explicitly. Spec remains authoritative; archive must reconcile the delta spec to reflect the decision.

### SUGGESTION

2. **Stale comment in `copy.ts:206-207`** — reads "real Q&A pairs backed by the FAQPage JSON-LD (visible FAQ section)" but FAQPage is not emitted. Clean up to match the decision.
3. **Design D4 not reconciled** — `design.md:14` still states "emitir FAQPage"; the final decision (no FAQPage) lives only in tasks + apply-progress. Archive should update D4 for a clean audit trail.
4. **Alt-text scenario covered vacuously** — the landing renders no `<img>` elements (only `og:image` meta), so `page.test.tsx:428-436` passes trivially. It is a valid future regression guard (will fail when an unlabeled image is added), but proves nothing today. Not a defect; matches design D6.
5. **Working tree not clean** — `.atl/.skill-registry.cache.json`, `.atl/skill-registry.md` (modified) and `docs/RELEVY-BRAND-BRIEF.md` (untracked) are unrelated to this change and were not part of the 6 sprint-12 commits.

## External Pending (user step, NOT a code failure)

- **80+ GEO Score objective** is a stretch target validated by a real re-audit of `relevy.app` post-deploy (proposal success criteria ≥75, ideal 80+). Not verifiable now: the landing evidence is pinned to the best real candidate `moz.com` (53) per the honesty rule (LND-7); the schema-row bug fix is proven (schema shows the real engine 60/61, never the old 10 proxy).

## TDD Compliance (Strict TDD active — `strict_tdd: true`)

| Check | Result |
|-------|--------|
| TDD Evidence reported | ✅ Found in apply-progress TDD Cycle Evidence table (Engram #1849) |
| All tasks have tests | ✅ 16/16 (RED→GREEN per task) |
| RED confirmed (test files exist) | ✅ `schema/index.test.ts`, `page.test.tsx`, `brand.test.ts` present on disk |
| GREEN confirmed (pass on re-run) | ✅ full suite 915 passed / 0 failed |
| Triangulation adequate | ✅ fixture 61 vs degraded 0; rubric 98/64/13/7/2; page FAQ+/FAQPage−/org/dates/byline |
| Safety Net for modified tests | ✅ reported per WU; re-run green |

**TDD Compliance**: 6/6 checks passed.

### Test Layer Distribution

| Layer | Files | Notes |
|-------|-------|-------|
| Unit | `schema/index.test.ts`, `brand.test.ts`, `findings.test.ts`, `domain-scorecard.test.tsx`, `toGeminiViewModel.test.ts`, `top-findings.test.tsx`, `pdf/report-template.test.ts`, `variants.ts` | pure logic + fixtures |
| Integration | `page.test.tsx` | RTL render + JSON-LD payload parse |
| E2E | none in this change | `verify:scorehero` (real network) is a verification harness, not a committed test |

### Assertion Quality

Reviewed the new/changed test files. No tautologies (`expect(true).toBe(true)`), no ghost loops over empty collections with hidden assertions, no mock-heavy imbalance (`page.test.tsx` uses 2 mocks for ~30 behavioral assertions), no smoke-only asserts (each asserts specific content/props). The `img`-alt loop is an empty-collection guard documented as vacuous (SUGGESTION #4). **✅ All assertions verify real behavior.**

## Risks

- `next build` not run at verify — deferred to the orchestrator merge gate (typecheck + lint + full suite green here).
- 80+ objective depends on a real post-deploy re-audit of `relevy.app`; the schema fix is proven but overall score movement is not asserted in this slice.
- The FAQPage omission trades a −5 schema dock for citability upside; net effect only visible in the post-deploy re-audit.

## Key Learnings

1. `deriveSchemaScore` now returns `schema.score ?? 0`, so the `100 - issues*10` proxy is fully removed from the presentation layer.
2. The `schemaResultSchema.score` field is required (0-100), which forces every producer to supply an honest value instead of a reconstructed proxy.
3. The FAQPage JSON-LD omission is a documented product exception driven by the schema engine docking FAQPage as deprecated under RSC-7.
