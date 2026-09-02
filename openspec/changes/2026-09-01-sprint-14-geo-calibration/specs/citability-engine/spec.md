# Delta for Citability Engine

> **Change**: `2026-09-01-sprint-14-geo-calibration` · **Type**: Delta (MODIFIED)

## Racional

Las rúbricas estaban comprimidas en el benchmark real: uniqueness 0 en 100% de los bloques y coverage 0% universal. v3.1 corrige con datos: floor de uniqueness (~35, crédito base por pasaje autocontenido), semver (`v18.2.0`) como stat concreto en `STAT_PATTERN` (páginas changelog/release-notes), y umbral de coverage 70 → 60.

| # | Change | Summary |
|---|--------|---------|
| RCI-6 | MODIFIED | `STAT_PATTERN` incluye semver (vX.Y.Z) |
| RCI-7 | MODIFIED | Uniqueness: floor 35 + 35 por hit (antes 0 sin hits) |
| RCI-11 | MODIFIED | Coverage cuenta bloques ≥ 60 (antes ≥ 70) |

## MODIFIED Requirements

### Requirement: Statistical Density (RCI-6)

The system MUST award intermediate points by stat-density level (percentages, currency, dates, named sources) rather than a binary rich/poor split. Semantic-version strings (`vX.Y.Z`, e.g. "v18.2.0") MUST count as concrete stats in `STAT_PATTERN` so changelog/release-note blocks earn density credit. Exact tiers follow the WU-2 calibration decision.
(Previously: `STAT_PATTERN` matched only percentages, currency amounts, and 4-digit years.)

#### Scenario: Stats-rich block

- GIVEN a 400-word block containing "According to a 2025 McKinsey report, 67% of companies…" and "the average cost is $12,000 per incident"
- WHEN Statistical Density is scored
- THEN the score is ≥ 70 (≥1 stat per 500 words with named source + percentage + dollar amount)

#### Scenario: Partial stat block earns intermediate credit

- GIVEN a 400-word block with one bare percentage but no named source
- WHEN Statistical Density is scored
- THEN the block earns intermediate credit (between 10 and full), not the minimum

#### Scenario: Stats-poor block

- GIVEN a 400-word block with no numbers, percentages, dollar amounts, or named sources
- WHEN Statistical Density is scored
- THEN the score is ≤ 10

#### Scenario: Semver counts as a stat

- GIVEN a 400-word block containing "we released v18.2.0" and no other stat-like tokens
- WHEN Statistical Density is scored
- THEN the version string matches `STAT_PATTERN`
- AND the block earns intermediate credit (not ≤ 10)

### Requirement: Uniqueness (RCI-7)

The system MUST score each block on original-data phrases ("we surveyed…", "our data shows…") and first-person voice — proxy signal. Every scored block MUST earn a base uniqueness credit of 35 (floor) for being an extractable, self-contained passage; each unique-data hit adds 35, capped at 100.
(Previously: score = min(100, hits × 35) — zero hits scored 0, compressing the dimension in 100% of benchmark blocks.)

#### Scenario: Self-contained block earns the floor

- GIVEN a 120-word block with explicit subject and no first-party phrases
- WHEN Uniqueness is scored
- THEN the score is ≥ 35 (base floor), never 0

#### Scenario: One unique-data phrase adds credit

- GIVEN a block containing "our data shows" (one hit)
- WHEN Uniqueness is scored
- THEN the score is ≥ 70 (floor 35 + 35 per hit)

#### Scenario: First-person lead adds credit

- GIVEN a block starting with "We analyzed…" (first-person lead)
- WHEN Uniqueness is scored
- THEN the score is ≥ 70

### Requirement: Citability Coverage (RCI-11)

The system MUST return citability coverage as the percentage of blocks scoring ≥ 60.
(Previously: table-only — coverage counted blocks scoring ≥ 70; 0% coverage in 100% of benchmark sites.)

#### Scenario: Block at 65 counts toward coverage

- GIVEN scored blocks with composites 82, 65, and 40
- WHEN coverage is computed
- THEN 2 of 3 blocks count (82 and 65)
- AND coverage is 67%

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RCI-6 | Stats-rich block, Partial stat block, Stats-poor block, Semver counts as a stat | Covered |
| RCI-7 | Self-contained block earns the floor, One unique-data phrase adds credit, First-person lead adds credit | Covered |
| RCI-11 | Block at 65 counts toward coverage | Covered |