# Audit Report UI Specification

> **Change**: `sprint-2-free-audit-flow` + `sprint-7-ui-fidelity` + `sprint-8-polish-testing-backlog` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

`/report?url=` page renders the GEO audit result as an async Server Component (Node runtime, `force-dynamic`). Handles four mandatory states: Loading (Suspense + `loading.tsx` skeleton pulse), Success (MVP report: ScoreHero + DomainScorecard + TopFindings + ReportMeta), Error (`error.tsx` boundary + retry), and Empty (URL absent/invalid → inline form). Maps every `FetchErrorCode` to user-friendly Spanish copy. Renders degraded results honestly with "no disponible" chips. Since Sprint 7, the report page components are presenters of the Gemini view model: `<AuditReport>` consumes `toGeminiViewModel(result)` (not `AuditResult` directly), the ScoreHero becomes the complete Gemini hero with a benchmark bar, and the platform matrix renders six platforms in Gemini style. The RSC async behavior (ARU-1..ARU-9) is unchanged. Since Sprint 8, structured-data issues collapse into ONE finding listing the missing properties (JSON-LD rendered exactly once) and blocked AI bots collapse into ONE "blocked bots" card listing the bots (ARU-13/ARU-14), grouped in `deriveFindings` before emission.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| ARU-1 | Async RSC page with runtime | MUST | `dynamic = "force-dynamic"`, `runtime = "nodejs"` (required for `node:dns` SSRF guard) |
| ARU-2 | URL validation → branch | MUST | `searchParams.url` invalid/null → Empty state; valid → `<Suspense><AuditRunner /></Suspense>` |
| ARU-3 | Suspense + loading skeleton | MUST | `loading.tsx` with pulse animation; `aria-label="Cargando reporte"`, `role="status"`, respects `prefers-reduced-motion` |
| ARU-4 | Error boundary + retry | MUST | `error.tsx` catches errors; friendly message + "Reintentar" button (retries full page) |
| ARU-5 | Empty state | MUST | No/invalid `url` param → inline form (same as landing) + instructions |
| ARU-6 | FetchErrorCode → copy | MUST | `AuditRunner` catch maps each `FetchErrorCode` to Spanish user-facing message |
| ARU-7 | Degraded result rendering | MUST | Engine failures → "no disponible" chips + `meta.errors` shown + honest score |
| ARU-8 | MVP report render | MUST | ScoreHero (score+band+url+duration), DomainScorecard (5 domains, mini-bars, chips), TopFindings (top3/bottom3 citability + schema issues + blocked bots), ReportMeta (errors) |
| ARU-9 | AbortSignal on probes | SHOULD | `probeSite` MUST accept optional `AbortSignal` to prevent hung probes exceeding function timeout |
| ARU-10 | Presenter of view model | MUST | `<AuditReport>` MUST render from `toGeminiViewModel(result)`, not `AuditResult` |
| ARU-11 | Complete ScoreHero + benchmark | MUST | ScoreHero MUST render the full Gemini hero including a benchmark bar whose rows/segments match `severityForScore`'s real 80/65/50/30 thresholds (single source, no drift) |
| ARU-12 | Six-platform matrix | MUST | The platform matrix MUST render six platforms (Claude "No medido") in Gemini style |
| ARU-13 | Structured-data dedup | MUST | Collapse `schema.issues` into ONE finding listing missing properties; JSON-LD shown once |
| ARU-14 | Crawler dedup | MUST | Emit ONE "blocked AI bots" finding with the list of bots |

### ARU-1: Async RSC page with Node runtime

**Rationale**: The SSRF guard uses `node:dns` — Edge runtime lacks DNS resolution. `force-dynamic` prevents static prerendering since the page depends on `searchParams` and async I/O.

#### Scenario: Report page loads with valid URL

- GIVEN a request to `/report?url=https://ejemplo.com`
- WHEN the page renders on the server
- THEN `dynamic = "force-dynamic"` prevents build-time prerendering
- AND `runtime = "nodejs"` is set (SSRF guard requires `node:dns`)
- AND no client-side `fetch` or `useEffect` is used — all data comes from RSC

### ARU-3: Suspense + loading skeleton

**Rationale**: `runAudit` can take 10-60s. The skeleton with pulse is the progress indicator — `runAudit` is atomic (no partial results streamable). A11y: screen readers must know content is loading.

#### Scenario: Audit in progress

- GIVEN `runAudit("https://lento.com")` is executing inside `<Suspense>`
- WHEN the page streams
- THEN `loading.tsx` renders a pulse-animated skeleton matching the report layout
- AND the skeleton has `aria-label="Cargando reporte"` and `role="status"`
- AND pulse animation is disabled when `prefers-reduced-motion: reduce` is active

### ARU-5: Empty state

**Rationale**: Direct navigation to `/report` without `url` or with garbage should not crash nor show a skeleton — it should invite the user to try with the inline form.

#### Scenario: No URL parameter

- GIVEN a request to `/report` with no `url` search param
- WHEN the page renders
- THEN an empty state is shown (no skeleton, no error boundary triggered)
- AND a URL input form identical to the landing form is rendered inline
- AND instructions read "Ingresá una URL para comenzar el análisis"

#### Scenario: Invalid URL in search params

