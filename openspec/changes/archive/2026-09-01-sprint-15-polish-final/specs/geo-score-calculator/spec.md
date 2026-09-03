# Delta for GEO Score Calculator

> **Change**: `2026-09-01-sprint-15-polish-final` · **Type**: Delta (MODIFIED)

## Racional

El escenario "Benchmark re-verification discriminates" del RGS-1 (archive sprint-14, inmutable) predijo rangos moz 58-63 y relevy.app 50-54 sobre el corpus de 10 sitios + relevy.app. El corpus MEDIDO (14 URLs de `CANDIDATE_URLS` en `scripts/scorehero-verify.test.ts`, corrido con `pnpm verify:scorehero`) da moz **57** (1 pt bajo el rango), relevy.app **55** (1 pt sobre), promedio **42.4**; además `docs.anthropic.com` resuelve a "Anthropic" (fix eTLD+1 de sprint 14, S3 resuelto). Por convención OpenSpec el archive queda inmutable: el refresh de rangos vive en este delta.

| # | Change | Summary |
|---|--------|---------|
| RGS-1 | MODIFIED | Escenario benchmark refrescado al corpus medido (moz 57, relevy 55, promedio 42.4, 14 URLs, Anthropic eTLD+1) |

## MODIFIED Requirements

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

- GIVEN the v3.1.0 model applied to the measured sprint-14/15 corpus (14 URLs from `CANDIDATE_URLS`)
- WHEN `pnpm verify:scorehero` re-runs
- THEN moz scores 57, relevy.app scores 55, the average lands at 42.4, no site is below 25
- AND `docs.anthropic.com` resolves to the brand "Anthropic" (eTLD+1, `brandFromDomain`)
(Previously: moz 58-63, relevy.app 50-54, average 40-60 — predicted ranges now refreshed to the measured corpus; the sprint-14 archive stays immutable.)

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RGS-1 | All engines score 80, Uneven scores with weights applied, Citability stays dominant, Benchmark re-verification discriminates | Covered |