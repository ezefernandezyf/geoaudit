# Delta for Audit Presenters

> **Change**: `sprint-12-dogfood-geo-score` · **Type**: Delta (MODIFIED)

## Racional

La fila "Datos estructurados" del desglose muestra un proxy (`100 - issues*10`) en lugar del score real del engine, rompiendo la coherencia con el GEO Score y la severidad de hallazgos. Con RSC-14 el contrato expone `schema.score`; la derivación única en `domain-metrics` (compartida por web, PDF y findings) pasa a leer ese valor.

## MODIFIED Requirements

### Requirement: Category Scores (APT-6)

When deriving category scores, then the adapter MUST produce exactly five entries (Acceso de bots, Citabilidad, E-E-A-T, Datos estructurados, Plataforma) using the real engine outputs (`crawlers.compositeScore`, `citability.pageScore`, `content.composite`, `schema.score`, `derivePlatformScore(perPlatform)`), the same derivation as `rowScore`.
(Previously: the Datos estructurados row used `deriveSchemaScore(schema)` reconstructing `100 - issues*10`; the fixture had 1 issue and showed 90 instead of the engine value.)

#### Scenario: Five real category scores

- GIVEN an `AuditResult` with all five engines present
- WHEN the adapter maps
- THEN `categoryScores` has length 5 and each score equals the corresponding engine value
- AND the Datos estructurados entry equals `schema.score` of the contract (e.g. fixture with `issues: ["Organization missing sameAs"]` shows the fixture score, not 90)

#### Scenario: Derivation is shared across web, PDF, and findings

- GIVEN a schema section whose engine rubric score is 61 with 9 warnings
- WHEN `deriveSchemaScore(schema)` runs (single source in `domain-metrics`)
- THEN the row, the PDF template, and the findings severity all use 61, never the `100 - 9*10 = 10` proxy
- AND findings tests no longer assert the derived proxy

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| APT-6 | Five real category scores, Derivation is shared across web/PDF/findings | Covered |
