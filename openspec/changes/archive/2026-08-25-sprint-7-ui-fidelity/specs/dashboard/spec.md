# Delta: Dashboard

> **Change**: `sprint-7-ui-fidelity` · **Type**: Delta (MODIFIED)

## Purpose

Restyle the dashboard to Gemini's composition while preserving its read-only data contract (persisted `Audit` rows, no re-run). This delta adds the runner bar (input + "Run Audit" + user chip), the 12-column grid with Aggregate + Trend on the same row (pure CSS bars), a history table with a header bar and a "Multi-Page" chip, and a refresh action with a "SCANNING..." row.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| DSH-8 | Runner bar | New | MUST | A runner bar MUST place the URL input + "Run Audit" + user chip at the top |
| DSH-9 | 12-col grid | Partial | MUST | Aggregate (col-4) + Trend (col-8, 12 CSS bars) MUST share one row |
| DSH-10 | Table + Multi-Page chip | Partial | MUST | History table MUST have a header bar and a "Multi-Page" chip on multi-page rows |
| DSH-11 | Refresh + scanning row | New | MUST | A refresh action MUST exist and a "SCANNING..." row MUST show during an in-flight audit |

### Requirement: Runner Bar (DSH-8)

When the dashboard renders, then a runner bar MUST appear at the top containing the URL input with the "Run Audit" button inside it and the user chip.

#### Scenario: Runner bar present

- GIVEN the dashboard
- WHEN it renders
- THEN the input + "Run Audit" + user chip appear in one bar

### Requirement: 12-Column Grid (DSH-9)

When the dashboard renders, then the aggregate summary and the score trend MUST share a 12-column grid row (Aggregate `col-4`, Trend `col-8`), and the trend MUST render 12 pure-CSS bars with no chart library.

#### Scenario: Aggregate and trend same row

- GIVEN the dashboard
- WHEN it renders
- THEN Aggregate (4 cols) and Trend (8 cols) sit on the same row with 12 CSS bars

### Requirement: Table + Multi-Page Chip (DSH-10)

When the history table renders, then it MUST include a header bar and MUST show a "Multi-Page" chip on rows that are multi-page audits (reusing the persisted `MultiPageResult` shape).

#### Scenario: Multi-page chip shown

- GIVEN a persisted multi-page audit in history
- WHEN the table renders
- THEN that row shows a "Multi-Page" chip

### Requirement: Refresh + Scanning Row (DSH-11)

When the dashboard is viewed, then a refresh action MUST be available, and while an audit is in flight a "SCANNING..." row MUST be displayed.

#### Scenario: Scanning row during flight

- GIVEN an audit is running
- WHEN the dashboard renders
- THEN a "SCANNING..." row appears

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| DSH-8 | Runner bar present | Covered |
| DSH-9 | Aggregate and trend same row | Covered |
| DSH-10 | Multi-page chip shown | Covered |
| DSH-11 | Scanning row during flight | Covered |
