# Audit Orchestrator Specification

## Purpose

Compose the complete audit pipeline as a pure, testable function: validate the input URL, perform parallel bounded fetches, run all six domain engines over shared parsed inputs, compute the weighted GEO Score, and return a typed `AuditResult` matching the Sprint 3 persistence contract. The orchestrator MUST accept an injectable fetcher so that every engine path can be exercised without network access.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| RAO-1 | URL validation | MUST | Zod-validate the input URL using the shared `src/lib/contracts/url-input.ts` schema |
| RAO-2 | Parallel bounded fetches | MUST | Fetch page HTML + robots.txt in parallel via `Promise.allSettled`; max 3 concurrent fetches |
| RAO-3 | Shared parsed DOM | MUST | Parse the page HTML once via Cheerio and pass the shared DOM to all content engines (citability, schema, E-E-A-T, platform); the brand engine is invoked with the domain, not the DOM |
| RAO-4 | Crawler engine invocation | MUST | Invoke crawler engine with robots.txt body + page HTTP headers |
| RAO-5 | Citability engine invocation | MUST | Invoke citability engine with shared parsed DOM |
| RAO-6 | Schema engine invocation | MUST | Invoke schema engine with shared parsed DOM |
| RAO-7 | E-E-A-T engine invocation | MUST | Invoke E-E-A-T engine with shared parsed DOM + HTTP headers |
| RAO-8 | Platform engine invocation | MUST | Invoke platform engine with page HTTP headers + parsed DOM + probe results |
| RAO-9 | GEO Score computation | MUST | Compute weighted composite from all engine scores via the GEO Score calculator |
| RAO-10 | Typed AuditResult output | MUST | Return fully typed `AuditResult` matching D3 contract shape with all sub-results including `brandAuthority` and `scoringModelVersion: "3.1.0"` |
| RAO-11 | Injectable fetcher | MUST | Accept optional injectable `fetcher` parameter; use native fetch as default |
| RAO-12 | Per-engine failure isolation | MUST | If one engine throws or returns an error, other engines MUST still produce results; the failed engine is noted in `meta.errors` |
| RAO-13 | Non-HTML response handling | MUST | If the page fetch returns "unsupported_content_type", all content engines MUST produce "unsupported" results with shared reason |
| RAO-14 | P99 latency target | SHOULD | Complete audit (fetch + parsing + all 6 engines + composite, including ~2-4 Wikipedia/Wikidata requests) in under 8 seconds on representative hardware |
| RAO-15 | Brand engine invocation | ADDED | MUST | Invoke the brand engine on every audit (authenticated and anonymous) with the audited URL's domain; fall back to `emptyBrandResult()` on failure |
| RAO-16 | Persistence version migration | ADDED | MUST | Accept "2.0.0" \| "3.0.0" \| "3.1.0" on read; write "3.1.0" + `brandAuthority` (incl. degraded invalid-URL branch); legacy rows without `brandAuthority` render "No medido" |

### Requirement: URL Validation (RAO-1)

The system MUST validate the URL input using the existing shared Zod contract.

#### Scenario: Valid https URL accepted

- GIVEN input URL "https://example.com/blog/post"
- WHEN the orchestrator validates the URL
- THEN validation passes
- AND the normalized URL is passed to the fetch layer

#### Scenario: Invalid URL rejected

- GIVEN input URL "not-a-url"
- WHEN the orchestrator validates the URL
- THEN a Zod validation error is returned
- AND no fetch or engine work is started

### Requirement: Parallel Bounded Fetches (RAO-2)

The system MUST fetch page HTML and robots.txt in parallel.

#### Scenario: Both fetches succeed

- GIVEN a valid URL where both page HTML and robots.txt exist
- WHEN the orchestrator executes parallel fetches
- THEN both results are available via Promise.allSettled
- AND page HTML is passed to Cheerio for parsing
- AND robots.txt body is passed to the crawler engine

#### Scenario: robots.txt fetch fails

- GIVEN a valid URL where robots.txt returns 404 or network error
- WHEN parallel fetches execute
- THEN the page HTML result is still available (fulfilled)
- AND the robots.txt result is rejected (404/error)
- AND crawler engine receives missing-robots status (treated as "all allowed")

