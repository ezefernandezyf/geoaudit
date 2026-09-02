# GEO Score Calculator Specification

## Purpose

Compute a weighted composite GEO Score (0-100) from the six available engine scores using the v3.0.0 calibrated weight configuration (sprint 13: citability 22.4%, E-E-A-T 19.2%, Technical 16%, Schema 11.2%, Platform 11.2%, Brand Authority 20%). Assign a severity band label and tag per-engine findings with severity levels. Embed a `scoringModelVersion` field for traceable weight evolution across sprints.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| RGS-1 | Renormalized weights | MUST | Use v3.0.0 calibrated weights: citability 22.4%, E-E-A-T 19.2%, Technical 16%, Schema 11.2%, Platform 11.2%, Brand Authority 20% (=100); citability stays dominant |
| RGS-2 | Technical dimension composition | MUST | Technical score MUST be composed from crawler access score + platform sub-signals (TTFB/size/compression proxies) — no standalone Technical engine |
| RGS-3 | Weighted composite | MUST | Compute composite as weighted average of available dimension scores |
| RGS-4 | Score rounding and capping | MUST | Round the composite score to the nearest integer and cap at 100 |
| RGS-5 | Severity band assignment | MUST | Map rounded score to band: 90-100 Excellent, 75-89 Good, 60-74 Fair, 40-59 Poor, 0-39 Critical; recalibration MUST NOT re-map bands as inflation |
| RGS-6 | Finding severity tagging | MUST | Tag each engine-provided finding as Critical, High, Medium, or Low based on the engine's own severity metadata |
| RGS-7 | scoringModelVersion | MUST | Output MUST include `scoringModelVersion: "3.0.0"` and a weights config object documenting the 6-dimension renormalization |
| RGS-8 | Brand Authority note | MUST | Output MUST note that Brand Authority re-entered the model in v3.0.0 at 20% (brief §8.1) |
| RGS-9 | Missing engine handling | MUST | If an engine fails (returns error state), exclude it from the weighted composite and note the exclusion in output |
| RGS-10 | Zero-content handling | MUST | A page with zero extractable content blocks MUST produce a valid score (0 for citability, non-zero possible for other dimensions) |
| RGS-11 | Brand authority dimension | ADDED | MUST | Register `brand_authority` in `DimensionKey` + `DIMENSIONS`; missing brand follows RGS-9, measured 0 is a real 20% penalty |

### Requirement: Renormalized Weights (RGS-1)

The calculator MUST use the v3.0.0 calibrated weight distribution (sprint 13): citability 22.4%, E-E-A-T 19.2%, Technical 16%, Schema 11.2%, Platform 11.2%, Brand Authority 20%. Citability remains the dominant dimension; the six weights sum to 100%.
(Previously: v2.0.0 weights — citability 28%, E-E-A-T 24%, Technical 20%, Schema 14%, Platform 14%, five dimensions.)

#### Scenario: All engines score 80

- GIVEN citability=80, E-E-A-T=80, technical=80, schema=80, platform=80, brand_authority=80
- WHEN the composite is computed
- THEN the result is 80 (all equal, weighted average = raw)

#### Scenario: Uneven scores with weights applied

- GIVEN citability=60, E-E-A-T=90, technical=50, schema=100, platform=40, brand_authority=70
- WHEN the composite is computed
- THEN the result reflects weights: (60×0.224 + 90×0.192 + 50×0.16 + 100×0.112 + 40×0.112 + 70×0.20) = 68.4 → 68

#### Scenario: Citability stays dominant

- GIVEN the v3.0.0 weights config
- WHEN the composite is computed
- THEN citability carries the highest single weight among the six dimensions
- AND the six weights sum to 100%

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
- THEN the output contains `scoringModelVersion: "3.0.0"`
- AND a `weights` object documents the 6-dimension distribution
- AND a `renormalizationNote` explains the Brand Authority re-entry at 20%

### Requirement: Brand Authority Note (RGS-8)

The output MUST note that Brand Authority re-entered the model in v3.0.0 at 20% (brief §8.1), replacing the v2.0.0 renormalization-out note.
(Previously: table-only — the note stated Brand Authority was renormalized out in v2.0.0 and would re-enter with a future version.)

#### Scenario: Note documents the re-entry

- GIVEN the v3.0.0 weights config
- WHEN the calculator runs
- THEN the output's `renormalizationNote` references the 6-dimension distribution and the Brand Authority re-entry at 20%

### Requirement: Missing Engine Handling (RGS-9)

If an engine fails, it MUST be excluded from the weighted composite.

#### Scenario: Schema engine fails

- GIVEN schema engine returns `{ status: "error", reason: "unsupported_content_type" }`
- AND all other engines return valid scores (citability=70, eeat=65, technical=55, platform=80, brand_authority=50)
- WHEN the composite is computed
- THEN schema is excluded
- AND weights are re-balanced among the remaining 5 engines
- AND the output notes schema exclusion with the error reason

### Requirement: Zero-Content Handling (RGS-10)

A page with no extractable content MUST produce a valid score.

#### Scenario: Empty page (no content blocks)

- GIVEN crawler=60, citability=0 (no blocks), eeat=10, schema=0, platform=30, brand_authority=0 (no external presence)
- WHEN the GEO Score is computed
- THEN a valid composite score is returned (not NaN, not error)
- AND citability=0 is documented as "no extractable content blocks"
- AND brand=0 is documented as "no external presence"

### Requirement: Brand Authority Dimension (RGS-11)

The calculator MUST register the 6th dimension: `DimensionKey` MUST include `brand_authority`, `DIMENSIONS` MUST list it, and `computeGeoScore` MUST map the brand engine score into the dimension. A missing brand engine follows RGS-9 (excluded, weights re-balanced); a measured 0 is a real 20%-weighted penalty documented in the output notes.

#### Scenario: Six dimensions registered

- GIVEN the v3.0.0 weights config
- WHEN `DIMENSIONS` and the weight map are inspected
- THEN `DIMENSIONS` has 6 entries including `brand_authority`
- AND the six weights sum to 100%

#### Scenario: Brand engine fails → excluded

- GIVEN the brand engine returns `{ status: "error", reason: "wikidata_rate_limit" }`
- AND the other five engines return valid scores
- WHEN the composite is computed
- THEN brand_authority is excluded
- AND weights are re-balanced among the remaining 5 engines
- AND the output notes "brand_authority excluded (wikidata_rate_limit)"

#### Scenario: Brand = 0 penalizes the composite

- GIVEN citability=80, eeat=80, technical=80, schema=80, platform=80, brand_authority=0 (no external presence)
- WHEN the composite is computed
- THEN the result is 64 (the 20% brand weight at 0 on an otherwise-all-80 set)
- AND a note documents "brand 0: no external presence"

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
| RGS-8 | Note documents the re-entry | Covered |
| RGS-9 | Schema engine fails | Covered |
| RGS-10 | Empty page no content blocks | Covered |
| RGS-11 | Six dimensions registered, Brand engine fails → excluded, Brand = 0 penalizes the composite | Covered |
