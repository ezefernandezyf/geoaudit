# PDF Export Specification

> **Change**: `sprint-5-pro-features` · **Type**: New capability (ADDED)

## Purpose

Generate a client-ready PDF of a persisted audit report via `GET /api/report/[id]/pdf`. The `src/pdf/` domain renders an HTML template with the design-system tokens and self-hosted fonts through `puppeteer-core` + `@sparticuz/chromium-min`, with `printBackground: true` so navy/emerald/amber/red print correctly. The route enforces ownership and PRO tier.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| PDF-1 | PDF route | New | MUST | `GET /api/report/[id]/pdf` MUST return the audit's PDF |
| PDF-2 | Ownership gate | New | MUST | Only the audit owner MUST be able to export; others get 404 |
| PDF-3 | Tier gate | New | MUST | PDF export MUST be gated to PRO/Enterprise |
| PDF-4 | Render pipeline | New | MUST | Use `puppeteer-core` + `@sparticuz/chromium-min` to render HTML→PDF |
| PDF-5 | Self-hosted fonts | New | MUST | Fonts MUST be self-hosted in `public/fonts/` via `@font-face` |
| PDF-6 | Print fidelity | New | MUST | `printBackground: true` so navy/emerald/amber/red print |
| PDF-7 | Response contract | New | MUST | Response MUST be `application/pdf` with a download filename |
| PDF-8 | Bundle config | New | MUST | `serverExternalPackages` + `outputFileTracingIncludes` trace chromium + fonts |
| PDF-9 | Error states | New | MUST | Missing/non-owner/FREE/render-failure MUST return typed errors |

### Requirement: PDF Route (PDF-1)

When a client requests `GET /api/report/[id]/pdf`, then the system MUST return the PDF of the persisted audit report for that id.

#### Scenario: PDF downloaded

- GIVEN an audit exists with id `123`
- WHEN `GET /api/report/123/pdf` is requested by its owner
- THEN the response body is a valid PDF of that audit's report

### Requirement: Ownership Gate (PDF-2)

When the PDF route runs, then the system MUST verify the requester owns the audit and MUST return 404 when they do not.

#### Scenario: Non-owner blocked

- GIVEN audit `123` owned by user A
- WHEN user B requests its PDF
- THEN the route returns 404 and no PDF is produced

### Requirement: Tier Gate (PDF-3)

When the PDF route runs, then the system MUST allow only PRO/Enterprise (`isPaidTier`) and MUST deny FREE users.

#### Scenario: FREE user denied

- GIVEN a FREE user who owns audit `123`
- WHEN they request its PDF
- THEN the route returns an upgrade/denied response and no PDF is produced

### Requirement: Render Pipeline (PDF-4)

When a PDF is generated, then the system MUST launch headless Chromium via `puppeteer-core` + `@sparticuz/chromium-min` and render the report template to PDF.

#### Scenario: Template rendered to PDF

- GIVEN a report template for an audit
- WHEN the render pipeline runs
- THEN Chromium renders the HTML and returns PDF bytes

### Requirement: Self-Hosted Fonts (PDF-5)

When the report template renders, then the design fonts (Instrument Serif, Work Sans, JetBrains Mono) MUST be self-hosted in `public/fonts/` and loaded via `@font-face`, not `next/font`.

#### Scenario: Fonts resolve offline

- GIVEN the PDF render pipeline runs
- WHEN the template loads fonts
- THEN fonts resolve from `public/fonts/` without a network request

### Requirement: Print Fidelity (PDF-6)

When the PDF renders, then the system MUST set `printBackground: true` so the navy/emerald/amber/red design tokens appear in print.

#### Scenario: Brand colors survive print

- GIVEN a report with emerald and red score colors
- WHEN the PDF renders
- THEN those colors appear in the output rather than being stripped by print CSS

### Requirement: Response Contract (PDF-7)

When the PDF route succeeds, then the response MUST be `Content-Type: application/pdf` with a `Content-Disposition` download filename.

#### Scenario: PDF response headers

- GIVEN a successful PDF render
- WHEN the route responds
- THEN `Content-Type` is `application/pdf`
- AND `Content-Disposition` sets an attachment filename such as `geo-audit-{id}.pdf`

### Requirement: Bundle Config (PDF-8)

When the PDF route is built for serverless deployment, then `next.config.ts` MUST declare `serverExternalPackages` for `@sparticuz/chromium-min` and `outputFileTracingIncludes` for the chromium binary and `public/fonts/`.

#### Scenario: Chromium traced into bundle

- GIVEN the PDF route is deployed
- WHEN the serverless bundle is built
- THEN `serverExternalPackages` includes `@sparticuz/chromium-min`
- AND `outputFileTracingIncludes` includes the chromium binary and `public/fonts/`

### Requirement: Error States (PDF-9)

When the PDF route encounters a failure, then it MUST return typed errors rather than throwing uncaught exceptions.

#### Scenario: Missing audit 404

- GIVEN audit id `999` does not exist
- WHEN its PDF is requested
- THEN the route returns 404

#### Scenario: Render failure

- GIVEN Chromium fails to render
- WHEN the PDF route runs
- THEN the route returns a 5xx error and never throws an uncaught exception