### Requirement: Shared Parsed DOM (RAO-3)

The system MUST parse the page HTML once and share the Cheerio instance across all content engines (citability, schema, E-E-A-T, platform). The brand engine does NOT consume the DOM: it is invoked with the audited URL's domain (RAO-15).
(Previously: the shared-DOM contract listed only the four content engines.)

#### Scenario: DOM shared across engines

- GIVEN a successful page fetch with valid HTML
- WHEN the orchestrator parses the DOM
- THEN exactly one Cheerio `load()` call is made
- AND the same `$` instance is passed to citability, schema, E-E-A-T, and platform engines

### Requirement: Per-Engine Failure Isolation (RAO-12)

One failing engine MUST NOT prevent other engines from producing results.

#### Scenario: Citability throws, others succeed

- GIVEN page HTML that causes the citability engine to throw (malformed content edge case)
- WHEN the orchestrator runs all engines
- THEN citability result is `{ status: "error", reason: "…" }` (caught)
- AND crawler, schema, E-E-A-T, platform, and brand engines all produce valid results
- AND the GEO Score is computed from the 5 available engines
- AND `meta.errors` includes the citability failure

#### Scenario: Brand API fails, others succeed

- GIVEN the Wikipedia/Wikidata API returns a rate limit or timeout
- WHEN the orchestrator runs all engines
- THEN `brandAuthority` holds the empty error result (`emptyBrandResult()`)
- AND crawler, citability, schema, E-E-A-T, and platform engines all produce valid results
- AND the GEO Score is computed from the 5 available engines (brand excluded, RGS-9)
- AND `meta.errors` includes a `brand:` entry with the reason

#### Scenario: All engines succeed

- GIVEN a well-formed page where all 6 engines complete cleanly
- WHEN the orchestrator runs
- THEN `meta.errors` is an empty array
- AND all sub-results have status "success"

### Requirement: Typed AuditResult Output (RAO-10)

The system MUST return the D3-contract shape.

#### Scenario: Complete AuditResult shape

- GIVEN all engines return valid results
- WHEN `runAudit("https://example.com")` completes
- THEN the returned object matches the Zod AuditResult schema
- AND it includes fields: `summary`, `crawlers`, `citability`, `schema`, `platform`, `content`, `brandAuthority`, `scoringModelVersion`, `meta`
- AND `summary.geoScore` is a number 0-100
- AND `scoringModelVersion` is "3.1.0"
(Previously: the scenario asserted the stale "3.0.0" — the engine has written "3.1.0" since sprint 14, RGS-7.)

### Requirement: Non-HTML Response Handling (RAO-13)

Non-HTML responses MUST propagate gracefully to all content engines.

#### Scenario: PDF page → all content engines unsupported

- GIVEN the page fetch returns `{ body: null, reason: "unsupported_content_type" }` (Content-Type: application/pdf)
- WHEN the orchestrator processes the result
- THEN the HTML parse step is skipped (no Cheerio)
- AND all four content engines (citability, schema, E-E-A-T, platform) return `{ status: "unsupported", reason: "unsupported_content_type" }`
- AND the crawler engine still runs (robots.txt is independent)
- AND the GEO Score excludes the four unsupported engines

### Requirement: Injectable Fetcher (RAO-11)

The orchestrator MUST accept a custom fetcher for test isolation.

#### Scenario: Full audit with mocked fetch

- GIVEN a test injects a mock fetch that returns a static HTML fixture for the page and a static robots.txt
- WHEN `runAudit("https://fixture.test", { fetcher: mockFetcher })` is invoked
- THEN all 6 engines produce deterministic scores from the fixture
- AND the returned AuditResult has known, assertable values
- AND zero real network calls occur

### Requirement: P99 Latency Target (RAO-14)

The system SHOULD complete the audit (fetch + parsing + all 6 engines + composite, including ~2-4 Wikipedia/Wikidata requests) in under 8 seconds on representative hardware.
(Previously: 5 engines.)

#### Scenario: Benchmark on fixture

