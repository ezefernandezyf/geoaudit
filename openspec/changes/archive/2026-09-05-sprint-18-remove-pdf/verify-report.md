```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:df387e9da6dc9806f308efa1ec1790fa8c91bd01c6b65c54940024505d10d7bb
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 0/0
scenarios: 0/0
test_command: pnpm test
test_exit_code: 0
test_output_hash: sha256:6472f23b544f69b4f07f6eafddac0281fdd9160615e21643f70e37e608674e3c
build_command: pnpm run build
build_exit_code: 0
build_output_hash: sha256:d68a058ead561e48640abe33596842b2b7100d2fc721069b579a036ba58d6bbe
```

## Verification Report

**Change**: `2026-09-05-sprint-18-remove-pdf`
**Version**: N/A — feature removal, no delta specs (0 requirements, 0 scenarios)
**Mode**: Strict TDD (feature removal — tests removed with code; suite stays green)
**Branch**: `feat/sprint-18-remove-pdf` (6 commits over develop `59a4513`)

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 21 (6 work units + final gate) |
| Tasks complete | 21 |
| Tasks incomplete | 0 |

All six work units are checked complete. No unchecked task blocks full verification.

### Build & Tests Execution

**Build**: ✅ Passed (exit 0)
```text
$ pnpm run build
next build --turbopack  ·  Next.js 15.5.22
✓ Compiled successfully in 7.4s
✓ Generating static pages (10/10)
Route table: /api/report/[id]/pdf is GONE (route removed).
```

**Tests**: ✅ 1049 passed / ❌ 0 failed / ⚠️ 4 skipped (exit 0)
```text
$ pnpm test
Test Files  115 passed | 1 skipped (116)
     Tests  1049 passed | 4 skipped (1053)
```

**Lint**: ✅ clean (exit 0) — `pnpm run lint` produced no output.
**Typecheck**: ✅ clean (exit 0) — `pnpm run typecheck` produced no output.
**Coverage**: ➖ Not applicable — removal change; deleted code has no coverage surface. Surviving 1049-test suite is green.

### Removal Checklist (correctness — independent static evidence)

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| 1 | Feature files gone | ✅ | `src/pdf/`, `src/app/api/report/[id]/pdf/`, `e2e/pdf-download.spec.ts` all absent |
| 2 | No dangling imports | ✅ | `@/pdf/`, `renderPdf`, `buildReportHtml`, `PdfRenderError`, `exportPdfHref`, `exportAnonCta` → 0 matches in `src/` |
| 3 | Report layer clean | ✅ | `toGeminiViewModel` `ViewModelContext` retains only `shareToken`/`auditDate`; `audit-report.tsx` has no export entry/`FileDown`/`REPORT_COPY`; `audit-runner.tsx` no `persistedId` threading, `prisma.audit.create` INTACT (line 72) |
| 4 | Dashboard button gone | ✅ | `audits/[id]/page.tsx` no "Exportar PDF"/`Download`; `ShareModal` intact (lines 14, 130) |
| 5 | Copy cleaned | ✅ | `copy.ts` no "exportación a PDF", no `REPORT_COPY.export`, no `REPORT_EXPORT_COPY` |
| 6 | Deps removed | ✅ | `package.json` no `puppeteer-core`/`puppeteer`/`@sparticuz/chromium-min`; `next.config.ts` no `serverExternalPackages`/`outputFileTracingIncludes` |
| 7 | Crawler preserved | ✅ | `application/pdf` content-type tests intact in `fetch-types.test.ts`, `fetch/index.test.ts`, `run-audit-edge-cases.test.ts` |
| 8 | Specs cleaned | ✅ | `openspec/specs/pdf-export/` deleted; other specs retain only crawler content-type refs (RFL-8, RAO-13) + documented "removed in Sprint 18" notes |
| 9 | Gates green | ✅ | test 1049 / lint / typecheck / build all exit 0 |
| 10 | Working tree clean | ✅ | only `.atl/` caches + `docs/RELEVY-BRAND-BRIEF.md` (pre-existing untracked) + this change dir |

