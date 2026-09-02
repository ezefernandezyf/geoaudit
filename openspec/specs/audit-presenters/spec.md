# Audit Presenters Specification

> **Change**: `sprint-7-ui-fidelity` + `sprint-12-dogfood-geo-score` + `sprint-13-brand-authority` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

The pure adapter `toGeminiViewModel(result)` in `src/report/presenters/` that maps a real `AuditResult` into a Gemini-shaped view model consumed by the presentational report components. This is the **single source of truth** for data binding: every report/landing/dashboard component becomes a pure presenter of this view model, never reading `AuditResult` directly. It is pure (no React, no I/O, deterministic) and fully unit-testable. It must be honest: never invent a number that the engine did not measure — derive what exists, otherwise omit or mark "No medido".

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| APT-1 | View model shape | New | MUST | `toGeminiViewModel(result)` returns a Gemini-shaped view model with all fields the components need |
| APT-2 | Score + band normalization | New | MUST | Map `summary.geoScore`→`totalScore`, `severityBand` (Capitalized)→`band` (lowercase); the band always comes from the calculator's real 80/65/50/30 thresholds |
| APT-3 | Domain + title fallback | New | MUST | Derive `domain` from `summary.url`; `title` falls back to the domain when absent |
| APT-4 | Summary template | New | MUST | Build `summary` from real metrics only; never fabricate numbers |
| APT-5 | Duration seconds | New | MUST | Map `summary.durationMs`→`durationSeconds` |
| APT-6 | Category scores (6) | New | MUST | Derive `categoryScores[6]` from the real engines — Datos estructurados uses `schema.score`, Autoridad de marca uses the brand engine score via the shared `rowScore` `brand` case (shared derivation, never a proxy) |
| APT-7 | Findings derivation | New | MUST | Derive `findings[]` from real citability + schema + crawler data |
| APT-8 | Platforms (6) | New | MUST | Derive `platforms[6]` from `perPlatform` + `perBot`; Claude = "No medido" |
| APT-9 | Share token | New | MUST | Pass through `shareToken` when present |
| APT-10 | Data honesty | New | MUST | Omit / "No medido" for any metric without a real source — never invent |
| APT-11 | Brand row honesty | ADDED | MUST | Distinguish a measured 0 ("sin presencia externa") from an absent measurement (legacy → "No medido"); never fall back to `rowScore`'s default 0 |

### Requirement: View Model Shape (APT-1)

When the adapter runs, then it MUST return a single view model object whose fields cover `totalScore`, `band`, `domain`, `title`, `summary`, `durationSeconds`, `categoryScores`, `findings`, `platforms`, and `shareToken`.

#### Scenario: Shape is complete

- GIVEN a valid `AuditResult`
- WHEN `toGeminiViewModel(result)` is called
- THEN the returned object has all ten fields and no other top-level fields

### Requirement: Score + Band Normalization (APT-2)

When mapping the score, then the adapter MUST copy `summary.geoScore` to `totalScore` unchanged and MUST convert the Capitalized `severityBand` to its lowercase equivalent (`Excellent`→`excellent`, `Good`→`good`, `Fair`→`fair`, `Poor`→`poor`, `Critical`→`critical`). The band itself always comes from the calculator's `severityForScore` — the adapter never recomputes thresholds.
(Previously: fixtures asserted the 90/75/60/40 real thresholds.)

#### Scenario: Band lowercased

- GIVEN `summary.geoScore = 92` and `severityBand = "Excellent"`
- WHEN the adapter maps
- THEN `totalScore === 92` and `band === "excellent"`

#### Scenario: Thresholds are the real ones