- GIVEN the representative fixture with realistic brand API latency
- WHEN the audit runs
- THEN wall-clock time is under 8 seconds at p99

### Requirement: Brand Engine Invocation (RAO-15)

The orchestrator MUST invoke the brand engine on every audit — authenticated and anonymous — with the audited URL's domain, MUST map its result into the `brandAuthority` contract field, and MUST pass its score into `computeGeoScore` as the `brand_authority` dimension. On engine failure the orchestrator MUST fall back to `emptyBrandResult()` (zeroed error shape) and record `brand: {reason}` in `meta.errors` (RAO-12).

#### Scenario: Runs on every audit, including anonymous

- GIVEN an anonymous audit (no session) for "https://relevy.app"
- WHEN `runAudit` executes
- THEN the brand engine runs against the domain "relevy.app"
- AND `brandAuthority` is present in the result with status "success"

#### Scenario: Failure falls back to emptyBrandResult

- GIVEN the brand engine throws (network/timeout)
- WHEN `runAudit` runs
- THEN `brandAuthority` holds the empty error result (no throw)
- AND `meta.errors` contains a `brand:` entry
- AND the other 5 engines and the composite succeed

### Requirement: Persistence Version Migration (RAO-16)

The contract MUST accept the `scoringModelVersion` literals "2.0.0", "3.0.0", and "3.1.0" on read (legacy persisted rows keep their version); new audits MUST be written as "3.1.0" with a `brandAuthority` section — including the degraded invalid-URL branch (`src/audit/index.ts`), which MUST write "3.1.0" instead of "2.0.0". Reads of legacy 2.0.0 rows without `brandAuthority` MUST NOT fail: consumers MUST treat the section as absent (rendered "No medido"), never fabricated.
(Previously: new audits written as "3.0.0"; the degraded invalid-URL branch wrote "2.0.0".)

#### Scenario: New audit persists v3.1

- GIVEN a completed v3.1 audit
- WHEN its result is validated and persisted (dashboard, share)
- THEN `scoringModelVersion` is "3.1.0"
- AND `brandAuthority` is present
- AND Zod validation accepts the result

#### Scenario: Degraded invalid-URL branch writes the current version

- GIVEN an audit that follows the degraded invalid-URL path
- WHEN its result is produced
- THEN `scoringModelVersion` is "3.1.0" (not "2.0.0")
- AND the edge-case test co-update asserts "3.1.0"

#### Scenario: Legacy 2.0.0 row still reads

- GIVEN a persisted 2.0.0 result without `brandAuthority`
- WHEN it is loaded by the dashboard or share page
- THEN validation accepts the "2.0.0" version
- AND no `brandAuthority` is fabricated
- AND presenters render the brand row as "No medido" (APT-11)

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RAO-1 | Valid https URL, Invalid URL rejected | Covered |
| RAO-2 | Both fetches succeed, robots.txt fetch fails | Covered |
| RAO-3 | DOM shared across engines | Covered |
| RAO-4 | (tested via RAO-10 complete AuditResult scenario) | Implicit |
| RAO-5 | (tested via RAO-10 complete AuditResult scenario) | Implicit |
| RAO-6 | (tested via RAO-10 complete AuditResult scenario) | Implicit |
| RAO-7 | (tested via RAO-10 complete AuditResult scenario) | Implicit |
| RAO-8 | (tested via RAO-10 complete AuditResult scenario) | Implicit |
| RAO-9 | (tested via RAO-10 complete AuditResult scenario) | Implicit |
| RAO-10 | Complete AuditResult shape | Covered |
| RAO-11 | Full audit with mocked fetch | Covered |
| RAO-12 | Citability throws others succeed, Brand API fails, All engines succeed | Covered |
| RAO-13 | PDF page → all content engines unsupported | Covered |
| RAO-14 | (benchmark fixture — wall-clock assertion on known fixture) | Covered |
| RAO-15 | Runs on every audit, Failure falls back to emptyBrandResult | Covered |
| RAO-16 | New audit persists v3.1, Degraded invalid-URL branch writes the current version, Legacy 2.0.0 row still reads | Covered |
