# Delta for Audit Orchestrator

> **Change**: `sprint-13-brand-authority` · **Type**: Delta (MODIFIED)

## Racional

El orquestador incorpora el 6º engine (brand authority), que corre en TODA auditoría (anónimas incluidas) a partir del dominio auditado — no consume el DOM compartido. El contrato gana `brandAuthority` y `scoringModelVersion` pasa a `3.0.0`; la persistencia tolera filas legacy `2.0.0` sin `brandAuthority`. El aislamiento RAO-12 cubre ahora los 6 engines (fallo de API → `emptyBrandResult()`, nunca rompe el audit).

| # | Change | Summary |
|---|--------|---------|
| RAO-3 | MODIFIED | DOM compartido: brand se invoca con el dominio, no con el DOM |
| RAO-10 | MODIFIED | Campos incluyen `brandAuthority`; `scoringModelVersion` "3.0.0" (corrige aserción stale "1.0.0") |
| RAO-12 | MODIFIED | Aislamiento cubre brand: escenario de fallo de API + escenario "all engines" 5→6 |
| RAO-14 | MODIFIED | P99 < 8s con 6 engines + ~2-4 requests de brand |
| RAO-15 | ADDED | Invocación del brand engine + `emptyBrandResult()` |
| RAO-16 | ADDED | Migración de versión de persistencia 2.0.0 → 3.0.0 |

## MODIFIED Requirements

### Requirement: Shared Parsed DOM (RAO-3)

The system MUST parse the page HTML once and share the Cheerio instance across all content engines (citability, schema, E-E-A-T, platform). The brand engine does NOT consume the DOM: it is invoked with the audited URL's domain (RAO-15).
(Previously: the shared-DOM contract listed only the four content engines.)

#### Scenario: DOM shared across engines

- GIVEN a successful page fetch with valid HTML
- WHEN the orchestrator parses the DOM
- THEN exactly one Cheerio `load()` call is made
- AND the same `$` instance is passed to citability, schema, E-E-A-T, and platform engines

### Requirement: Typed AuditResult Output (RAO-10)

The system MUST return the D3-contract shape.

#### Scenario: Complete AuditResult shape

- GIVEN all engines return valid results
- WHEN `runAudit("https://example.com")` completes
- THEN the returned object matches the Zod AuditResult schema
- AND it includes fields: `summary`, `crawlers`, `citability`, `schema`, `platform`, `content`, `brandAuthority`, `scoringModelVersion`, `meta`
- AND `summary.geoScore` is a number 0-100
- AND `scoringModelVersion` is "3.0.0"
(Previously: fields list had no `brandAuthority`; the scenario asserted the stale "1.0.0".)

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

### Requirement: P99 Latency Target (RAO-14)

The system SHOULD complete the audit (fetch + parsing + all 6 engines + composite, including ~2-4 Wikipedia/Wikidata requests) in under 8 seconds on representative hardware.
(Previously: 5 engines.)

#### Scenario: Benchmark on fixture

- GIVEN the representative fixture with realistic brand API latency
- WHEN the audit runs
- THEN wall-clock time is under 8 seconds at p99

## ADDED Requirements

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

The contract MUST accept both `scoringModelVersion` literals "2.0.0" and "3.0.0" on read (legacy persisted rows keep their version); new audits MUST be written as "3.0.0" with a `brandAuthority` section. Reads of legacy 2.0.0 rows without `brandAuthority` MUST NOT fail: consumers MUST treat the section as absent (rendered "No medido"), never fabricated.

#### Scenario: New audit persists v3

- GIVEN a completed v3 audit
- WHEN its result is validated and persisted (dashboard, share, PDF)
- THEN `scoringModelVersion` is "3.0.0"
- AND `brandAuthority` is present
- AND Zod validation accepts the result

#### Scenario: Legacy 2.0.0 row still reads

- GIVEN a persisted 2.0.0 result without `brandAuthority`
- WHEN it is loaded by the dashboard, share page, or PDF route
- THEN validation accepts the "2.0.0" version
- AND no `brandAuthority` is fabricated
- AND presenters render the brand row as "No medido" (APT-11)

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RAO-3 | DOM shared across engines | Covered |
| RAO-10 | Complete AuditResult shape | Covered |
| RAO-12 | Citability throws, Brand API fails, All engines succeed | Covered |
| RAO-14 | Benchmark on fixture | Covered |
| RAO-15 | Runs on every audit, Failure falls back to emptyBrandResult | Covered |
| RAO-16 | New audit persists v3, Legacy 2.0.0 row still reads | Covered |