```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:02aec3d2022a8998fd2a54943de76e119494e04aad6305b14200254d48eeb59b
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 5/5
scenarios: 16/16
test_command: pnpm test
test_exit_code: 0
test_output_hash: sha256:4a279fbe5b733974173c03ece8d68ae4733998627a0d0359515cf524767283a0
build_command: pnpm run typecheck
build_exit_code: 0
build_output_hash: sha256:8366207267355d3e3d5bf3bf6e8c94c5f93f6078c34f08973fa2b38cdda6cc92
```

## Verification Report

**Change**: sprint-19-schema-up
**Version**: N/A (delta specs, no version field)
**Mode**: Strict TDD

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 21 |
| Tasks complete | 21 |
| Tasks incomplete | 0 |

### Build & Tests Execution

**Build**: ➖ Not run (repo convention — never build after changes). Type-check used as the build gate.

**Type-check**: ✅ Passed
```text
$ pnpm run typecheck  →  tsc --noEmit  (exit 0, no errors)
```

**Lint**: ✅ Passed
```text
$ pnpm run lint  →  eslint  (exit 0, no warnings/errors)
```

**Tests**: ✅ 1058 passed / ❌ 0 failed / ⚠️ 4 skipped
```text
$ pnpm test  →  vitest run
Test Files  115 passed | 1 skipped (116)
      Tests  1058 passed | 4 skipped (1062)
```

**Engine fixture (one-shot)**: ✅ `scoreSchema(page("ld-landing-93.html"))` → `businessType === "publisher"`, `score === 93`
```text
$ pnpm vitest run src/schema/__tests__/index.test.ts -t "pins the sprint-19 landing mirror"
Test Files  1 passed (1)
      Tests  1 passed | 16 skipped (17)
```

**Coverage**: ➖ Not available (no coverage tool configured in `package.json`).

### Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| LND-9 (MODIFIED) | Relevy Organization + WebSite | `src/app/__tests__/page.test.tsx` > emits Organization and WebSite | ✅ COMPLIANT |
| LND-9 | Recommended properties populated with real data | `src/app/__tests__/page.test.tsx` > recommended Organization properties (LND-9) | ✅ COMPLIANT |
| LND-9 | Founder Person carries the five real sameAs profiles | `src/lib/brand.test.ts` > five real sameAs profiles / FOUNDER by reference | ✅ COMPLIANT |
| LND-9 | No authoritativeness double-count | `src/lib/brand.test.ts` > shares ORG_SAME_AS by reference (D2 dedupe) | ✅ COMPLIANT |
| LND-9 | Real org attributes trace to brand constants | `src/lib/brand.test.ts` > ORG_AREA_SERVED/ORG_INDUSTRY/ORG_EMPLOYEES | ✅ COMPLIANT |
| LND-9 | sameAs scores 15/15 with five real profiles | `src/schema/__tests__/index.test.ts` > ld-landing-93 pins `same_as: 15` | ✅ COMPLIANT |
| LND-9 | No invented award | `src/app/__tests__/page.test.tsx` > `org.award` undefined + no `"award"` | ✅ COMPLIANT |
| LND-19.2 (ADDED) | Article node served with real fields | `src/app/__tests__/page.test.tsx` > emits Article block (LND-19.2) | ✅ COMPLIANT |
| LND-19.2 | Article satisfies article_author and publisher | `src/schema/__tests__/index.test.ts` > `article_author: 10` + `business_type_schema: 10` + publisher | ✅ COMPLIANT |
| LND-19.3 (ADDED) | speakable selector references a real element | `src/app/__tests__/page.test.tsx` > `#case-study` present in served HTML | ✅ COMPLIANT |
| LND-19.3 | speakable criterion satisfied | `src/schema/__tests__/index.test.ts` > ld-landing-93 pins `speakable: 5` | ✅ COMPLIANT |
| LND-19.4 (ADDED) | No award emitted, gap documented | `src/app/__tests__/page.test.tsx` + fixture `organization_person: 13` | ✅ COMPLIANT |
| DASH-19.1 (ADDED) | Dashboard root breadcrumb | `src/app/dashboard/__tests__/page.test.tsx` > Home > Dashboard | ✅ COMPLIANT |
| DASH-19.1 | Audit detail breadcrumb | `src/app/dashboard/audits/[id]/__tests__/page.test.tsx` > Home > Dashboard > Auditoría | ✅ COMPLIANT |
| DASH-19.1 | Profile breadcrumb | `src/app/dashboard/profile/__tests__/page.test.tsx` > Home > Dashboard > Perfil | ✅ COMPLIANT |
| DASH-19.1 | Breadcrumbs criterion satisfied | `src/schema/__tests__/index.test.ts` > ld-rubric-rich @graph (BreadcrumbList → 98 incl. breadcrumbs 5) | ✅ COMPLIANT |