- GIVEN a request to `/report?url=not%20a%20url`
- WHEN the URL is validated server-side
- THEN the empty state is shown with the form inline
- AND the input is pre-filled with the invalid value for user correction

### ARU-6: FetchErrorCode → friendly copy

**Rationale**: Raw error codes (TIMEOUT, DNS_FAILURE) are meaningless to end users. Every code needs a Spanish human-readable message.

#### Scenario: Fetch timeout

- GIVEN `runAudit` throws for a slow site with `FetchErrorCode`: `TIMEOUT`
- WHEN `AuditRunner` catches the error
- THEN the component renders "El sitio tardó demasiado en responder. Verificá que la URL sea correcta."
- AND a "Reintentar" button is displayed

#### Scenario: DNS failure

- GIVEN fetch fails with `DNS_FAILURE`
- WHEN the error is mapped
- THEN the message reads "El dominio no existe o no se puede resolver."

#### Scenario: HTTP error status

- GIVEN fetch fails with `HTTP_STATUS`
- THEN message reads "El sitio respondió con un error. Probá visitarlo directamente."

### ARU-7: Degraded result rendering

**Rationale**: RAO-12 guarantees per-engine isolation — one engine failing does not break the audit. But users must NOT see a clean score when data is missing. Honesty builds trust.

#### Scenario: One engine fails, others succeed

- GIVEN the citability engine fails (RAO-12) while 4 engines succeed
- WHEN `AuditResult` is rendered
- THEN DomainScorecard shows "no disponible" chip in the citability row
- AND ReportMeta displays `meta.errors` with the citability failure reason
- AND GEO Score is computed from 4 available engines only

### ARU-9: AbortSignal on probes

**Rationale**: `platform/probes.ts` fetches `/sitemap.xml` and `/llms.txt` without timeout — a hung host can exceed the Vercel function limit (~60s). AbortSignal bounds the worst-case latency.

#### Scenario: Probe with AbortSignal

- GIVEN `probeSite` is called with `AbortSignal.timeout(5000)`
- WHEN the fetch does not respond within 5 seconds
- THEN the signal fires, the probe returns a controlled error (not a hanging promise)
- AND the platform engine marks that probe as "timeout" rather than treating it as missing

### Requirement: Presenter of View Model (ARU-10)

When the report renders, then `<AuditReport>` MUST take the view model produced by `toGeminiViewModel(result)` (or accept the `AuditResult` and run the adapter at the boundary) so every sub-component is a pure presenter with no direct `AuditResult` reads.

#### Scenario: Components consume the view model

- GIVEN an `AuditResult`
- WHEN `<AuditReport>` renders
- THEN its children receive the Gemini view model, not raw engine shapes

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

### Requirement: Six-Platform Matrix (ARU-12)

When the platform matrix renders, then it MUST show the six platforms (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews, Bing Copilot) in Gemini style, with Claude rendered as "No medido" because the engine does not measure it.

#### Scenario: Claude not measured

- GIVEN a result with no Claude `perPlatform` entry
- WHEN the matrix renders
- THEN Claude shows "No medido" while the other five show real readiness values

### Requirement: Structured-Data Dedup (ARU-13)

When structured-data findings are derived, then the system MUST collapse all `schema.issues` (missing properties) into a single finding titled "datos estructurados" that lists every missing property, and MUST render the page's JSON-LD exactly once rather than once per issue.

#### Scenario: Missing properties grouped into one finding

- GIVEN schema detection reports 4 missing properties on a page
- WHEN `deriveFindings` groups the issues
- THEN one finding lists all 4 missing properties
- AND the JSON-LD code snippet appears exactly once in the report

#### Scenario: No missing properties

- GIVEN schema detection reports no missing properties
- WHEN findings are derived
- THEN no structured-data finding is emitted

### Requirement: Crawler Dedup (ARU-14)

When crawler-access findings are derived, then the system MUST emit a single "blocked AI bots" finding whose content is the list of blocked bots, instead of one finding per blocked bot.

#### Scenario: Blocked bots grouped into one card

- GIVEN the crawler access map reports 3 blocked AI bots
- WHEN `deriveFindings` groups the crawlers
- THEN one finding lists the 3 blocked bots
- AND `TopFindings` renders a single card for it

#### Scenario: No blocked bots

- GIVEN the crawler access map reports no blocked bots
- WHEN findings are derived
- THEN no blocked-bot finding is emitted

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| ARU-1 | Report page loads with valid URL | Covered |
| ARU-2 | (via ARU-5 + ARU-3) | Implicit |
| ARU-3 | Audit in progress | Covered |
| ARU-4 | (via ARU-6 timeout — boundary catches) | Implicit |
| ARU-5 | No URL, Invalid URL in params | Covered |
| ARU-6 | Fetch timeout, DNS failure, HTTP error | Covered |
| ARU-7 | One engine fails others succeed | Covered |
| ARU-8 | (via ARU-3 + ARU-7 scenarios) | Implicit |
| ARU-9 | Probe with AbortSignal | Covered |
| ARU-10 | Components consume the view model | Covered |
| ARU-11 | Benchmark uses real thresholds, Benchmark rows match severityForScore | Covered |
| ARU-12 | Claude not measured | Covered |
| ARU-13 | Missing properties grouped into one finding, No missing properties | Covered |
| ARU-14 | Blocked bots grouped into one card, No blocked bots | Covered |
