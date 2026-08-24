# Audit Presenters Specification

> **Change**: `sprint-7-ui-fidelity` · **Type**: New capability (ADDED)

## Purpose

The pure adapter `toGeminiViewModel(result)` in `src/report/presenters/` that maps a real `AuditResult` into a Gemini-shaped view model consumed by the presentational report components. This is the **single source of truth** for data binding: every report/landing/dashboard component becomes a pure presenter of this view model, never reading `AuditResult` directly. It is pure (no React, no I/O, deterministic) and fully unit-testable. It must be honest: never invent a number that the engine did not measure — derive what exists, otherwise omit or mark "No medido".

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| APT-1 | View model shape | New | MUST | `toGeminiViewModel(result)` returns a Gemini-shaped view model with all fields the components need |
| APT-2 | Score + band normalization | New | MUST | Map `summary.geoScore`→`totalScore`, `severityBand` (Capitalized)→`band` (lowercase) |
| APT-3 | Domain + title fallback | New | MUST | Derive `domain` from `summary.url`; `title` falls back to the domain when absent |
| APT-4 | Summary template | New | MUST | Build `summary` from real metrics only; never fabricate numbers |
| APT-5 | Duration seconds | New | MUST | Map `summary.durationMs`→`durationSeconds` |
| APT-6 | Category scores (5) | New | MUST | Derive `categoryScores[5]` from the real engines (reuse `rowScore` derivation) |
| APT-7 | Findings derivation | New | MUST | Derive `findings[]` from real citability + schema + crawler data |
| APT-8 | Platforms (6) | New | MUST | Derive `platforms[6]` from `perPlatform` + `perBot`; Claude = "No medido" |
| APT-9 | Share token | New | MUST | Pass through `shareToken` when present |
| APT-10 | Data honesty | New | MUST | Omit / "No medido" for any metric without a real source — never invent |

### Requirement: View Model Shape (APT-1)

When the adapter runs, then it MUST return a single view model object whose fields cover `totalScore`, `band`, `domain`, `title`, `summary`, `durationSeconds`, `categoryScores`, `findings`, `platforms`, and `shareToken`.

#### Scenario: Shape is complete

- GIVEN a valid `AuditResult`
- WHEN `toGeminiViewModel(result)` is called
- THEN the returned object has all ten fields and no other top-level fields

### Requirement: Score + Band Normalization (APT-2)

When mapping the score, then the adapter MUST copy `summary.geoScore` to `totalScore` unchanged and MUST convert the Capitalized `severityBand` to its lowercase equivalent (`Excellent`→`excellent`, `Good`→`good`, `Fair`→`fair`, `Poor`→`poor`, `Critical`→`critical`).

#### Scenario: Band lowercased

- GIVEN `summary.geoScore = 92` and `severityBand = "Excellent"`
- WHEN the adapter maps
- THEN `totalScore === 92` and `band === "excellent"`

#### Scenario: Thresholds are the real ones

- GIVEN a score of `74`
- WHEN the adapter maps
- THEN `band === "fair"` (real 90/75/60/40 thresholds — never Gemini's 80/65/45/25)

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

When deriving category scores, then the adapter MUST produce exactly five entries (Acceso de bots, Citabilidad, E-E-A-T, Datos estructurados, Plataforma) using the real engine outputs (`crawlers.compositeScore`, `citability.pageScore`, `content.composite`, `deriveSchemaScore(schema)`, `derivePlatformScore(perPlatform)`), the same derivation as `rowScore`.

#### Scenario: Five real category scores

- GIVEN an `AuditResult` with all five engines present
- WHEN the adapter maps
- THEN `categoryScores` has length 5 and each score equals the corresponding engine value

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
| APT-2 | Band lowercased, Thresholds are the real ones | Covered |
| APT-3 | Title falls back to domain | Covered |
| APT-4 | Summary uses real metrics | Covered |
| APT-5 | Milliseconds to seconds | Covered |
| APT-6 | Five real category scores | Covered |
| APT-7 | Findings from real sources only | Covered |
| APT-8 | Claude not measured | Covered |
| APT-9 | Token passthrough | Covered |
| APT-10 | Missing metric is not fabricated | Covered |
