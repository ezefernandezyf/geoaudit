# Dashboard Delta

> **Change**: `sprint-5-pro-features` · **Type**: Delta (MODIFIED)

## Purpose

Add a navigation path from the history list to the new audit detail page (`/dashboard/audits/[id]`). The history table row becomes a link to the detail page.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| DSH-1 | History table | Partial | MUST | History rows MUST link to the detail page (in addition to existing columns) |
| DSH-7 | Detail navigation | New | MUST | Each history row MUST link to `/dashboard/audits/[id]` |

### Requirement: History Table (DSH-1)

The dashboard MUST list the authenticated user's persisted audits, newest first, showing URL, GEO score, and date, and each row MUST link to that audit's detail page.

(Previously: rows showed URL, GEO score, and date with no detail-page link.)

#### Scenario: User with history sees their audits

- GIVEN an authenticated user with 3 persisted audits
- WHEN the dashboard renders
- THEN the audits appear in a table ordered newest→oldest
- AND each row shows URL, GEO score, and date

#### Scenario: Row links to detail page

- GIVEN a history row for audit id `123`
- WHEN the user activates the row's title/link
- THEN they navigate to `/dashboard/audits/123`

### Requirement: Detail Navigation (DSH-7)

When a history row renders, then it MUST provide a link to `/dashboard/audits/[id]` for that audit.

#### Scenario: Detail link present on every row

- GIVEN a dashboard with persisted audits
- WHEN the history table renders
- THEN every row links to its own detail page