**Compliance summary**: 16/16 scenarios compliant

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| LND-9 sameAs 3→5 | ✅ Implemented | `ORG_SAME_AS` (brand.ts:31-37) = 5 real profiles incl. TikTok `@ezefernandezdev` + `github.com/ezefernandezyf/relevy`; FOUNDER inherits by reference |
| LND-19.2 Article | ✅ Implemented | `ArticleJsonLd()` (page.tsx:131-158) `@type:"Article"` (NO TechArticle), headline/dates from `LANDING_COPY`, author=FOUNDER, publisher Relevy |
| LND-19.3 speakable | ✅ Implemented | `speakable.cssSelector: ["#case-study"]` + `id="case-study"` on the Case Study recuadro (page.tsx:710) |
| LND-19.4 award omitted | ✅ Implemented | No `award` anywhere; brand.ts comment documents `missing_recommended` 13/15 honesty |
| DASH-19.1 breadcrumbs | ✅ Implemented | `BreadcrumbListJsonLd` (ui/breadcrumb-list-json-ld.tsx) injected in 3 dashboard routes with honest trails |

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| ArticleJsonLd as local function in page.tsx | ✅ Yes | Follows existing OrganizationJsonLd/WebSiteJsonLd pattern |
| BreadcrumbListJsonLd as shared component | ✅ Yes | `src/ui/breadcrumb-list-json-ld.tsx`, used 3× |
| Article data literal inline (no Zod) | ✅ Yes | Traces to `LANDING_COPY` + `FOUNDER` (`as const`) |
| `id="case-study"` on recuadro div (not section) | ✅ Yes | page.tsx:709-711 |
| Breadcrumb `item` absolute on all items | ✅ Yes | `${APP_URL}${path}` for every ListItem; audit terminal resolves real route |

### TDD Compliance

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | apply-progress (#1911) describes RED→GREEN per WU (prose, not the strict 5-column table) |
| All tasks have tests | ✅ | 9 test files modified/added across the 4 WUs |
| RED confirmed (tests exist) | ✅ | brand.test.ts, page.test.tsx, 3× dashboard page.test.tsx, index.test.ts all present |
| GREEN confirmed (tests pass) | ✅ | 1058 passed / 0 failed |
| Triangulation adequate | ✅ | sameAs/Article/speakable/breadcrumb each asserted with distinct value expectations |
| Safety Net for modified files | ✅ | Existing tolerant assertions (`>=2` blocks, `toContain`) unchanged and green |

**TDD Compliance**: 6/6 checks passed (format deviation noted in WARNINGs)

### Test Layer Distribution

| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | ~20 | brand.test.ts, schema/__tests__/index.test.ts | vitest |
| Integration | ~15 | page.test.tsx, 3× dashboard page.test.tsx | vitest + @testing-library/react |
| E2E | 0 | — | not run (Playwright configured, out of scope for this change) |
| **Total** | **1058** | **115 passed / 1 skipped** | |

### Changed File Coverage

Coverage analysis skipped — no coverage tool detected (no `coverage` script, no `@vitest/coverage` in devDependencies).

### Assertion Quality

✅ All assertions verify real behavior. No tautologies, no ghost loops, no type-only-only assertions, no smoke-test-only checks, no implementation-detail coupling, no mock-heavy tests. Every assertion binds a concrete expected value (e.g. `toEqual(5 profiles)`, `toBe(93)`, `not.toContain("TechArticle")`, `querySelector("#case-study") !== null`).

### Quality Metrics

**Linter**: ✅ No errors (eslint exit 0)
**Type Checker**: ✅ No errors (tsc --noEmit exit 0)

### Issues Found

**CRITICAL**: None

**WARNING**:
1. TDD Cycle Evidence is reported as per-WU prose in `apply-progress` rather than the strict `TDD Cycle Evidence` table (RED/GREEN/TRIANGULATE/SAFETY NET/REFACTOR columns) expected by `strict-tdd-verify.md`. Substance is present (RED→GREEN described per WU with test names) and all tests exist and pass, but RED-first ordering is asserted by the apply agent, not independently verifiable from the git DAG (each WU committed test+impl atomically).

**SUGGESTION**:
1. `proposal.md` "Modified Capabilities" still uses pre-final requirement IDs (`REQ-19.1/19.2/19.3`) that diverge from the final delta spec IDs (`LND-19.2/19.3/19.4`, `DASH-19.1`). Cosmetic doc drift; the delta specs are authoritative.
2. `DASH-19.1` "Breadcrumbs criterion satisfied" is covered indirectly (engine criterion via `ld-rubric-rich.html` → breadcrumbs 5, plus 3 dashboard structure tests). No test runs `scoreSchema` over a served dashboard BreadcrumbList end-to-end — acceptable by design (the dogfood crawl never sees the authenticated dashboard), but a future triangulation could pin it.

### Verdict

PASS WITH WARNINGS
All 5 requirements and 16 scenarios are covered by passing runtime tests (1058 passed / 0 failed), lint and typecheck are clean, and the engine fixture pins `score === 93` with `businessType === "publisher"`. The single WARNING is a TDD-evidence reporting-format deviation, not a functional or spec gap.
