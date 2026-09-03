# Delta for Audit Orchestrator

> **Change**: `2026-09-01-sprint-15-polish-final` · **Type**: Delta (MODIFIED)

## Racional

`src/audit/index.ts:226` escribe `scoringModelVersion: "2.0.0"` en el branch degradado de URL inválida mientras el engine escribe "3.1.0" desde sprint 14 (RGS-7) — el test de edge cases pinnea "2.0.0" y quedó obsoleto con la calibración. Se alinea el branch degradado a "3.1.0" (co-update `run-audit-edge-cases.test.ts`) y se corrigen las aserciones stale "3.0.0" de RAO-10/RAO-16 para consistencia con RGS-7.

| # | Change | Summary |
|---|--------|---------|
| RAO-10 | MODIFIED | Escenario aserta `scoringModelVersion: "3.1.0"` (stale "3.0.0") |
| RAO-16 | MODIFIED | Nuevos audits escriben "3.1.0" (incluye branch degradado, antes "2.0.0"); union de lectura 2.0.0\|3.0.0\|3.1.0 |

## MODIFIED Requirements

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

### Requirement: Persistence Version Migration (RAO-16)

The contract MUST accept the `scoringModelVersion` literals "2.0.0", "3.0.0", and "3.1.0" on read (legacy persisted rows keep their version); new audits MUST be written as "3.1.0" with a `brandAuthority` section — including the degraded invalid-URL branch (`src/audit/index.ts`), which MUST write "3.1.0" instead of "2.0.0". Reads of legacy 2.0.0 rows without `brandAuthority` MUST NOT fail: consumers MUST treat the section as absent (rendered "No medido"), never fabricated.
(Previously: new audits written as "3.0.0"; the degraded invalid-URL branch wrote "2.0.0".)

#### Scenario: New audit persists v3.1

- GIVEN a completed v3.1 audit
- WHEN its result is validated and persisted (dashboard, share, PDF)
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
- WHEN it is loaded by the dashboard, share page, or PDF route
- THEN validation accepts the "2.0.0" version
- AND no `brandAuthority` is fabricated
- AND presenters render the brand row as "No medido" (APT-11)

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RAO-10 | Complete AuditResult shape | Covered |
| RAO-16 | New audit persists v3.1, Degraded invalid-URL branch writes the current version, Legacy 2.0.0 row still reads | Covered |