# Tasks — Sprint 18: Remove PDF export feature

Change: `2026-09-05-sprint-18-remove-pdf` · Mode: Strict TDD (feature removal — tests removed with code; suite stays green) · Artifacts: both

## Work Unit 1 — Remove PDF pipeline + route

- [x] **1.1** Delete `src/pdf/` entirely (render.ts, report-template.ts, __tests__/*)
- [x] **1.2** Delete `src/app/api/report/[id]/pdf/route.ts` + `__tests__/route.test.ts`
- [x] **1.3** Commit `feat(pdf): remove pdf pipeline and export route` (08ae423)

## Work Unit 2 — Remove PDF export threading in report layer

- [x] **2.1** `toGeminiViewModel.ts`: remove `exportPdfHref` + `exportAnonCta` from `ViewModelContext`
- [x] **2.2** `audit-report.tsx`: remove the PDF-10 export entry block + unused imports (FileDown/Link/REPORT_COPY); keep ShareModal
- [x] **2.3** `audit-runner.tsx`: remove PDF href threading (`persistedId` → ctx) and PDF-10 comment; KEEP `prisma.audit.create` persistence
- [x] **2.4** Update tests: remove PDF-10 describe in `audit-report.test.tsx`; remove PDF-10 tests + anon PDF CTA assertions in `audit-runner.test.tsx` (keep the URL-with-.pdf crawler test)
- [x] **2.5** Commit `feat(report): remove pdf export threading from report layer` (adfba19)

## Work Unit 3 — Remove dashboard export button

- [x] **3.1** `dashboard/audits/[id]/page.tsx`: remove "Exportar PDF" `<a>` block + `Download` import + header comment update; keep ShareModal
- [x] **3.2** Update `page.test.tsx`: remove Export PDF assertions (ADP-8) + rename describe; keep ShareModal tests
- [x] **3.3** Commit `feat(dashboard): remove Exportar PDF button from audit detail` (9dca0a6)

## Work Unit 4 — Remove PDF benefit copy + historical comments

- [x] **4.1** `copy.ts`: remove 3 "exportación a PDF" benefit mentions + entire `REPORT_COPY.export` block; reword sentences naturally
- [x] **4.2** Historical comments: `brand.ts`, `domain-metrics.ts`, `calculator.ts`, `brand.test.ts`, `domain-metrics.test.ts`
- [x] **4.3** Commit `chore(copy): remove pdf benefit copy and historical comments` (9de35a2)

## Work Unit 5 — Remove puppeteer/chromium dependencies

- [x] **5.1** package.json: remove `puppeteer-core`, `puppeteer`, `@sparticuz/chromium-min` + `pnpm install`
- [x] **5.2** `next.config.ts`: remove PDF-8 bundle config (serverExternalPackages + outputFileTracingIncludes referencing deleted packages)
- [x] **5.3** Verify no remaining imports of the packages anywhere (grep) — only `src/pdf/` (deleted) imported them
- [x] **5.4** Commit `chore(deps): remove puppeteer and chromium-min dependencies` (03ceacf)

## Work Unit 6 — Specs + E2E cleanup

- [x] **6.1** Delete `openspec/specs/pdf-export/spec.md` (capability no longer exists); no root index/README to update
- [x] **6.2** app-shell + landing-page specs: no PDF references (verified, no change needed)
- [x] **6.3** Clean export-feature references in audit-detail (ADP-8), e2e-testing (E2E-5), deploy-vercel (DPV-4), performance, audit-limits, audit-orchestrator, audit-presenters
- [x] **6.4** Delete `e2e/pdf-download.spec.ts` (tests removed feature)
- [x] **6.5** Keep crawler content-type tests/specs untouched (fetch-types, fetch index, run-audit-edge-cases, RAO-13, RFL-8)
- [x] **6.6** Commit `docs(openspec): remove pdf-export capability and its spec references` (e2253fb)

## Final Gate

- [x] `pnpm test` → 115 passed | 1 skipped, 1049 passed | 4 skipped (exit 0)
- [x] `pnpm run lint` → clean (exit 0)
- [x] `pnpm run typecheck` → clean (exit 0)
- [x] `pnpm run build` → clean (exit 0; PDF route gone from route table)

**Note**: Not creating the PR — orchestrator will launch verify.
