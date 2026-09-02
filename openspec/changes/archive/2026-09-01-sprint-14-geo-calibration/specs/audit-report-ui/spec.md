# Delta for Audit Report UI

> **Change**: `2026-09-01-sprint-14-geo-calibration` · **Type**: Delta (MODIFIED)

## Racional

`score-hero.tsx` hardcodea las bandas en `BENCHMARK_ROWS` y `BENCHMARK_SEGMENTS` con los umbrales v3 (90/75/60/40). El cambio de bandas a 80/65/50/30 propaga al benchmark del hero: rows y segmentos deben reflejar exactamente los umbrales de `severityForScore` (single source, sin drift).

| # | Change | Summary |
|---|--------|---------|
| ARU-11 | MODIFIED | Benchmark bar con umbrales reales 80/65/50/30 (rows + segments) |

## MODIFIED Requirements

### Requirement: Complete ScoreHero + Benchmark (ARU-11)

When the report's hero renders, then it MUST show the full Gemini ScoreHero — big score, band chip, URL, duration — plus a benchmark bar that places the score against the **real** v3.1.0 thresholds (80/65/50/30). The benchmark rows (`BENCHMARK_ROWS`) and segments (`BENCHMARK_SEGMENTS`) in `score-hero.tsx` MUST match `severityForScore` band-for-band: 80-100 Excellent, 65-79 Good, 50-64 Fair, 30-49 Poor, <30 Critical.
(Previously: 90/75/60/40 thresholds in rows and segments.)

#### Scenario: Benchmark uses real thresholds

- GIVEN a score of 68
- WHEN the hero renders
- THEN the benchmark positions 68 in the Good band (65-79), not Gemini's bands

#### Scenario: Benchmark rows match severityForScore

- GIVEN any score
- WHEN the hero's benchmark rows/segments and the calculator's band assignment are both rendered
- THEN `BENCHMARK_ROWS`/`BENCHMARK_SEGMENTS` boundaries equal `severityForScore`'s 80/65/50/30 (single source, no drift)

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| ARU-11 | Benchmark uses real thresholds, Benchmark rows match severityForScore | Covered |