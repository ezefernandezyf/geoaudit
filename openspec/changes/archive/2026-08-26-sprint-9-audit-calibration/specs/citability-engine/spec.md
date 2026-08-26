# Citability Engine Specification (Delta)

> **Change**: `sprint-9-audit-calibration` · **Type**: Delta (MODIFIED)

## Purpose

Soften the citability rubrics with partial credit (option "b") so commercial sites are not crushed: answer-block quality, structural readability, and statistical density MUST award intermediate points instead of all-or-nothing. The exact point thresholds are fixed by the WU-2 calibration decision.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| RCI-3 | Answer Block Quality (30%) | Partial | MUST | Award partial credit for partial answer patterns, not binary |
| RCI-5 | Structural Readability (20%) | Partial | MUST | Award partial credit for partial structure, not binary |
| RCI-6 | Statistical Density (15%) | Partial | MUST | Award intermediate points per stat density level |

### Requirement: Answer Block Quality (RCI-3)

The system MUST score each block for answer-block patterns, awarding partial credit for partial matches (e.g., a definition without an immediate answer, or an answer without a standalone first-60-words) instead of all-or-nothing. Exact thresholds follow the WU-2 calibration decision.
(Previously: binary scoring — full credit only for definition + immediate answer + standalone lead.)

#### Scenario: Definition pattern detected

- GIVEN a block starting with "API rate limiting is a technique used to control…"
- WHEN Answer Block Quality is scored
- THEN the score is ≥ 70 (definition pattern "is" + answer in first sentence)
- AND the first-60-words standalone check contributes positively

#### Scenario: No answer pattern

- GIVEN a block starting with "In this section, we will discuss various features…" (no definition)
- WHEN Answer Block Quality is scored
- THEN the score is < 40 (no definition, no immediate answer)

#### Scenario: Partial answer pattern earns intermediate credit

- GIVEN a block with a definition but the answer buried after 3 sentences
- WHEN Answer Block Quality is scored
- THEN the block earns partial credit (> 0, below full) rather than 0

### Requirement: Structural Readability (RCI-5)

The system MUST score structural readability with partial credit for partial compliance (e.g., clean hierarchy but no lists/tables, or question-as-heading but paragraphs longer than 4 sentences). Exact thresholds follow the WU-2 calibration decision.
(Previously: full credit only when all sub-checks passed.)

#### Scenario: Partial structure earns intermediate credit

- GIVEN a block with a clean H1>H2>H3 hierarchy but no tables/lists
- WHEN Structural Readability is scored
- THEN the block earns partial credit instead of the minimum

### Requirement: Statistical Density (RCI-6)

The system MUST award intermediate points by stat-density level (percentages, currency, dates, named sources) rather than a binary rich/poor split. Exact tiers follow the WU-2 calibration decision.
(Previously: binary — ≥1 stat/500 words full credit, else ≤ 10.)

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

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RCI-3 | Definition pattern detected, No answer pattern, Partial answer pattern earns intermediate credit | Covered |
| RCI-5 | Partial structure earns intermediate credit | Covered |
| RCI-6 | Stats-rich block, Partial stat block earns intermediate credit, Stats-poor block | Covered |
