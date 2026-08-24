# Proposal: Sprint 5 — Pro Features

## Intent

Convert GeoAudit from a single-URL auditor into a **Pro suite**: multi-page audits (≤5, sitemap-driven), client-ready PDF export, public share links, and a history detail page. All four are feature-gated to PRO/Enterprise; FREE sees upgrade CTAs.

## Scope

### In Scope
- **Detail page** `/dashboard/audits/[id]` — first dynamic route; ownership check; renders persisted `Audit.result`. Extract shared `<AuditReport result>` from `src/report/audit-runner.tsx`.
- **Share link** — `Audit.shareToken String? @unique` (nullable = revocable); public `/share/[token]` renders persisted result WITHOUT re-run; create/revoke UI. Gate PRO.
- **Multi-page** — `runMultiPageAudit` in `src/audit/` (bounded concurrency 2–3, cap 5, sitemap from `RobotsTxt.sitemaps` and/or `/sitemap.xml`); additive zod contract; `AuditPage` 1:N table; relax content-type gate for `application/xml` (sitemap only). 1 multi-page = 1 audit. Gate PRO.
- **PDF** — `src/pdf/` domain (`report-template.ts` + `render.ts` w/ chromium-min); GET `/api/report/[id]/pdf`; `next.config.ts` (`serverExternalPackages` + `outputFileTracingIncludes`). Gate PRO.
- **Enforcement** — feature-gate helper in `src/lib/audit/` (reuse existing `isPaidTier`) applied in actions/routes.

### Out of Scope
- White-label branding (Enterprise); PDF email via Resend (future)
- Sharing multi-page groups (individual audits only); per-page PDF within multi-page (future)
- Sitemap `sitemap_index` XML parsing; Playwright E2E of Stripe checkout (Sprint 6)

## Non-goals / Constraints

- Must NOT break single-page audit — 613 tests stay green.
- Strict TDD (`pnpm test`); conventional commits.
- PDF only for PRO (ownership + tier gate).
- Share exposes report only — never userId/email/tier.
- New deps pinned together (`puppeteer-core` + `@sparticuz/chromium-min` exact-version match).

## Capabilities

> Contract for `sdd-spec`. Researched against `openspec/specs/`.

### New Capabilities
- `audit-detail-page`: `/dashboard/audits/[id]` + shared `AuditReport` extraction.
- `audit-sharing`: `shareToken` + public `/share/[token]` + create/revoke.
- `multi-page-audit`: `runMultiPageAudit`, `AuditPage` model, sitemap discovery, additive contract.
- `report-pdf`: `src/pdf/` domain + `/api/report/[id]/pdf` route + font/tracing config.

### Modified Capabilities
- `tier-limits`: feature-gate (multi-page/PDF/share PRO-only); 1 multi-page = 1 audit toward limit.
- `audit-fetch-layer`: relax `RFL-8` content-type gate to accept `application/xml` for sitemap probes.
- `dashboard`: history rows link to detail page (new navigation path).

## Approach

Slice order by dependency: **U1 detail + AuditReport extraction → U2 share (builds on U1) → U3 multi-page (engine + contract + DB) → U4 PDF (isolates risk last)**.

- Multi-page reuses `runAudit` per page; SSRF guard already covers each URL.
- `shareToken` = `randomUUID()` nullable unique; revoke = null it.
- PDF: route handler (not Server Action) + HTML template with CSS tokens + self-hosted TTFs in `public/fonts/` (`@font-face`, next/font unsuitable) + `printBackground: true`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | `Audit.shareToken`, new `AuditPage` model |
| `src/audit/` | Modified | `runMultiPageAudit` |
| `src/report/` | Modified | extract shared `AuditReport` |
| `src/pdf/` | New | `report-template.ts`, `render.ts` |
| `src/lib/audit/` | Modified | feature-gate helper |
| `src/lib/fetch/` | Modified | XML content-type gate |
| `src/lib/contracts/` | Modified | additive multi-page contract |
| `src/app/dashboard/audits/[id]/` | New | detail page |
| `src/app/share/[token]/` | New | public share page |
| `src/app/api/report/[id]/pdf/` | New | PDF route |
| `next.config.ts` | Modified | serverExternalPackages + tracing includes |
| `public/fonts/` | New | self-hosted TTF (OFL) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Puppeteer/chromium binary not traced into Vercel bundle | Med | `serverExternalPackages` + `outputFileTracingIncludes`; pin exact versions |
| Cold start 3–5s / serverless limits | Med | loading state; `maxDuration`; bounded multi-page concurrency |
| Multi-page runtime vs serverless limits (5 fetches) | Med | cap 5, concurrency 2–3, reuse 15s/10s timeouts |
| XML content-type gate relaxation | Low | scope to sitemap probes only |
| Authz gaps (ownership + tier on detail/share/PDF) | Med | shared gate helper + ownership check at route entry |
| Large scope — biggest sprint yet | High | chained PRs (U1→U4), ask-on-risk |

## Rollback Plan

- Additive migration only (nullable column + new table): revert = redeploy prior commit, no data loss.
- `shareToken` nullable → revoke by nulling; routes 404 on missing/null token.
- Feature-gate off ⇒ all four features hidden behind PRO; FREE path unchanged.
- `next.config.ts` + `public/fonts/` revert cleanly with PDF route removal.

## Dependencies

- `puppeteer-core` + `@sparticuz/chromium-min` (prod, pinned together); `puppeteer` (dev, postinstall → `pnpm approve-builds`).
- Self-hosted fonts (InstrumentSerif, WorkSans, JetBrainsMono — OFL) in `public/fonts/`.

## Success Criteria

- [ ] Detail page renders persisted result; non-owner and missing audit → 404/redirect.
- [ ] Share link opens report with zero re-run and no private fields.
- [ ] Multi-page audit of ≤5 URLs persists 1 `Audit` + N `AuditPage` rows; counts as 1 toward tier.
- [ ] PDF downloads with correct navy/emerald/amber/red colors (printBackground).
- [ ] FREE blocked from all four features with upgrade CTA; 613 tests green.

## Review Workload Forecast

| Slice | Est. changed lines |
|-------|--------------------|
| U1 detail page + AuditReport extraction | ~250 |
| U2 share link | ~300 |
| U3 multi-page + DB + contract | ~400 |
| U4 PDF + config | ~350 |
| **Total** | **~1300** |

Decision needed before apply: Yes
Chained PRs recommended: Yes
400-line budget risk: High

**Delivery strategy**: `ask-on-risk`. **Chain strategy**: feature-branch-chain (PR1→feature branch; U2→U3→U4 each target the prior PR branch).
