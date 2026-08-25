# Delta: Audit Report UI

> **Change**: `sprint-8-polish-testing-backlog` · **Type**: Delta (MODIFIED)

## Purpose

Deduplicate two classes of findings so the report shows one grouped card per concern instead of one card per raw issue: structured-data findings collapse into a single "structured data" finding listing the missing properties (JSON-LD shown once), and blocked-crawler findings collapse into a single "blocked AI bots" card listing the bots. Implemented by grouping before emitting in `deriveFindings` and rendering one card per group in `TopFindings`. Existing report behavior (ARU-1..ARU-12) is unchanged.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| ARU-13 | Structured-data dedup | New | MUST | Collapse `schema.issues` into ONE finding listing missing properties; JSON-LD shown once |
| ARU-14 | Crawler dedup | New | MUST | Emit ONE "blocked AI bots" finding with the list of bots |

### Requirement: Structured-Data Dedup (ARU-13)

When structured-data findings are derived, then the system MUST collapse all `schema.issues` (missing properties) into a single finding titled "datos estructurados" that lists every missing property, and MUST render the page's JSON-LD exactly once rather than once per issue.

#### Scenario: Missing properties grouped into one finding

- GIVEN schema detection reports 4 missing properties on a page
- WHEN `deriveFindings` groups the issues
- THEN one finding lists all 4 missing properties
- AND the JSON-LD code snippet appears exactly once in the report

#### Scenario: No missing properties

- GIVEN schema detection reports no missing properties
- WHEN findings are derived
- THEN no structured-data finding is emitted

### Requirement: Crawler Dedup (ARU-14)

When crawler-access findings are derived, then the system MUST emit a single "blocked AI bots" finding whose content is the list of blocked bots, instead of one finding per blocked bot.

#### Scenario: Blocked bots grouped into one card

- GIVEN the crawler access map reports 3 blocked AI bots
- WHEN `deriveFindings` groups the crawlers
- THEN one finding lists the 3 blocked bots
- AND `TopFindings` renders a single card for it

#### Scenario: No blocked bots

- GIVEN the crawler access map reports no blocked bots
- WHEN findings are derived
- THEN no blocked-bot finding is emitted

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| ARU-13 | Missing properties grouped into one finding, No missing properties | Covered |
| ARU-14 | Blocked bots grouped into one card, No blocked bots | Covered |
