# Dashboard Specification (Delta)

> **Change**: `sprint-6-ui-redesign` · **Type**: Delta (MODIFIED)

## Purpose

Restyle the dashboard (aggregate hero, score trend, history table, search) while keeping the data real: persisted `Audit` rows, no re-runs, tier-adaptive CTA, and detail navigation unchanged.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| DSH-1 | History table | Partial | MUST | Restyled table; still URL/GEO score/date + detail link |
| DSH-2 | Score trend | Partial | MUST | Restyled pure-CSS trend, no chart library |
| DSH-8 | Aggregate hero | New | MUST | Hero summarizes the latest GEO score + band |
| DSH-9 | History search | New | MUST | Client-side filter of history by URL substring |

### Requirement: History Table (DSH-1)

When the dashboard lists audits, then it MUST show them newest-first (URL, GEO score, date, band) with each row linking to its detail page, restyled with sparse dividers.

#### Scenario: Restyled table keeps links

- GIVEN a user with persisted audits
- WHEN the table renders
- THEN rows show URL, GEO score, date and band, newest first
- AND each row links to `/dashboard/audits/[id]`, with sparse (not zebra) dividers

### Requirement: Score Trend (DSH-2)

When the trend renders, then the dashboard MUST visualize scores as pure CSS bars with no chart library, restyled to the new direction.

#### Scenario: Trend is CSS-only

- GIVEN audits with varying scores
- WHEN the trend renders
- THEN a bar per audit visualizes its score using CSS only, no chart library

### Requirement: Aggregate Hero (DSH-8)

When the dashboard renders with at least one audit, then an aggregate hero MUST summarize the most recent GEO score and its band.

#### Scenario: Hero shows the latest score

- GIVEN a user with audit history
- WHEN the dashboard renders
- THEN the hero shows the latest audit's GEO score and severity band
- AND the value comes from persisted `Audit` rows, not a recomputation

### Requirement: History Search (DSH-9)

When the dashboard renders, then a search input MUST filter the history table by URL substring on the client.

#### Scenario: Filter by URL

- GIVEN a user with several audits
- WHEN they type a URL fragment
- THEN only matching rows remain, and clearing the input restores the full list
