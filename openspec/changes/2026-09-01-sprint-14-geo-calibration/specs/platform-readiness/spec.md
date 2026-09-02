# Delta for Platform Readiness

> **Change**: `2026-09-01-sprint-14-geo-calibration` · **Type**: Delta (ADDED)

## Racional

El score de cada platform es la suma de criterios medidos (`sumMeasured`); la rúbrica AIO — la que se cablea como dimensión `platform` del composite (RGS-2) — tiene techo 70 medido + 30 not_measured. Esos 30 pts aplanaban a todos los sitios. v3.1 rescalea ×100/70 en el engine (una sola vez, en la fuente), de modo que la rúbrica AIO totalmente medida llega a 100 y el valor rescaleado fluye igual a la dimensión directa (14%) y a `composeTechnical` (40% de technical) sin doble rescale.

| # | Change | Summary |
|---|--------|---------|
| RPL-12 | ADDED | Rescale per-platform ×100/70 (techo measured-only), aplicado una vez en el engine |

## ADDED Requirements

### Requirement: Measured-Only Ceiling Rescale (RPL-12)

The platform engine MUST rescale each per-platform score to the measured-only ceiling by the factor ×100/70 (the AIO rubric's measured maximum: 70 measured points + 30 not_measured external points), applied once at per-platform score computation. The rescaled AIO score MUST be the value that flows to the contract, the report row, the `platform` dimension (14% weight), and `composeTechnical` (40% of the technical dimension); no downstream consumer MAY re-scale it.
(Reason: the 30 not_measured points flattened every site in the sprint-14 benchmark (+1-3/site correction); rescaling at the source keeps all consumers consistent and prevents double-counting the rescale. The pre-existing double ENTRY of platform into the composite — direct weight + technical composition, RGS-2 — is unchanged; only the value is honest.)

#### Scenario: Fully-measured AIO reaches 100

- GIVEN all AIO measured on-page signals max out (raw score 70)
- WHEN the per-platform score is rescaled
- THEN the AIO score is 100 (70 × 100/70)

#### Scenario: Partial measured signals rescale proportionally

- GIVEN an AIO raw score of 35 (half of the measured maximum)
- WHEN the per-platform score is rescaled
- THEN the AIO score is 50

#### Scenario: Rescale is single-sourced

- GIVEN a v3.1 audit with a rescaled AIO score
- WHEN the composite is computed
- THEN the `platform` dimension (14%) and `composeTechnical` both consume the SAME rescaled value
- AND no other stage of the pipeline re-scales the platform score

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RPL-12 | Fully-measured AIO reaches 100, Partial measured signals rescale proportionally, Rescale is single-sourced | Covered |