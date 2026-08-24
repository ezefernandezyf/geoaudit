# Design: Sprint 5 — Pro Features

## Technical Approach

Add four PRO-gated capabilities on top of the existing single-URL engine without changing `runAudit`: a dynamic detail route + extracted shared `<AuditReport>`, revocable public share links, a sitemap-driven multi-page orchestrator (`runMultiPageAudit`) that reuses `runAudit` per URL, and a Chromium-based PDF export. Additive Prisma migration only; feature-gate via a new `src/lib/audit/feature-gate.ts` over the existing `isPaidTier`.

## Architecture Decisions

| Decision | Options considered | Choice | Rationale |
|---|---|---|---|
| D1: `AuditReport` location | `src/report/audit-runner.tsx` (keep private) vs `src/report/audit-report.tsx` | Extract to `src/report/audit-report.tsx` | SSR component, no `"use client"`; detail/share import it; runner keeps orchestration |
| D2: Ownership query | `findUnique` + compare vs `findFirst({ id, userId })` | `findFirst` where `{ id, userId }` | Non-owner and missing collapse to `null` → single `notFound()` (404) path |
| D3: Master result shape | Full nested results vs aggregate + per-page rows | Master `result` = `{ aggregate, pages: [{url, geoScore, severityBand, durationMs}] }`; each `AuditPage.result` = full `AuditResult` | Keeps master JSON small; `AuditPage` holds the payload; PDF/detail render from aggregate |
| D4: Share token | `crypto.randomUUID()` (server) | `randomUUID()` from `node:crypto` | Unique per audit, nullable revoke, no dep |
| D5: Sitemap fetch | New `kind` vs `acceptXml` flag | Extend `FetchKind` with `"sitemap"` accepting `application/xml|text/xml` | Scopes RFL-8 relaxation to sitemap probes only (MPA-5); page/probe gates unchanged |
| D6: Concurrency pool | New dep (`p-limit`) vs hand-rolled worker | Hand-rolled bounded worker (concurrency 3) | Zero dep; ~20 lines; testable with injected `fetcher` |
| D7: Feature gate | Inline `isPaidTier` calls vs shared helper | `src/lib/audit/feature-gate.ts` `requirePaidTier(tier)` → discriminated `{ allowed } \| { allowed:false, cta }` | One enforcement point across actions/routes/UI (TLM-9) |

## Data Model (schema.prisma — additive)

```prisma
model Audit {
  // ...existing fields unchanged
  shareToken String?     @unique
  pages      AuditPage[]
}

model AuditPage {
  id           String   @id @default(cuid())
  auditId      String
  url          String
  position     Int
  geoScore     Int
  severityBand String
  durationMs   Int
  result       Json
  createdAt    DateTime @default(now())
  audit        Audit    @relation(fields: [auditId], references: [id], onDelete: Cascade)

  @@index([auditId])
}
```

`shareToken String? @unique` (nullable = revocable). One migration, `pnpm run prisma:migrate` + `prisma:generate`. Rollback: redeploy prior commit (no data loss; `AuditPage` orphaned-safe via `onDelete: Cascade`).

## Interfaces / Contracts

Additive to `src/lib/contracts/audit-result.ts`:

```ts
export const multiPageResultSchema = z.object({
  aggregate: z.object({ url: z.string(), geoScore: z.number().min(0).max(100),
    severityBand: severityBandSchema, durationMs: z.number().nonnegative() }),
  pages: z.array(z.object({ url: z.string(), geoScore: z.number(),
    severityBand: severityBandSchema, durationMs: z.number().nonnegative() })),
});
```

`runMultiPageAudit(url: string, deps: MultiPageDeps): Promise<{ aggregate, pages: PerPageAudit[] }>` — `PerPageAudit = { url, result: AuditResult, error: string | null }`. `deps` mirrors `AuditDeps` plus `concurrency?` (default 3) and `maxPages?` (default 5).

## Data Flow

