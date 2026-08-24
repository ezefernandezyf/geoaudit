# Delta: Audit Report UI

> **Change**: `sprint-7-ui-fidelity` · **Type**: Delta (MODIFIED)

## Purpose

Convert the report page into presenters of the Gemini view model: `<AuditReport>` consumes `toGeminiViewModel(result)` (not `AuditResult` directly), the ScoreHero becomes the complete Gemini hero with a benchmark bar, and the platform matrix renders six platforms in Gemini style. The RSC async behavior (ARU-1..ARU-9: force-dynamic, Suspense skeleton, error boundary, empty state, degraded honesty) is unchanged.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| ARU-10 | Presenter of view model | Partial | MUST | `<AuditReport>` MUST render from `toGeminiViewModel(result)`, not `AuditResult` |
| ARU-11 | Complete ScoreHero + benchmark | New | MUST | ScoreHero MUST render the full Gemini hero including a benchmark bar with real thresholds |
| ARU-12 | Six-platform matrix | Partial | MUST | The platform matrix MUST render six platforms (Claude "No medido") in Gemini style |

### Requirement: Presenter of View Model (ARU-10)

When the report renders, then `<AuditReport>` MUST take the view model produced by `toGeminiViewModel(result)` (or accept the `AuditResult` and run the adapter at the boundary) so every sub-component is a pure presenter with no direct `AuditResult` reads.

#### Scenario: Components consume the view model

- GIVEN an `AuditResult`
- WHEN `<AuditReport>` renders
- THEN its children receive the Gemini view model, not raw engine shapes

### Requirement: Complete ScoreHero + Benchmark (ARU-11)

When the report's hero renders, then it MUST show the full Gemini ScoreHero — big score, band chip, URL, duration — plus a benchmark bar that places the score against the **real** thresholds (90/75/60/40).

#### Scenario: Benchmark uses real thresholds

- GIVEN a score of 68
- WHEN the hero renders
- THEN the benchmark positions 68 in the Fair band (60-74), not Gemini's bands

### Requirement: Six-Platform Matrix (ARU-12)

When the platform matrix renders, then it MUST show the six platforms (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews, Bing Copilot) in Gemini style, with Claude rendered as "No medido" because the engine does not measure it.

#### Scenario: Claude not measured

- GIVEN a result with no Claude `perPlatform` entry
- WHEN the matrix renders
- THEN Claude shows "No medido" while the other five show real readiness values

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| ARU-10 | Components consume the view model | Covered |
| ARU-11 | Benchmark uses real thresholds | Covered |
| ARU-12 | Claude not measured | Covered |
