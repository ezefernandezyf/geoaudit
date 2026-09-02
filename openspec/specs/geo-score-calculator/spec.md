# GEO Score Calculator Specification

> **Change**: `sprint-13-brand-authority` + `sprint-14-geo-calibration` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

Compute a weighted composite GEO Score (0-100) from the six available engine scores using the v3.1.0 calibrated weight configuration (sprint 14: citability 24%, E-E-A-T 23%, Technical 15%, Schema 12%, Platform 14%, Brand Authority 12%). Assign a severity band label (80/65/50/30) and tag per-engine findings with severity levels. Embed a `scoringModelVersion` field for traceable weight evolution across sprints.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| RGS-1 | Renormalized weights | MUST | Use v3.1.0 calibrated weights: citability 24%, E-E-A-T 23%, Technical 15%, Schema 12%, Platform 14%, Brand Authority 12% (=100); citability stays dominant |
| RGS-2 | Technical dimension composition | MUST | Technical score MUST be composed from crawler access score + platform sub-signals (TTFB/size/compression proxies) — no standalone Technical engine |
| RGS-3 | Weighted composite | MUST | Compute composite as weighted average of available dimension scores |
| RGS-4 | Score rounding and capping | MUST | Round the composite score to the nearest integer and cap at 100 |
| RGS-5 | Severity band assignment | MUST | Map rounded score to band: 80-100 Excellent, 65-79 Good, 50-64 Fair, 30-49 Poor, 0-29 Critical; version-bump calibration driven by the unreachable-ceiling evidence (never a cosmetic re-mapping) |
| RGS-6 | Finding severity tagging | MUST | Tag each engine-provided finding as Critical, High, Medium, or Low based on the engine's own severity metadata |
| RGS-7 | scoringModelVersion | MUST | Output MUST include `scoringModelVersion: "3.1.0"` and a weights config object documenting the 6-dimension renormalization; the contract union MUST accept "2.0.0" \| "3.0.0" \| "3.1.0" on read; new audits MUST write "3.1.0" |
| RGS-8 | Brand Authority note | MUST | Output MUST note that Brand Authority re-entered the model in v3.0.0 at 20% (brief §8.1) and was recalibrated to 12% in v3.1.0 so the score measures GEO visibility, not brand fame |
| RGS-9 | Missing engine handling | MUST | If an engine fails (returns error state), exclude it from the weighted composite and note the exclusion in output |
| RGS-10 | Zero-content handling | MUST | A page with zero extractable content blocks MUST produce a valid score (0 for citability, non-zero possible for other dimensions) |
| RGS-11 | Brand authority dimension | ADDED | MUST | Register `brand_authority` in `DimensionKey` + `DIMENSIONS`; missing brand follows RGS-9, measured 0 is a real 12% penalty (no longer caps a perfect on-page 80+ without Wikipedia) |

### Requirement: Renormalized Weights (RGS-1)

The calculator MUST use the v3.1.0 calibrated weight distribution (sprint 14): citability 24%, E-E-A-T 23%, Technical 15%, Schema 12%, Platform 14%, Brand Authority 12%. Citability remains the dominant dimension; the six weights sum to 100%.
(Previously: v3.0.0 weights — citability 22.4%, E-E-A-T 19.2%, Technical 16%, Schema 11.2%, Platform 11.2%, Brand Authority 20%.)

#### Scenario: All engines score 80

- GIVEN citability=80, E-E-A-T=80, technical=80, schema=80, platform=80, brand_authority=80
- WHEN the composite is computed
- THEN the result is 80 (all equal, weighted average = raw)

#### Scenario: Uneven scores with weights applied

- GIVEN citability=60, E-E-A-T=90, technical=50, schema=100, platform=40, brand_authority=70
- WHEN the composite is computed
- THEN the result reflects weights: (60×0.24 + 90×0.23 + 50×0.15 + 100×0.12 + 40×0.14 + 70×0.12) = 68.6 → 69

#### Scenario: Citability stays dominant

- GIVEN the v3.1.0 weights config
- WHEN the composite is computed
- THEN citability carries the highest single weight among the six dimensions
- AND the six weights sum to 100%

#### Scenario: Benchmark re-verification discriminates

- GIVEN the v3.1.0 model applied to the sprint-14 corpus (10 sites + relevy.app)
- WHEN `pnpm verify:scorehero` re-runs
- THEN moz scores 58-63, relevy.app scores 50-54, the average lands in 40-60, and no site is below 25

### Requirement: Severity Band Assignment (RGS-5)

The system MUST map the rounded composite score to the 5-band severity label using the v3.1.0 bands: 80-100 Excellent, 65-79 Good, 50-64 Fair, 30-49 Poor, 0-29 Critical.
(Previously: 90-100 Excellent, 75-89 Good, 60-74 Fair, 40-59 Poor, 0-39 Critical — 90+ mathematically unreachable per the sprint-14 benchmark.)

