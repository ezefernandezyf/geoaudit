# Delta for Audit Report UI

> **Change**: `2026-09-01-sprint-15-polish-final` · **Type**: Delta (MODIFIED)

## Racional

`score-hero.tsx` renderiza la barra benchmark con los segmentos en orden excellent→critical de izquierda a derecha (verde a la izquierda, rojo a la derecha): el marker se posiciona sobre la escala 0-100, por lo que un score 85 (Excellent) cae dentro del segmento ROJO — la barra contradice el score. Se invierte el orden a critical→excellent (rojo izq, verde der) sin tocar marker/widths/colores. Además, el score a 3 dígitos (100) desborda el recuadro (`text-6xl/7xl` + `/100` en la misma fila flex sin wrap) y el wrapper `overflow-hidden` lo clipea: se apila `/100` bajo el número. El mismo componente renderiza en report, multi-page y landing — un solo fix cubre todas las superficies.

| # | Change | Summary |
|---|--------|---------|
| ARU-11 | MODIFIED | Benchmark bar orden critical→excellent (rojo izq, verde der); marker/widths/colores intactos |
| ARU-15 | ADDED | Score a 3 dígitos sin clip; `/100` apilado bajo el número, hex AA `#047857` intacto |

## MODIFIED Requirements

### Requirement: Complete ScoreHero + Benchmark (ARU-11)

When the report's hero renders, then it MUST show the full Gemini ScoreHero — big score, band chip, URL, duration — plus a benchmark bar that places the score against the **real** v3.1.0 thresholds (80/65/50/30). The benchmark rows (`BENCHMARK_ROWS`) and segments (`BENCHMARK_SEGMENTS`) in `score-hero.tsx` MUST match `severityForScore` band-for-band: 80-100 Excellent, 65-79 Good, 50-64 Fair, 30-49 Poor, <30 Critical. The segments MUST render left→right in severity order critical → poor → fair → good → excellent (red `#ef4444` left, green `#10b981` right), so the score marker's `left` position (0-100 scale) always lands inside the band it belongs to. This applies to every surface rendering ScoreHero (report, multi-page, landing scorecard).
(Previously: segments rendered left→right excellent → good → fair → poor → critical — green left, red right — contradicting the 0-100 marker scale.)

#### Scenario: Benchmark uses real thresholds

- GIVEN a score of 68
- WHEN the hero renders
- THEN the benchmark positions 68 in the Good band (65-79), not Gemini's bands

#### Scenario: Benchmark rows match severityForScore

- GIVEN any score
- WHEN the hero's benchmark rows/segments and the calculator's band assignment are both rendered
- THEN `BENCHMARK_ROWS`/`BENCHMARK_SEGMENTS` boundaries equal `severityForScore`'s 80/65/50/30 (single source, no drift)

#### Scenario: Segments ordered critical-to-excellent

- GIVEN the ScoreHero benchmark bar renders
- WHEN the segment order is inspected left→right
- THEN the order is critical 30% → poor 20% → fair 15% → good 15% → excellent 20%
- AND the leftmost segment uses `#ef4444` (red) and the rightmost uses `#10b981` (green)
- AND the widths sum to 100% and the marker still positions at `left: score%`

## ADDED Requirements

### Requirement: Unclipped Three-Digit Score (ARU-15)

When the ScoreHero renders a score value of up to 100, then the number and its `/100` indicator MUST both render fully visible inside the score box — never clipped by the wrapper's overflow. The `/100` indicator MAY stack below the number (or the row MAY wrap) to fit 3 digits at `text-6xl`/`text-7xl`; the `/100` MUST keep its AA-contrast hex `#047857`. This applies to report, multi-page, and landing surfaces.

#### Scenario: Score 100 renders unclipped

- GIVEN a report with `totalScore` 100
- WHEN the ScoreHero renders at mobile and sm widths
- THEN the "100" and "/100" are both fully visible (no clipping, no horizontal overflow of the box)

#### Scenario: /100 stacks below the number

- GIVEN a 3-digit score at `text-6xl`/`text-7xl`
- WHEN the score row renders with `/100` stacked under the number
- THEN both elements are visible and the `/100` keeps the hex `#047857`

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| ARU-11 | Benchmark uses real thresholds, Benchmark rows match severityForScore, Segments ordered critical-to-excellent | Covered |
| ARU-15 | Score 100 renders unclipped, /100 stacks below the number | Covered |