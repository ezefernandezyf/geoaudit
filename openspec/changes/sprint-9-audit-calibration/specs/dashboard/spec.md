# Dashboard Specification (Delta)

> **Change**: `sprint-9-audit-calibration` · **Type**: Delta (MODIFIED)

## Purpose

Remove residual voseo from the dashboard empty state: its copy MUST be neutral Spanish (usted), sourced from `DASHBOARD_COPY` like the rest of the shell.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| DSH-4 | Empty state | Partial | MUST | Empty state copy MUST be neutral Spanish, sourced from `DASHBOARD_COPY`, no voseo |

### Requirement: Empty State (DSH-4)

The dashboard MUST render an empty state when the user has zero audits, and that empty-state copy MUST be neutral Spanish (usted), sourced from `DASHBOARD_COPY`, with no voseo/tuteo forms.
(Previously: empty state existed but carried residual voseo.)

#### Scenario: New user sees a neutral empty state

- GIVEN an authenticated user with no persisted audits
- WHEN the dashboard renders
- THEN an empty state appears with a call-to-action to run the first audit
- AND its copy is neutral Spanish sourced from `DASHBOARD_COPY`

#### Scenario: No voseo in empty state

- GIVEN the dashboard empty state
- WHEN its copy is inspected
- THEN no voseo/tuteo forms appear

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| DSH-4 | New user sees a neutral empty state, No voseo in empty state | Covered |