```
input ──runMultiPageAudit──► discoverSitemapUrls (robots.txt sitemaps → /sitemap.xml)
        │                        │ (SSRF-guarded fetch, XML content-type)
        │                        ▼ slice(0,5)
        │                    bounded worker (3) ──► runAudit(url) ×N
        │                                            │
        ▼                                            ▼
  prisma.$transaction { audit.create(master result) + auditPage.createMany }
        │
        ▼
  /dashboard/audits/[id] ──findFirst{id,userId}──► AuditReport | MultiPageReport
  /share/[token] ──findUnique{shareToken}──► AuditReport (no auth, no private fields)
  /api/report/[id]/pdf ──findFirst{id,userId} + tier──► report-template.ts ──► render.ts ──► PDF bytes
```

## File Changes

| File | Action | Description |
|---|---|---|
| `prisma/schema.prisma` | Modify | `Audit.shareToken`, `AuditPage` model |
| `src/report/audit-report.tsx` | Create | Extracted `<AuditReport result>` (SSR) |
| `src/report/audit-runner.tsx` | Modify | Import `AuditReport`; drop private copy |
| `src/report/multi-page-report.tsx` | Create | Aggregate hero + per-page score rows |
| `src/app/dashboard/audits/[id]/page.tsx` | Create | Detail page: auth + ownership + render |
| `src/app/share/[token]/page.tsx` | Create | Public render, no auth |
| `src/lib/audit/share-actions.ts` | Create | `createShareToken` / `revokeShareToken` |
| `src/lib/audit/feature-gate.ts` | Create | `requirePaidTier(tier)` shared gate |
| `src/audit/multi-page.ts` | Create | `runMultiPageAudit` + sitemap discovery |
| `src/lib/fetch/index.ts` | Modify | Add `"sitemap"` kind (XML accepted) |
| `src/lib/contracts/audit-result.ts` | Modify | `multiPageResultSchema` |
| `src/pdf/report-template.ts` | Create | `AuditResult → HTML` + `@font-face` |
| `src/pdf/render.ts` | Create | `chromium-min → setContent → page.pdf` |
| `src/app/api/report/[id]/pdf/route.ts` | Create | PDF route (runtime nodejs, maxDuration) |
| `next.config.ts` | Modify | `serverExternalPackages` + `outputFileTracingIncludes` |
| `public/fonts/*.ttf` | Create | OFL self-hosted fonts |
| `src/dashboard/audit-history-table.tsx` | Modify | Row URL links to detail page |

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit (engine) | `runMultiPageAudit` cap/concurrency/1-per-runAudit/partial-failure | Mock `runAudit` + `fetcher`; assert ≤3 in-flight, `slice(0,5)`, error isolation |
| Unit (fetch) | `"sitemap"` kind accepts XML; page/probe still reject it | `fetchAuditResource` with stubbed `Response` |
| Unit (gate) | `requirePaidTier` FREE→cta / PRO→allowed | Pure tier table |
| Unit (template) | `report-template.ts` emits tokens + `@font-face` URLs | String assertions |
| Unit (render) | `render.ts` calls `page.pdf({ printBackground: true })` | Mock `puppeteer-core` launch chain |
| RTL | Detail/share render persisted result, no re-run | `AuthReport`/`MultiPageReport` from `auditResultFixture` |
| Route | PDF 404/403/200 headers; share 404; ownership | Mock `auth`, `prisma`, `renderPdf` |
| Integration | Migration applies; 1 `Audit` + N `AuditPage` in one tx | Test-db or mocked `$transaction` |

Strict TDD: RED tests written before each production module; `pnpm test` (613 existing) stays green.

## Threat Matrix

| Boundary | Applicability | Response |
|---|---|---|
| Documentation-like paths / Git selection / Commit state / Push state / PR commands | N/A | No shell, git, PR, or executable-file automation in this change |
| Process integration (Chromium subprocess) | Applicable | `render.ts` launches headless Chromium with `args: ["--no-sandbox"]` (serverless); render failure returns typed 5xx, never uncaught. RED: mock launch rejection → route 500 |
| SSRF (sitemap fetch) | Applicable | Sitemap URLs pass the existing `assertPublicHost` guard per hop; XML relaxation scoped to `"sitemap"` kind. RED: private-host sitemap URL → `SSRF_BLOCKED` |

## Migration / Rollout

Additive migration, feature-gated — all four features hidden behind PRO on FREE. No data migration; rollback = redeploy prior commit. `shareToken` nulling = instant revoke.

## Open Questions

- [ ] None blocking — multi-page detail uses a light `MultiPageReport` (per-page PDFs deferred per proposal out-of-scope).