**Removal summary**: 32 files changed, +37 / −1978 lines. All deletions match proposal scope exactly.

### Spec Compliance Matrix

N/A — no delta specs exist for this removal change (0 requirements, 0 scenarios). Scope authority is `proposal.md`; correctness proven by the removal checklist above plus runtime gates.

### Coherence (Design)

N/A — no design artifact was produced for this removal (pure deletion, no architectural decisions).

### Issues Found

**CRITICAL**: None.

**WARNING**:
- `pnpm-lock.yaml` still contains `puppeteer-core@25.8.0` + `@puppeteer/browsers@3.2.1` — but only as **transitive dev dependencies of `lighthouse@13.4.1`** (a pre-existing devDependency for `pnpm run lighthouse`, unrelated to the PDF feature). This is expected/correct: the three *direct* deps were removed, and lighthouse's transitive `puppeteer-core` does NOT enter the serverless function bundle (dev-only). Non-regression, non-blocking.
- Strict TDD was declared active, but no `apply-progress` artifact exists to cross-reference a TDD Cycle Evidence table. For a removal change the meaningful TDD-equivalent — "tests removed with code, suite stays green" — is independently confirmed (1049 passed / 0 failed).

**SUGGESTION**:
- `node_modules/.pnpm/@sparticuz+chromium-min@149.0.0` remains as an orphan directory (absent from `package.json` and `pnpm-lock.yaml`). Stale local artifact; a fresh `pnpm install` prunes it. No effect on CI/Vercel.
- `openspec/config.yaml:6` still lists "Puppeteer" in the historical "declared target" stack line — now stale, documented out-of-scope for this change.
- `src/citability/__fixtures__/page-structure-partial.html:11` contains "PDF" as natural-language fixture content (not a feature reference).
- `src/app/__tests__/a11y-contrast.test.ts:63` references the `~/.cache/puppeteer/` browser cache path as a Playwright fallback executable (pre-existing, untouched, not a feature remnant).

### TDD Compliance (removal)

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ⚠️ | No `apply-progress` artifact present to cross-reference |
| RED confirmed (removal = tests deleted) | ✅ | `audit-report.test.tsx` −30, `audit-runner.test.tsx` −21, `page.test.tsx` −21, `pdf/__tests__/*` and `route.test.ts` deleted |
| GREEN confirmed (suite green) | ✅ | 1049 passed / 0 failed on independent `pnpm test` |
| Crawler safety net (do-not-touch) | ✅ | `application/pdf` content-type tests intact and passing |

**TDD Compliance (removal)**: outcome independently confirmed via re-execution; cycle-evidence table absent (documented process gap, non-blocking).

### Test Layer Distribution

| Layer | Change | Files | Tools |
|-------|--------|-------|-------|
| Integration (RTL) | PDF assertions removed | `audit-report.test.tsx`, `audit-runner.test.tsx`, `page.test.tsx` | vitest + @testing-library/react |
| Unit | PDF unit tests deleted | `src/pdf/__tests__/*`, `route.test.ts`, `copy.test.ts` (export block) | vitest |
| E2E | removed feature's E2E deleted | `e2e/pdf-download.spec.ts` | playwright |
| **Surviving total** | **1049 passed** | **115 files** | vitest |

### Verdict

**PASS WITH WARNINGS**

The PDF export feature is fully and correctly removed: source, route, threading, button, copy, direct dependencies, and specs are gone with no dangling references, the crawler's `application/pdf` content-type behavior is preserved, and all four gates are green (test 1049, lint, typecheck, build). Warnings are non-blocking (transitive dev-only `puppeteer-core` via lighthouse, absent apply-progress cycle table, stale orphan dir + config mention).
