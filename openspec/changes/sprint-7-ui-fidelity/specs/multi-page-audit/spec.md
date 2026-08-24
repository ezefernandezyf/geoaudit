# Delta: Multi-Page Audit

> **Change**: `sprint-7-ui-fidelity` · **Type**: Delta (MODIFIED)

## Purpose

Convert the multi-page report presentation into a Gemini-styled presenter of the real `MultiPageResult`. The orchestration, persistence, tier counting, and PRO gate (MPA-1..MPA-9) are unchanged; this delta only covers the report page rendering (aggregate + per-page list) with honest data derivation.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| MPA-10 | Multi-page report presenter | Partial | MUST | The multi-page report MUST render from the real `MultiPageResult` in Gemini style |
| MPA-11 | Per-page data honesty | New | MUST | Per-page rows MUST derive citability + durationMs; omit non-existent metrics |

### Requirement: Multi-Page Report Presenter (MPA-10)

When a multi-page audit is viewed, then the report component MUST be a presenter of the persisted `MultiPageResult` (aggregate + pages) styled to Gemini, without re-running any audit.

#### Scenario: Aggregate + pages rendered

- GIVEN a persisted multi-page result with 3 pages
- WHEN the page renders
- THEN the aggregate score and the 3 per-page entries render from persisted data

### Requirement: Per-Page Data Honesty (MPA-11)

When per-page rows render, then they MUST derive their values from real fields (`citability.pageScore`, `summary.durationMs`) and MUST omit any metric the engine does not produce (e.g. `schemaFound`, `crawlTimeMs`, `status`).

#### Scenario: Non-existent metrics omitted

- GIVEN a per-page result without `crawlTimeMs`
- WHEN the row renders
- THEN no fabricated `crawlTimeMs` value appears

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| MPA-10 | Aggregate + pages rendered | Covered |
| MPA-11 | Non-existent metrics omitted | Covered |
