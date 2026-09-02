# Delta for Audit Presenters

> **Change**: `2026-09-01-sprint-14-geo-calibration` · **Type**: Delta (MODIFIED)

## Racional

El adapter pasa el band del calculador (no computa umbrales), pero sus fixtures y el contrato "the real thresholds" referenciaban 90/75/60/40. v3.1 actualiza esa referencia a 80/65/50/30 (los umbrales reales del calculador, que siguen siendo distintos de los de Gemini 80/65/45/25).

| # | Change | Summary |
|---|--------|---------|
| APT-2 | MODIFIED | Umbrales reales 80/65/50/30 en el escenario de normalización |

## MODIFIED Requirements

### Requirement: Score + Band Normalization (APT-2)

When mapping the score, then the adapter MUST copy `summary.geoScore` to `totalScore` unchanged and MUST convert the Capitalized `severityBand` to its lowercase equivalent (`Excellent`→`excellent`, `Good`→`good`, `Fair`→`fair`, `Poor`→`poor`, `Critical`→`critical`). The band itself always comes from the calculator's `severityForScore` — the adapter never recomputes thresholds.
(Previously: fixtures asserted the 90/75/60/40 real thresholds.)

#### Scenario: Band lowercased

- GIVEN `summary.geoScore = 92` and `severityBand = "Excellent"`
- WHEN the adapter maps
- THEN `totalScore === 92` and `band === "excellent"`

#### Scenario: Thresholds are the real ones

- GIVEN a score of 74
- WHEN the adapter maps
- THEN `band === "good"` (real v3.1.0 thresholds 80/65/50/30 — never Gemini's 80/65/45/25)

#### Scenario: Band boundaries discriminate from Gemini

- GIVEN a score of 47
- WHEN the adapter maps
- THEN `band === "poor"` (real 30-49 band; Gemini's 80/65/45/25 would map 47 to fair)

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| APT-2 | Band lowercased, Thresholds are the real ones, Band boundaries discriminate from Gemini | Covered |