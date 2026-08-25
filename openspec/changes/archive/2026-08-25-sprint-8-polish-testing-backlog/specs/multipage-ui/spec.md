# Delta: Multi-Page UI

> **Change**: `sprint-8-polish-testing-backlog` · **Type**: Delta (MODIFIED)

## Purpose

Add a per-page drill-down to the multi-page results page: selecting a page opens that page's FULL report (GEO score, 5-domain scorecard, findings, platform matrix) derived from the persisted `AuditPage` rows — not from the light `MultiPageResult` shape. The detail queries `AuditPage` by `auditId`, maps `url → AuditResult`, and reuses `deriveFindings`/`toGeminiViewModel`. Legacy audits without `AuditPage` rows get an honest empty state. Existing UI wiring (MPU-1..MPU-6) is unchanged.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| MPU-7 | Per-page full report drill-down | New | MUST | Detail MUST render the FULL report per selected page from `AuditPage` (url→AuditResult via deriveFindings/toGeminiViewModel) |
| MPU-8 | Honest empty state | New | MUST | Zero `AuditPage` rows (legacy) MUST render an honest empty state, no crash |
| MPU-9 | Per-page navigation | New | MUST | User MUST be able to switch the selected page in the selector |

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
| MPU-7 | Full report for the selected page, Light shape not enriched | Covered |
| MPU-8 | Legacy audit without page rows | Covered |
| MPU-9 | Navigate between pages | Covered |
