# Tasks: Sprint 5 — Pro Features

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1300 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 4 chained PRs (U1→U4) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Work Units

| Unit | Goal | PR | Focused test command | Harness | Rollback |
|------|------|----|---------------------|---------|----------|
| U1 | Detail + extraction + migration | PR1 | `pnpm vitest run src/report src/dashboard` | `pnpm dev` detail page | migration+page+link |
| U2 | Share links + gate | PR2 | `pnpm vitest run src/lib/audit src/app/share` | `pnpm dev` share/revoke | share code |
| U3 | Multi-page engine+contract+persist | PR3 | `pnpm vitest run src/audit src/lib/fetch src/lib/contracts` | `pnpm dev` multi-page | engine+contract+action |
| U4 | PDF export + config + fonts | PR4 | `pnpm vitest run src/pdf src/app/api` | `pnpm dev` GET pdf | route+config+fonts |

## Unit 1 — Detail page + extraction

- [x] U1.1 RED: RTL `<AuditReport>` renders sections from fixture
- [x] U1.2 GREEN: extract `src/report/audit-report.tsx`; runner imports it (ADP-4/5)
- [x] U1.3 schema: `shareToken` + `AuditPage` (R5/R8/SHR-1)
- [x] U1.4 migrate + generate; verify schema (R4)
- [x] U1.5 RED: `findFirst{id,userId}` → 404 non-owner/missing (ADP-2)
- [x] U1.6 GREEN: `src/app/dashboard/audits/[id]/page.tsx` auth+ownership+result (ADP-1..3)
- [x] U1.7 RTL→GREEN: history row link (DSH-7)

## Unit 2 — Share links

- [x] U2.1 RED: `requirePaidTier` FREE→cta / PRO→allowed (TLM-9)
- [x] U2.2 GREEN: `src/lib/audit/feature-gate.ts` (D7)
- [x] U2.3 RED: create UUID; revoke nulls (SHR-1/4)
- [x] U2.4 GREEN: `src/lib/audit/share-actions.ts` create/revoke+gate (SHR-3)
- [x] U2.5 RED: `/share/[token]` no re-run, no private fields (SHR-2/5)
- [x] U2.6 GREEN: `src/app/share/[token]/page.tsx`; unknown→404 (SHR-6)
- [x] U2.7 RTL: share UI on detail (SHR-3, TLM-9)

## Unit 3 — Multi-page audit

- [x] U3.1 RED: `"sitemap"` kind accepts XML; page/probe reject (MPA-5)
- [x] U3.2 GREEN: extend `FetchKind` + gate (D5)
- [x] U3.3 RED: cap 5, ≤3 in-flight, 1 runAudit/URL, isolation (MPA-1/2/3)
- [x] U3.4 RED: robots→/sitemap.xml; SSRF (MPA-4, threat)
- [x] U3.5 GREEN: `src/audit/multi-page.ts` `runMultiPageAudit` (D6)
- [x] U3.6 RED: `multiPageResultSchema` parses aggregate+pages (D3)
- [x] U3.7 GREEN: additive contract; single-page untouched (MPA-9)
- [x] U3.8 RED: tx 1 Audit + N AuditPage rows (MPA-6/7, TLM-10)
- [x] U3.9 GREEN: action multi-page + tx + gate; FREE CTA (MPA-8, TLM-9)
- [x] U3.10 RTL→GREEN: `multi-page-report.tsx`; detail renders it (D3)

## Unit 4 — PDF export

- [x] U4.1 deps: pin puppeteer-core+chromium-min; approve-builds
- [x] U4.2 fonts: OFL `public/fonts/` (PDF-5)
- [x] U4.3 RED: template tokens+`@font-face` (PDF-5/6)
- [x] U4.4 GREEN: `src/pdf/report-template.ts` (PDF-4)
- [x] U4.5 RED: `printBackground:true`; launch reject→typed (PDF-6, threat)
- [x] U4.6 GREEN: `src/pdf/render.ts` chromium-min, --no-sandbox
- [x] U4.7 RED: route 404/403/200+filename/5xx (PDF-1/2/3/7/9)
- [x] U4.8 GREEN: `src/app/api/report/[id]/pdf/route.ts` nodejs+gate
- [x] U4.9 GREEN: `next.config.ts` externals+tracing (PDF-8)