# Delta for Landing Page

> **Change**: `2026-09-01-sprint-15-polish-final` · **Type**: Delta (MODIFIED)

## Racional

El copy de pesos quedó stale en v3.0.0 (22,4/19,2/16/20/11,2/11,2) mientras el engine escribe v3.1.0 desde sprint 14: `hero.subtitleHighlight` y `faq[0]` listan los seis pesos con porcentajes y features[01-06] citan pesos v3.0 (brand "20 %"/"quinta parte"). Se sincroniza a v3.1.0 (24/23/15/12/14/12; brand 12 % → "octava parte") y el subtitle del hero pasa a names-only (sin porcentajes) manteniendo el pasaje hero ≥50 palabras (piso de la banda de extracción, LND-11). La tabla comparativa gana scroll horizontal en mobile preservando el `<table>` semántico (RCI-5/RPL-10). Co-update: `copy.test.ts`.

| # | Change | Summary |
|---|--------|---------|
| LND-11 | MODIFIED | Hero subtitle names-only (sin porcentajes); pasaje hero ≥50 palabras |
| LND-14 | MODIFIED | Tabla comparativa responsive (`overflow-x-auto` + `min-w`) preservando `<table>` semántico |
| LND-15 | ADDED | Copy de pesos alineado a v3.1.0 (24/23/15/12/14/12; brand 12 % "octava parte"); "24 puntos" y "12 criterios" intactos |

## MODIFIED Requirements

### Requirement: Citable Passages (LND-11)

When the hero and feature sections render, then the copy MUST be answer-first (definition/claim in the first 1-2 sentences), MUST include concrete statistics, and each passage MUST sit in the 50-200 word band (the citability engine's extraction band) so passages are self-contained and citable. The hero subtitle MUST list the six dimensions by NAME only, without percentages, and the full hero passage MUST remain at or above the 50-word floor of the band after the subtitle is shortened.
(Previously: hero subtitle listed the six v3.0.0 weights with percentages.)

#### Scenario: Answer-first copy with stats

- GIVEN the landing hero and feature cards
- WHEN their copy is inspected
- THEN each block leads with an answer/claim and carries at least one concrete stat

#### Scenario: Passages in the 50-200 word band

- GIVEN each hero/feature passage
- WHEN its word count is measured
- THEN it contains between 50 and 200 words
- AND the hero passage remains ≥50 words with the shortened subtitle

#### Scenario: Hero subtitle is names-only

- GIVEN the hero subtitle
- WHEN its content is inspected
- THEN it names the six dimensions without percentages (e.g. "citabilidad, E-E-A-T, acceso de bots, autoridad de marca, datos estructurados y plataforma")
- AND no percentage value appears in the subtitle

### Requirement: Comparative Table (LND-14)

The landing MUST render a comparison table (product vs alternatives / feature comparison) whose cells carry real Relevy facts — tables earn citability structure points (RCI-5) and AI extraction (RPL-10). The table MUST keep semantic `<table>` markup; on viewports narrower than the table's content width the section MUST remain horizontally scrollable (`overflow-x-auto` wrapper + a `min-w` on the table) so columns stay legible instead of squeezing.
(Previously: table rendered at full width inside an `overflow-hidden` wrapper — illegible on mobile.)

#### Scenario: Comparison table present

- GIVEN the landing page
- WHEN the comparison section renders at a 360px viewport
- THEN a semantic `<table>` with at least 3 rows of real comparison data is present
- AND the section is horizontally scrollable with a min-width table (columns keep legible width, no cell squeeze)

#### Scenario: No invented cells

- GIVEN the comparison table
- WHEN its cells are inspected
- THEN every value traces to real product facts (no placeholder or fabricated numbers)

## ADDED Requirements

### Requirement: Weight Copy Accuracy v3.1.0 (LND-15)

When the landing copy references dimension weights, then every percentage MUST match the v3.1.0 engine weights: citability 24%, E-E-A-T 23%, acceso de bots 15%, datos estructurados 12%, plataforma 14%, autoridad de marca 12%. The brand authority references MUST read "12 %" and "octava parte" — never "20 %" or "quinta parte". The copy MUST NOT contain any stale v3.0.0 value (22,4 / 19,2 / 16 / 20 / 11,2). The "24 puntos" (E-E-A-T rubric, not a weight) and "12 criterios" (schema criteria count, not a weight) references MUST remain unchanged. `copy.test.ts` MUST be co-updated in the same change.

#### Scenario: All weight references match v3.1.0

- GIVEN the hero, features[01-06], and FAQ copy
- WHEN every weight reference is inspected
- THEN each matches 24/23/15/12/14/12
- AND no stale v3.0.0 value (22,4/19,2/16/20/11,2) appears anywhere

#### Scenario: Brand reads octava parte

- GIVEN features[06] and faq[4] (brand authority)
- WHEN their weight copy is inspected
- THEN they read "12 %" and "octava parte" (no "20 %" / "quinta parte")

#### Scenario: Rubric and criteria counts untouched

- GIVEN the E-E-A-T and schema feature cards
- WHEN their non-weight copy is inspected
- THEN "24 puntos" (E-E-A-T rubric) and "12 criterios" (schema) remain unchanged

#### Scenario: copy.test.ts passes with v3.1.0

- GIVEN the co-updated assertions
- WHEN `pnpm test` runs
- THEN `copy.test.ts` passes asserting the v3.1.0 values (no stale 20% / "quinta parte")

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| LND-11 | Answer-first copy with stats, Passages in the 50-200 word band, Hero subtitle is names-only | Covered |
| LND-14 | Comparison table present, No invented cells | Covered |
| LND-15 | All weight references match v3.1.0, Brand reads octava parte, Rubric and criteria counts untouched, copy.test.ts passes with v3.1.0 | Covered |