# Dashboard Specification

> **Change**: `sprint-3-auth-dashboard` · **Type**: New capability (ADDED)

## Purpose

Authenticated dashboard listing the user's audit history with a score trend, a re-audit entry point, and an empty state. It reads persisted `Audit` rows and never re-runs audits. The trend uses pure CSS bars — no chart library.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| DSH-1 | History table | MUST | Dashboard MUST list persisted audits (URL, GEO score, date) newest→oldest |
| DSH-2 | Score trend | MUST | A pure-CSS bar trend MUST visualize scores without a chart library |
| DSH-3 | Re-audit link | MUST | Each row MUST offer a re-audit link for its URL |
| DSH-4 | Empty state | MUST | Zero audits MUST render an empty state with a call-to-action |
| DSH-5 | Read-only source | MUST | Dashboard MUST read `Audit` rows without re-running audits |

### Requirement: History Table (DSH-1)

The dashboard MUST list the authenticated user's persisted audits, newest first, showing URL, GEO score, and date.

#### Scenario: User with history sees their audits

- GIVEN an authenticated user with 3 persisted audits
- WHEN the dashboard renders
- THEN the audits appear in a table ordered newest→oldest
- AND each row shows URL, GEO score, and date

### Requirement: Score Trend (DSH-2)

The dashboard MUST render a score trend using pure CSS bars, with no chart library.

#### Scenario: Trend reflects score history

- GIVEN the user has audits with varying GEO scores
- WHEN the dashboard renders
- THEN a bar per audit visualizes its score using only CSS
- AND no chart library is loaded

### Requirement: Re-audit Link (DSH-3)

Each history row MUST provide a re-audit link for its URL.

#### Scenario: User re-runs a past audit

- GIVEN a history row for a previously audited URL
- WHEN the user activates its re-audit link
- THEN a new audit for that URL is initiated

### Requirement: Empty State (DSH-4)

The dashboard MUST render an empty state when the user has zero audits.

#### Scenario: New user sees an empty state

- GIVEN an authenticated user with no persisted audits
- WHEN the dashboard renders
- THEN an empty state appears with a call-to-action to run the first audit

### Requirement: Read-only Source (DSH-5)

The dashboard MUST read persisted `Audit` rows and MUST NOT re-run audits to display them.

#### Scenario: History loads without re-running

- GIVEN audits are already persisted
- WHEN the dashboard reads them
- THEN no audit re-execution occurs and the persisted `result` JSON is the source of truth