#### Scenario: Score 92 → Excellent

- GIVEN a composite score of 92.3
- WHEN the score is rounded to 92
- THEN the severity band is "Excellent"

#### Scenario: Score 74 → Good

- GIVEN a composite score of 73.8
- WHEN the score is rounded to 74
- THEN the severity band is "Good" (65-79 band)

#### Scenario: Score 39 → Poor

- GIVEN a composite score of 39
- WHEN the band is assigned
- THEN the severity band is "Poor" (30-49 band)

#### Scenario: Score 100 cap

- GIVEN a composite score of 103 (mathematically impossible but defensively handled)
- WHEN the score is capped
- THEN the output score is 100
- AND the band is "Excellent"

#### Scenario: Band boundaries are exact

- GIVEN scores 80, 65, 50, 30, and 29
- WHEN bands are assigned
- THEN 80→Excellent, 65→Good, 50→Fair, 30→Poor, and 29→Critical

#### Scenario: Bands change only with a version bump

- GIVEN the v3.1.0 model
- WHEN the band is assigned for any score
- THEN thresholds are 80/65/50/30, documented as a version-bump calibration driven by the unreachable-ceiling evidence — never a cosmetic re-mapping

### Requirement: scoringModelVersion (RGS-7)

The output MUST include versioned weight metadata: `scoringModelVersion: "3.1.0"` plus a weights config object documenting the 6-dimension v3.1 distribution. The `auditResultSchema` union MUST accept "2.0.0", "3.0.0", and "3.1.0" on read; new audits MUST write "3.1.0".
(Previously: "3.0.0"; contract union accepted only "2.0.0" | "3.0.0".)

#### Scenario: Version field present

- GIVEN any valid set of engine scores
- WHEN the GEO Score calculator runs
- THEN the output contains `scoringModelVersion: "3.1.0"`
- AND a `weights` object documents the 6-dimension v3.1 distribution
- AND a `renormalizationNote` explains the brand re-entry (20%, v3.0.0) and recalibration (12%, v3.1.0)

#### Scenario: Legacy rows still validate

- GIVEN persisted rows with `scoringModelVersion` "2.0.0" or "3.0.0"
- WHEN they are parsed by `auditResultSchema`
- THEN they validate (union widened, no DB migration required)

### Requirement: Brand Authority Note (RGS-8)

The output MUST note that Brand Authority re-entered the model in v3.0.0 at 20% (brief §8.1) and was recalibrated to 12% in v3.1.0 so the score measures GEO visibility, not brand fame.
(Previously: re-entry at 20% only.)

#### Scenario: Note documents re-entry and recalibration

- GIVEN the v3.1.0 weights config
- WHEN the calculator runs
- THEN the output's `renormalizationNote` references the v3.1.0 distribution and the Brand Authority 20% → 12% recalibration

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

The calculator MUST register the 6th dimension: `DimensionKey` MUST include `brand_authority`, `DIMENSIONS` MUST list it, and `computeGeoScore` MUST map the brand engine score into the dimension. A missing brand engine follows RGS-9 (excluded, weights re-balanced); a measured 0 is a real 12%-weighted penalty documented in the output notes.
(Previously: 20%-weighted penalty.)

#### Scenario: Six dimensions registered

- GIVEN the v3.1.0 weights config
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
- THEN the result is 70 (the 12% brand weight at 0 on an otherwise-all-80 set: 80×0.88 = 70.4 → 70)
- AND a note documents "brand 0: no external presence"

#### Scenario: Brand 0 no longer caps the top band

- GIVEN citability=100, eeat=100, technical=100, schema=100, platform=100, brand_authority=0 (no external presence)
- WHEN the composite is computed
- THEN the result is 88 (100×0.88)
- AND the band is "Excellent" — a perfect on-page site without Wikipedia reaches 80+

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RGS-1 | All engines score 80, Uneven scores with weights applied, Citability stays dominant, Benchmark re-verification discriminates | Covered |
| RGS-2 | (tested via composite scenarios — technical input is pre-composed) | Implicit |
| RGS-3 | (tested via RGS-1 scenarios) | Implicit |
| RGS-4 | (tested via RGS-5 boundary scenarios + 100 cap) | Covered |
| RGS-5 | Score 92 Excellent, Score 74 Good, Score 39 Poor, Score 100 cap, Band boundaries are exact, Bands change only with a version bump | Covered |
| RGS-6 | (tested via engine finding fixtures with severity metadata) | Covered |
| RGS-7 | Version field present, Legacy rows still validate | Covered |
| RGS-8 | Note documents re-entry and recalibration | Covered |
| RGS-9 | Schema engine fails | Covered |
| RGS-10 | Empty page no content blocks | Covered |
| RGS-11 | Six dimensions registered, Brand engine fails → excluded, Brand = 0 penalizes the composite, Brand 0 no longer caps the top band | Covered |
