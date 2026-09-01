# Delta for Schema Engine

> **Change**: `sprint-12-dogfood-geo-score` · **Type**: Delta (MODIFIED + ADDED)

## Racional

El contrato `SchemaResult` no expone el `score` del engine (rubric 0-100, 12 criterios, RSC-13). Los presentadores reconstruyen el puntaje como proxy `100 - issues*10`, que muestra "Datos estructurados 10" cuando el engine da 61. El fix es aditivo: el contrato gana `score` y el pipeline lo propaga (`toContractResult`, `emptySchemaResult`), unificando web + PDF con el GEO Score, que ya consume `engines.schema.score`.

## MODIFIED Requirements

### Requirement: Partial-Credit Schema Scoring (RSC-13)

The schema dimension MUST award intermediate points per criterion (not only the discrete 0/5/10/15 steps), so partial compliance (e.g., an Organization node missing one recommended property, or one valid node among several missing) earns partial credit instead of a hard floor. Exact point tiers follow the WU-2 calibration decision. The resulting rubric `score` (0-100) MUST be carried in the shared contract so every consumer renders the engine's real number, never a reconstructed proxy.
(Previously: the rubric score existed only engine-locally; contract consumers reconstructed `100 - issues*10` as a proxy.)

#### Scenario: Partial schema earns intermediate credit

- GIVEN a page with a valid Organization node that is missing one recommended property
- WHEN the schema dimension is scored
- THEN the criterion earns an intermediate point value between 0 and 15 (not just 0/5/10/15)

#### Scenario: Full schema earns the cap

- GIVEN a page with Organization + WebSite nodes and all required/recommended properties present
- WHEN the schema dimension is scored
- THEN the criterion reaches the full point value

## ADDED Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| RSC-14 | SchemaResult exposes engine score | New | MUST | `SchemaResult` carries the rubric `score` (0-100); `toContractResult` maps it; `emptySchemaResult` defaults to 0 |

### Requirement: SchemaResult Exposes Engine Score (RSC-14)

The shared contract MUST expose the schema engine's rubric `score`: `schemaResultSchema` MUST include a numeric `score` bounded 0-100; `toContractResult` MUST map `SchemaEngineResult.score` into it; `emptySchemaResult` MUST default it to 0 (degraded engine path). The schema fixture MUST carry a realistic `score` so consumers assert the engine value, not a derived proxy.

#### Scenario: Contract carries the rubric score

- GIVEN a `SchemaEngineResult` with rubric `score = 61` (e.g. 9 warnings under the partial-credit rubric)
- WHEN `toContractResult` maps it
- THEN `SchemaResult.score === 61` and the value is not reconstructed from `issues`
- AND the fixture `auditResultFixture.schema.score` matches the engine value

#### Scenario: Degraded engine defaults to 0

- GIVEN an audit where the schema engine failed
- WHEN `emptySchemaResult()` builds the contract section
- THEN `schema.score === 0` and no exception is raised

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RSC-13 | Partial schema earns intermediate credit, Full schema earns the cap | Covered (unchanged) |
| RSC-14 | Contract carries the rubric score, Degraded engine defaults to 0 | Covered |
