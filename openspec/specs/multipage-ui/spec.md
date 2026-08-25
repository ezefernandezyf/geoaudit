# Multi-Page UI Specification

> **Change**: `sprint-7-ui-fidelity` + `sprint-8-polish-testing-backlog` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

The UI surface that exposes the (already existing) multi-page audit flow: a trigger form that calls the real `multiPageAuditAction` Server Action with the PRO gate, plus a multi-page results page styled like Gemini (route selector + inspector) driven entirely by real `MultiPageResult` data. The engine, orchestration, and persistence are unchanged (see `multi-page-audit`); this spec only covers the presentation and wiring of that capability into the UI. Since Sprint 8, selecting a page opens that page's FULL report (GEO score, 5-domain scorecard, findings, platform matrix) derived from the persisted `AuditPage` rows — not from the light `MultiPageResult` shape — with an honest empty state for legacy audits without page rows (MPU-7/MPU-8/MPU-9).

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| MPU-1 | Trigger form | New | MUST | A form MUST invoke the real `multiPageAuditAction` |
| MPU-2 | PRO gate in UI | New | MUST | FREE users MUST see an upgrade CTA before the action runs |
| MPU-3 | Error code copy | New | MUST | Each `MultiPageErrorCode` MUST map to neutral Spanish copy |
| MPU-4 | Results page (Gemini) | New | MUST | Multi-page page MUST render a route selector + inspector in Gemini style |
| MPU-5 | Real data only | New | MUST | Per-page rows MUST derive from real citability + durationMs; omit non-existent metrics |
| MPU-6 | Navbar entry | New | MUST | A navbar link MUST expose the multi-page trigger |
| MPU-7 | Per-page full report drill-down | New | MUST | Detail MUST render the FULL report per selected page from `AuditPage` (url→AuditResult via deriveFindings/toGeminiViewModel) |
| MPU-8 | Honest empty state | New | MUST | Zero `AuditPage` rows (legacy) MUST render an honest empty state, no crash |
| MPU-9 | Per-page navigation | New | MUST | User MUST be able to switch the selected page in the selector |

### Requirement: Trigger Form (MPU-1)

When the multi-page UI renders, then it MUST present a form whose submit action is the real `multiPageAuditAction`, using `useActionState` with `MultiPageFormState`.

#### Scenario: Form calls the real action

- GIVEN the multi-page trigger page
- WHEN the user submits a valid URL
- THEN `multiPageAuditAction` is invoked and, on success, the user is redirected to `/dashboard/audits/[id]`

### Requirement: PRO Gate in UI (MPU-2)

When an authenticated FREE user opens the multi-page trigger, then the UI MUST show an upgrade CTA (via `requirePaidTier`) and MUST NOT allow the audit; a PRO/Enterprise user proceeds normally.

#### Scenario: FREE blocked with CTA

- GIVEN a `FREE` user
- WHEN the trigger UI renders
- THEN an upgrade CTA is shown and the form is disabled/blocked

#### Scenario: PRO allowed

- GIVEN a PRO user
- WHEN the trigger UI renders
- THEN the form is enabled

### Requirement: Error Code Copy (MPU-3)

When `multiPageAuditAction` returns an error code, then the UI MUST render neutral Spanish copy for each of `rate-limited`, `invalid`, `auth`, `upgrade`, `limit`, and `failed`.

#### Scenario: Invalid URL copy

- GIVEN the action returns `{ error: "invalid" }`
- WHEN the form re-renders
- THEN a neutral Spanish validation message is shown

### Requirement: Results Page (MPU-4)

When a multi-page audit is viewed, then the page MUST render a Gemini-styled route selector (the discovered page list) and an inspector (per-page detail) driven by the persisted result.

#### Scenario: Selector + inspector

- GIVEN a multi-page audit with 3 pages
- WHEN the page renders
- THEN a route selector lists the 3 pages and selecting one shows its inspector

### Requirement: Real Data Only (MPU-5)

When per-page rows render, then the UI MUST derive their display from real fields (`citability.pageScore`, `summary.durationMs`) and MUST omit any metric the engine does not produce (e.g. `schemaFound`, `crawlTimeMs`, `status`).

#### Scenario: Non-existent metrics omitted

- GIVEN a per-page result without `crawlTimeMs`
- WHEN the inspector renders
- THEN no fabricated `crawlTimeMs` column appears

### Requirement: Navbar Entry (MPU-6)

When the authenticated shell renders, then a navbar link MUST expose the multi-page trigger for eligible (paid) users.

#### Scenario: Navbar link

- GIVEN an authenticated PRO user
- WHEN the navbar renders
- THEN a multi-page link is present

### Requirement: Per-Page Full Report Drill-Down (MPU-7)

When a page is selected in a multi-page audit, then the detail MUST render that page's complete report — GEO score, 5-domain scorecard, findings, and platform matrix — derived from the persisted `AuditPage` row (mapping its `url` to the full `AuditResult` and reusing `deriveFindings`/`toGeminiViewModel`). The system MUST NOT enrich the light `MultiPageResult` shape to satisfy this view.

#### Scenario: Full report for the selected page

- GIVEN a multi-page audit with `AuditPage` rows for 3 URLs
- WHEN the user selects page 2
- THEN the full report renders from page 2's `AuditResult`
- AND the report is produced via `deriveFindings`/`toGeminiViewModel`

#### Scenario: Light shape not enriched

- GIVEN the persisted `MultiPageResult` (light shape)
- WHEN the drill-down detail renders
- THEN the full per-page result is read from `AuditPage`, not added to the light shape

### Requirement: Honest Empty State (MPU-8)

When a multi-page audit has no `AuditPage` rows (legacy audits persisted before page rows existed), then the detail MUST render an honest empty state instead of crashing or fabricating pages.

#### Scenario: Legacy audit without page rows

- GIVEN a multi-page audit with zero `AuditPage` rows
- WHEN the detail renders
- THEN an honest empty state is shown
- AND no fabricated page or metric appears

### Requirement: Per-Page Navigation (MPU-9)

When the multi-page results page renders, then the user MUST be able to navigate between discovered pages in the selector, switching which page's full report is displayed.

#### Scenario: Navigate between pages

- GIVEN a selector listing 3 pages
- WHEN the user activates a different page
- THEN the full report switches to that page

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| MPU-1 | Form calls the real action | Covered |
| MPU-2 | FREE blocked with CTA, PRO allowed | Covered |
| MPU-3 | Invalid URL copy | Covered |
| MPU-4 | Selector + inspector | Covered |
| MPU-5 | Non-existent metrics omitted | Covered |
| MPU-6 | Navbar link | Covered |
| MPU-7 | Full report for the selected page, Light shape not enriched | Covered |
| MPU-8 | Legacy audit without page rows | Covered |
| MPU-9 | Navigate between pages | Covered |
