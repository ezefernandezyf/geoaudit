# Delta for Audit Presenters

> **Change**: `sprint-13-brand-authority` · **Type**: Delta (MODIFIED)

## Racional

El desglose suma la 6ª fila "Autoridad de marca": `DOMAIN_ROWS` +1, `rowScore` con el caso `brand`, `ENGINE_WEIGHT` +20%, `CATEGORY_DESCRIPTION` +1 entrada. El presentador debe distinguir un 0 medido (brand engine presente, "sin presencia externa") de una medición ausente (filas legacy v2 sin `brandAuthority` → "No medido") — el default 0 de `rowScore` fabricaría un valor medido y viola APT-10.

| # | Change | Summary |
|---|--------|---------|
| APT-6 | MODIFIED | `categoryScores` pasa de 5 a 6 entradas (Autoridad de marca) |
| APT-11 | ADDED | Honestidad de la fila brand: 0 medido vs "No medido" legacy |

## MODIFIED Requirements

### Requirement: Category Scores (APT-6)

When deriving category scores, then the adapter MUST produce exactly six entries (Acceso de bots, Citabilidad, E-E-A-T, Datos estructurados, Plataforma, Autoridad de marca) using the real engine outputs (`crawlers.compositeScore`, `citability.pageScore`, `content.composite`, `schema.score`, `derivePlatformScore(perPlatform)`, brand engine score via the shared `rowScore` `brand` case), the same derivation as `rowScore`.
(Previously: five entries; no brand row.)

#### Scenario: Six real category scores

- GIVEN an `AuditResult` with all six engines present
- WHEN the adapter maps
- THEN `categoryScores` has length 6 and each score equals the corresponding engine value
- AND the Autoridad de marca entry equals the `brandAuthority` score of the contract

#### Scenario: Derivation is shared across web, PDF, and findings

- GIVEN a schema section whose engine rubric score is 61 with 9 warnings
- WHEN `deriveSchemaScore(schema)` runs (single source in `domain-metrics`)
- THEN the row, the PDF template, and the findings severity all use 61, never the `100 - 9*10 = 10` proxy
- AND findings tests no longer assert the derived proxy

## ADDED Requirements

### Requirement: Brand Row Honesty (APT-11)

When deriving the brand row, the adapter MUST distinguish a measured zero from an absent measurement: `brandAuthority` present with score 0 (measured "no external presence") MUST render 0 with the description "sin presencia externa"; `brandAuthority` absent (legacy 2.0.0 rows) MUST render "No medido". The derivation MUST NOT fall back to `rowScore`'s default 0, which would fabricate a measured value.

#### Scenario: Measured zero renders 0

- GIVEN a v3 result with `brandAuthority.score = 0`
- WHEN the adapter maps the brand row
- THEN the row shows 0
- AND its description reads "sin presencia externa"

#### Scenario: Legacy row without brandAuthority renders No medido

- GIVEN a 2.0.0 result without `brandAuthority`
- WHEN the adapter maps the brand row
- THEN the row renders "No medido" (never 0)
- AND the row still shows its 20% weight

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| APT-6 | Six real category scores, Derivation is shared across web/PDF/findings | Covered |
| APT-11 | Measured zero renders 0, Legacy row without brandAuthority renders No medido | Covered |