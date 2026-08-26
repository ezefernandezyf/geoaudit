# GEO Score Calculator Specification (Delta)

> **Change**: `sprint-9-audit-calibration` · **Type**: Delta (MODIFIED)

## Purpose

Recalibrate the composite so real sites discriminate (best real sites 60-75+, not all crushed into 20-50). The re-balance is decision-driven (WU-2 diagnostic → user decision → WU-3 implementation), MUST keep citability dominant, MUST keep the 5 bands honest (no inflation re-mapping), and MUST bump `scoringModelVersion` to `2.0.0`.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| RGS-1 | Renormalized weights | Partial | MUST | Re-balance to v2.0.0 per WU-2 decision; citability stays dominant; no band re-mapping |
| RGS-5 | Severity band assignment | Partial | MUST | Keep honest 90/75/60/40 thresholds; recalibration MUST NOT re-map bands as inflation |
| RGS-7 | scoringModelVersion | Partial | MUST | Output `scoringModelVersion: "2.0.0"` |

### Requirement: Renormalized Weights (RGS-1)

The calculator MUST use the v2.0.0 weight distribution, re-balanced per the WU-2 calibration decision (recommended: softened rubrics + moderate re-balance), with citability remaining the dominant dimension and no band re-mapping (option "a" rejected). The exact numeric weights are fixed at decision time and recorded in the `weights` config object.
(Previously: Sprint 1 fixed weights — citability 31.25%, E-E-A-T 25%, Technical 18.75%, Schema 12.5%, Platform 12.5%.)

#### Scenario: All engines score 80

- GIVEN citability=80, E-E-A-T=80, technical=80, schema=80, platform=80
- WHEN the composite is computed
- THEN the result is 80 (all equal, weighted average = raw)

#### Scenario: Citability stays dominant

- GIVEN the v2.0.0 weights config
- WHEN the composite is computed
- THEN citability carries the highest single weight among the five dimensions
- AND the five weights sum to 100%

#### Scenario: Weights reflect the calibration decision

- GIVEN the WU-2 diagnostic decision has fixed the re-balance target
- WHEN the calculator runs
- THEN the weights used match the recorded v2.0.0 decision (no silent pre-decision weights)

### Requirement: Severity Band Assignment (RGS-5)

The system MUST map the rounded composite score to the 5-band severity label using the honest thresholds (90/75/60/40). The recalibration MUST NOT re-map bands as score inflation (option "a" rejected).
(Previously: same thresholds; now explicitly locked against inflation re-mapping during recalibration.)

#### Scenario: Score 92 → Excellent

- GIVEN a composite score of 92.3
- WHEN the score is rounded to 92
- THEN the severity band is "Excellent"

#### Scenario: Score 74 → Fair

- GIVEN a composite score of 73.8
- WHEN the score is rounded to 74
- THEN the severity band is "Fair"

#### Scenario: Score 39 → Critical

- GIVEN a composite score of 39
- WHEN the band is assigned
- THEN the severity band is "Critical"

#### Scenario: Score 100 cap

- GIVEN a composite score of 103 (mathematically impossible but defensively handled)
- WHEN the score is capped
- THEN the output score is 100
- AND the band is "Excellent"

#### Scenario: Recalibration does not shift bands

- GIVEN the recalibrated v2.0.0 model
- WHEN the band is assigned for any score
- THEN thresholds remain 90/75/60/40 (no inflation re-mapping)

### Requirement: scoringModelVersion (RGS-7)

The output MUST include versioned weight metadata with the bumped version.
(Previously: `scoringModelVersion: "1.0.0"`.)

#### Scenario: Version field present

- GIVEN any valid set of engine scores
- WHEN the GEO Score calculator runs
- THEN the output contains `scoringModelVersion: "2.0.0"`
- AND a `weights` object documents the v2.0.0 5-dimension distribution
- AND a `renormalizationNote` explains the Brand Authority exclusion

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RGS-1 | All engines score 80, Citability stays dominant, Weights reflect the calibration decision | Covered |
| RGS-5 | Score 92 Excellent, Score 74 Fair, Score 39 Critical, Score 100 cap, Recalibration does not shift bands | Covered |
| RGS-7 | Version field present | Covered |
