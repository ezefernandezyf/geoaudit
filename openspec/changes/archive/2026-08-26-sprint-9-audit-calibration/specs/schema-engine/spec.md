# Schema Engine Specification (Delta)

> **Change**: `sprint-9-audit-calibration` · **Type**: Delta (ADDED)

## Purpose

Soften the schema dimension scoring (option "b"): criteria that today score only 0/5/10/15 MUST award intermediate points so partial structured data earns partial credit. Exact point tiers follow the WU-2 calibration decision.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| RSC-13 | Partial-credit schema scoring | New | MUST | Schema criteria MUST award intermediate points, not only 0/5/10/15 |

### Requirement: Partial-Credit Schema Scoring (RSC-13)

The schema dimension MUST award intermediate points per criterion (not only the discrete 0/5/10/15 steps), so partial compliance (e.g., an Organization node missing one recommended property, or one valid node among several missing) earns partial credit instead of a hard floor. Exact point tiers follow the WU-2 calibration decision.

#### Scenario: Partial schema earns intermediate credit

- GIVEN a page with a valid Organization node that is missing one recommended property
- WHEN the schema dimension is scored
- THEN the criterion earns an intermediate point value between 0 and 15 (not just 0/5/10/15)

#### Scenario: Full schema earns the cap

- GIVEN a page with Organization + WebSite nodes and all required/recommended properties present
- WHEN the schema dimension is scored
- THEN the criterion reaches the full point value

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RSC-13 | Partial schema earns intermediate credit, Full schema earns the cap | Covered |
