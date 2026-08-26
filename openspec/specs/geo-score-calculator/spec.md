# GEO Score Calculator Specification

## Purpose

Compute a weighted composite GEO Score (0-100) from the five available engine scores using the v2.0.0 calibrated weight configuration (WU-2 calibration decision, sprint 9: citability 28%, E-E-A-T 24%, Technical 20%, Schema 14%, Platform 14%). Assign a severity band label and tag per-engine findings with severity levels. Embed a `scoringModelVersion` field for traceable weight evolution across sprints.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| RGS-1 | Renormalized weights | MUST | Use v2.0.0 calibrated weights: citability 28%, E-E-A-T 24%, Technical 20%, Schema 14%, Platform 14% (=100); citability stays dominant |
| RGS-2 | Technical dimension composition | MUST | Technical score MUST be composed from crawler access score + platform sub-signals (TTFB/size/compression proxies) — no standalone Technical engine |
| RGS-3 | Weighted composite | MUST | Compute composite as weighted average of available dimension scores |
| RGS-4 | Score rounding and capping | MUST | Round the composite score to the nearest integer and cap at 100 |
| RGS-5 | Severity band assignment | MUST | Map rounded score to band: 90-100 Excellent, 75-89 Good, 60-74 Fair, 40-59 Poor, 0-39 Critical; recalibration MUST NOT re-map bands as inflation |
| RGS-6 | Finding severity tagging | MUST | Tag each engine-provided finding as Critical, High, Medium, or Low based on the engine's own severity metadata |
| RGS-7 | scoringModelVersion | MUST | Output MUST include `scoringModelVersion: "2.0.0"` and a weights config object documenting the renormalization |
| RGS-8 | Brand Authority note | MUST | Output MUST note that Brand Authority (20% in brief §8.1) was renormalized out in v2.0.0 and will re-enter with a future model version |
| RGS-9 | Missing engine handling | MUST | If an engine fails (returns error state), exclude it from the weighted composite and note the exclusion in output |
| RGS-10 | Zero-content handling | MUST | A page with zero extractable content blocks MUST produce a valid score (0 for citability, non-zero possible for other dimensions) |

### Requirement: Renormalized Weights (RGS-1)

The calculator MUST use the v2.0.0 calibrated weight distribution (WU-2 diagnostic decision, sprint 9): citability 28%, E-E-A-T 24%, Technical 20%, Schema 14%, Platform 14%. Citability remains the dominant dimension; the five weights sum to 100%.
(Previously: Sprint 1 fixed weights — citability 31.25%, E-E-A-T 25%, Technical 18.75%, Schema 12.5%, Platform 12.5%.)

#### Scenario: All engines score 80

- GIVEN citability=80, E-E-A-T=80, technical=80, schema=80, platform=80
- WHEN the composite is computed
- THEN the result is 80 (all equal, weighted average = raw)

#### Scenario: Uneven scores with weights applied

- GIVEN citability=60, E-E-A-T=90, technical=50, schema=100, platform=40
- WHEN the composite is computed
- THEN the result reflects weights: (60×0.28 + 90×0.24 + 50×0.20 + 100×0.14 + 40×0.14) = 68.0 → 68

#### Scenario: Citability stays dominant

- GIVEN the v2.0.0 weights config
- WHEN the composite is computed
- THEN citability carries the highest single weight among the five dimensions
- AND the five weights sum to 100%

### Requirement: Severity Band Assignment (RGS-5)

The system MUST map the rounded composite score to the 5-band severity label.

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

The output MUST include versioned weight metadata.

#### Scenario: Version field present

- GIVEN any valid set of engine scores
- WHEN the GEO Score calculator runs
- THEN the output contains `scoringModelVersion: "2.0.0"`
- AND a `weights` object documents the 5-dimension distribution
- AND a `renormalizationNote` explains the Brand Authority exclusion

### Requirement: Missing Engine Handling (RGS-9)

If an engine fails, it MUST be excluded from the weighted composite.

#### Scenario: Schema engine fails

- GIVEN schema engine returns `{ status: "error", reason: "unsupported_content_type" }`
- AND all other engines return valid scores (citability=70, eeat=65, technical=55, platform=80)
- WHEN the composite is computed
- THEN schema is excluded
- AND weights are re-balanced among the remaining 4 engines
- AND the output notes schema exclusion with the error reason

### Requirement: Zero-Content Handling (RGS-10)

A page with no extractable content MUST produce a valid score.

#### Scenario: Empty page (no content blocks)

- GIVEN crawler=60, citability=0 (no blocks), eeat=10, schema=0, platform=30
- WHEN the GEO Score is computed
- THEN a valid composite score is returned (not NaN, not error)
- AND citability=0 is documented as "no extractable content blocks"

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RGS-1 | All engines score 80, Uneven scores with weights, Citability stays dominant | Covered |
| RGS-2 | (tested via composite scenarios — technical input is pre-composed) | Implicit |
| RGS-3 | (tested via RGS-1 scenarios) | Implicit |
| RGS-4 | (tested via RGS-5 boundary scenarios + 100 cap) | Covered |
| RGS-5 | Score 92 Excellent, Score 74 Fair, Score 39 Critical, Score 100 cap, Recalibration does not shift bands | Covered |
| RGS-6 | (tested via engine finding fixtures with severity metadata) | Covered |
| RGS-7 | Version field present | Covered |
| RGS-8 | (tested via RGS-7 scenario — renormalizationNote present) | Implicit |
| RGS-9 | Schema engine fails | Covered |
| RGS-10 | Empty page no content blocks | Covered |
