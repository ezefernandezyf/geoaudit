# Audit Detail Page Specification

> **Change**: `sprint-5-pro-features` · **Type**: New capability (ADDED)

## Purpose

First dynamic route in the app: `/dashboard/audits/[id]` renders a single persisted audit's report. It enforces ownership (non-owner or missing audit → 404), renders the persisted `Audit.result` without re-running, and reuses the report UI by extracting a shared `<AuditReport result>` component from `src/report/audit-runner.tsx` so the detail page and the `/report` page render from one source of truth.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| ADP-1 | Dynamic route | New | MUST | `/dashboard/audits/[id]` MUST render the audit for that id |
| ADP-2 | Ownership check | New | MUST | Non-owner or missing audit MUST return 404 |
| ADP-3 | Render persisted result | New | MUST | Render `Audit.result` with no re-run |
| ADP-4 | Shared AuditReport | New | MUST | Extract shared `<AuditReport result>` from `audit-runner.tsx` |
| ADP-5 | Single source of truth | New | MUST | Detail page and `/report` MUST render from the same `AuditReport` |

### Requirement: Dynamic Route (ADP-1)

When a user navigates to `/dashboard/audits/[id]`, then the system MUST render the audit identified by `[id]`.

#### Scenario: Detail page renders

- GIVEN an audit with id `123`
- WHEN the owner navigates to `/dashboard/audits/123`
- THEN the page renders that audit's report

### Requirement: Ownership Check (ADP-2)

When the detail page loads, then the system MUST verify the requester owns the audit and MUST return 404 for a non-owner or missing audit.

#### Scenario: Non-owner gets 404

- GIVEN audit `123` owned by user A
- WHEN user B opens `/dashboard/audits/123`
- THEN the page returns 404

#### Scenario: Missing audit gets 404

- GIVEN no audit with id `999`
- WHEN `/dashboard/audits/999` is requested
- THEN the page returns 404

### Requirement: Render Persisted Result (ADP-3)

When the detail page renders, then the system MUST read the persisted `Audit.result` JSON and MUST NOT re-run the audit.

#### Scenario: No re-run on detail

- GIVEN an audit whose result is already persisted
- WHEN the detail page renders
- THEN the persisted `result` is the sole source and no audit re-execution occurs

### Requirement: Shared AuditReport (ADP-4)

When the report UI is refactored, then a shared `<AuditReport result>` component MUST be extracted from `src/report/audit-runner.tsx` and accept the persisted result as its input.

#### Scenario: Component extracted

- GIVEN the current `audit-runner.tsx` report markup
- WHEN the extraction is performed
- THEN an `<AuditReport result={...}>` component renders the report from a result object

### Requirement: Single Source of Truth (ADP-5)

When the detail page and the `/report` page render a result, then they MUST both use the shared `<AuditReport>` component, with no duplicated report markup.

#### Scenario: Both pages share the component

- GIVEN a persisted result
- WHEN the detail page and `/report` page render it
- THEN both render via the same `<AuditReport>` component