- GIVEN a score of 74
- WHEN the adapter maps
- THEN `band === "good"` (real v3.1.0 thresholds 80/65/50/30 — never Gemini's 80/65/45/25)

#### Scenario: Band boundaries discriminate from Gemini

- GIVEN a score of 47
- WHEN the adapter maps
- THEN `band === "poor"` (real 30-49 band; Gemini's 80/65/45/25 would map 47 to fair)

### Requirement: Domain + Title Fallback (APT-3)

When mapping the audited URL, then the adapter MUST extract the hostname as `domain`, and MUST set `title` to a real page title when derivable, otherwise fall back to the domain — never an invented title.

#### Scenario: Title falls back to domain

- GIVEN `summary.url = "https://ejemplo.com/blog/post"` and no title is derivable
- WHEN the adapter maps
- THEN `domain === "ejemplo.com"` and `title === "ejemplo.com"`

### Requirement: Summary Template (APT-4)

When building the `summary` string, then the adapter MUST compose it only from real, present metrics (score, band, domain, duration) and MUST NOT interpolate fabricated values like a fake `citationRate` or `impactScore`.

#### Scenario: Summary uses real metrics

- GIVEN an `AuditResult` with `geoScore = 68`, `severityBand = "Fair"`, `durationMs = 5200`
- WHEN the adapter builds `summary`
- THEN the string references 68, fair, and ~5s — and no invented metric

### Requirement: Duration Seconds (APT-5)

When mapping duration, then the adapter MUST convert `summary.durationMs` (ms) to `durationSeconds` (seconds), rounding to a whole number (minimum 1 when non-zero).

#### Scenario: Milliseconds to seconds

- GIVEN `summary.durationMs = 5200`
- WHEN the adapter maps
- THEN `durationSeconds === 5`

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

### Requirement: Findings Derivation (APT-7)

When building `findings[]`, then the adapter MUST derive each finding from real data — citability `top3`/`bottom3`, `schema.issues`, and blocked bots from `crawlers.perBot` — and MUST NOT invent an impact score or a code snippet that has no source. A code snippet is only included when a real source exists (e.g. generated JSON-LD).

#### Scenario: Findings from real sources only

- GIVEN citability `bottom3` and `schema.issues` are populated
- WHEN the adapter maps
- THEN `findings[]` lists those real items, each without a fabricated `impactScore`

### Requirement: Platforms (APT-8)

When building the platform list, then the adapter MUST produce six entries (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews, Bing Copilot) from `platform.perPlatform` (5 ids: aio/chatgpt/perplexity/gemini/copilot) and `crawlers.perBot`; Claude has no `perPlatform` id, so its readiness MUST be "No medido".

#### Scenario: Claude not measured

- GIVEN a result where `perPlatform` lacks a Claude entry
- WHEN the adapter maps
- THEN the Claude entry has `readiness: null` rendered as "No medido", while its access still comes from `perBot["Claude-Web"]`

### Requirement: Share Token (APT-9)

When the view model is built, then the adapter MUST pass through the audit's `shareToken` when present, and `null` otherwise, without inventing one.

#### Scenario: Token passthrough

- GIVEN an audit with `shareToken = "abc-123"`
- WHEN the adapter maps
- THEN `shareToken === "abc-123"`

### Requirement: Data Honesty (APT-10)

When any metric has no real source (`citationRate`, `presenceInPrompts`, `impactScore`, `lastCrawled`, a fake `title` or `summary`), then the adapter MUST omit it or mark it "No medido" — it MUST NOT fabricate a value presented as measured.

#### Scenario: Missing metric is not fabricated

- GIVEN the engine does not measure `citationRate`
- WHEN the adapter maps
- THEN no `citationRate` field appears with a made-up number

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| APT-1 | Shape is complete | Covered |
| APT-2 | Band lowercased, Thresholds are the real ones, Band boundaries discriminate from Gemini | Covered |
| APT-3 | Title falls back to domain | Covered |
| APT-4 | Summary uses real metrics | Covered |
| APT-5 | Milliseconds to seconds | Covered |
| APT-6 | Six real category scores, Derivation is shared across web/PDF/findings | Covered |
| APT-7 | Findings from real sources only | Covered |
| APT-8 | Claude not measured | Covered |
| APT-9 | Token passthrough | Covered |
| APT-10 | Missing metric is not fabricated | Covered |
| APT-11 | Measured zero renders 0, Legacy row without brandAuthority renders No medido | Covered |
