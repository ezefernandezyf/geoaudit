# Dashboard Specification

> **Change**: `sprint-3-auth-dashboard` + `sprint-4-stripe-integration` + `sprint-5-pro-features` + `sprint-7-ui-fidelity` + `sprint-10-free-mode` + `sprint-19-schema-up` · **Type**: New capability (ADDED) + Delta (MODIFIED + ADDED)

## Purpose

Authenticated dashboard listing the user's audit history with a score trend, a re-audit entry point, and an empty state. It reads persisted `Audit` rows and never re-runs audits. The trend uses pure CSS bars — no chart library. Since Sprint 10, the tier-adaptive billing CTA (DSH-6) is removed with the billing capability. No global nav link is introduced. Since Sprint 5, each history row also links to its audit detail page (`/dashboard/audits/[id]`). Since Sprint 7, the dashboard is restyled to Gemini's composition: a runner bar (input + "Run Audit" + user chip), a 12-column grid with Aggregate + Trend on the same row, and a history table with a header bar, a "Multi-Page" chip, and a refresh action with a "SCANNING..." row.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| DSH-1 | History table | MUST | Dashboard MUST list persisted audits (URL, GEO score, date) newest→oldest, and each row MUST link to its detail page |
| DSH-2 | Score trend | MUST | A pure-CSS bar trend MUST visualize scores without a chart library |
| DSH-3 | Re-audit link | MUST | Each row MUST offer a re-audit link for its URL |
| DSH-4 | Empty state | MUST | Zero audits MUST render an empty state with a call-to-action; copy neutral Spanish (usted) from `DASHBOARD_COPY`, no voseo |
| DSH-5 | Read-only source | MUST | Dashboard MUST read `Audit` rows without re-running audits |
| DSH-7 | Detail navigation | MUST | Each history row MUST link to `/dashboard/audits/[id]` |
| DSH-8 | Runner bar | MUST | A runner bar MUST place the URL input + "Run Audit" + user chip at the top |
| DSH-9 | 12-col grid | MUST | Aggregate (col-4) + Trend (col-8, 12 CSS bars) MUST share one row |
| DSH-10 | Table + Multi-Page chip | MUST | History table MUST have a header bar and a "Multi-Page" chip on multi-page rows |
| DSH-11 | Refresh + scanning row | MUST | A refresh action MUST exist and a "SCANNING..." row MUST show during an in-flight audit |
| DASH-19.1 | Dashboard BreadcrumbList | MUST | Authenticated dashboard pages MUST emit a `BreadcrumbList` JSON-LD block (shared component, no `dashboard/layout.tsx`) — `/dashboard` → Home > Dashboard, `/dashboard/audits/[id]` → Home > Dashboard > Auditoría, `/dashboard/profile` → Home > Dashboard > Perfil — satisfying `breadcrumbs` 5/5 |

### Requirement: History Table (DSH-1)

The dashboard MUST list the authenticated user's persisted audits, newest first, showing URL, GEO score, and date, and each row MUST link to that audit's detail page.

#### Scenario: User with history sees their audits

- GIVEN an authenticated user with 3 persisted audits
- WHEN the dashboard renders
- THEN the audits appear in a table ordered newest→oldest
- AND each row shows URL, GEO score, and date

#### Scenario: Row links to detail page

- GIVEN a history row for audit id `123`
- WHEN the user activates the row's title/link
- THEN they navigate to `/dashboard/audits/123`

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

### Requirement: Read-only Source (DSH-5)

The dashboard MUST read persisted `Audit` rows and MUST NOT re-run audits to display them.

#### Scenario: History loads without re-running

- GIVEN audits are already persisted
- WHEN the dashboard reads them
- THEN no audit re-execution occurs and the persisted `result` JSON is the source of truth

### Requirement: Detail Navigation (DSH-7)

When a history row renders, then it MUST provide a link to `/dashboard/audits/[id]` for that audit.

#### Scenario: Detail link present on every row

- GIVEN a dashboard with persisted audits
- WHEN the history table renders
- THEN every row links to its own detail page

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

### Requirement: Dashboard BreadcrumbList (DASH-19.1)

When an authenticated dashboard page renders, then it MUST emit a `BreadcrumbList` JSON-LD block (`<script type="application/ld+json">`) whose `itemListElement` items reflect the real navigation hierarchy, using a shared component injected per page (no `dashboard/layout.tsx` exists). The emitted block MUST satisfy the schema engine's `breadcrumbs` criterion (5/5). The three routes MUST emit exactly:
- `/dashboard` → Home > Dashboard
- `/dashboard/audits/[id]` → Home > Dashboard > Auditoría
- `/dashboard/profile` → Home > Dashboard > Perfil

Each item MUST carry an `@type: "ListItem"` with a sequential `position` (1-based) and a `name`, and the terminal item MAY carry an `item` URL (the audit detail item MAY use a placeholder-free resolved URL for its own route).

#### Scenario: Dashboard root breadcrumb

- GIVEN the authenticated user visits `/dashboard`
- WHEN the page renders
- THEN a JSON-LD `BreadcrumbList` block is served with `itemListElement` names `["Home", "Dashboard"]` at positions 1 and 2

#### Scenario: Audit detail breadcrumb

- GIVEN the authenticated user visits `/dashboard/audits/<id>`
- WHEN the page renders
- THEN a JSON-LD `BreadcrumbList` block is served with `itemListElement` names `["Home", "Dashboard", "Auditoría"]` at positions 1, 2 and 3

#### Scenario: Profile breadcrumb

- GIVEN the authenticated user visits `/dashboard/profile`
- WHEN the page renders
- THEN a JSON-LD `BreadcrumbList` block is served with `itemListElement` names `["Home", "Dashboard", "Perfil"]` at positions 1, 2 and 3

#### Scenario: Breadcrumbs criterion satisfied

- GIVEN a served `BreadcrumbList` block on any dashboard page
- WHEN the schema engine scores the page's JSON-LD
- THEN `breadcrumbs` scores 5/5
- AND the block is honest — every `name` matches the real navigation trail (no invented or inflated path)

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| DSH-1 | User with history sees audits, Row links to detail | Covered |
| DSH-2 | Trend reflects score history | Covered |
| DSH-3 | User re-runs a past audit | Covered |
| DSH-4 | New user sees a neutral empty state, No voseo in empty state | Covered |
| DSH-5 | History loads without re-running | Covered |
| DSH-7 | Detail link present on every row | Covered |
| DSH-8 | Runner bar present | Covered |
| DSH-9 | Aggregate and trend same row | Covered |
| DSH-10 | Multi-page chip shown | Covered |
| DSH-11 | Scanning row during flight | Covered |
| DASH-19.1 | Dashboard root breadcrumb, Audit detail breadcrumb, Profile breadcrumb, Breadcrumbs criterion satisfied | Covered |