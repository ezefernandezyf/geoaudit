# Audit Report UI Specification (Delta)

> **Change**: `sprint-6-ui-redesign` · **Type**: Delta (MODIFIED)

## Purpose

Rewrite the `/report` view against the real `AuditResult` using the new primitives and add a live stage stepper over the 10–60s run. Data contract is unchanged: views read `AuditResult` (`summary.geoScore`/`severityBand`/`durationMs`) and derive score bars from `domain-metrics.ts` (`rowScore`), never from the Gemini mock shape.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| ARU-3 | Suspense + loading skeleton | Partial | MUST | Skeleton + stage stepper over the atomic run |
| ARU-8 | MVP report render | Partial | MUST | Report re-written: ScoreHero + ScoreBar scorecard + platform matrix + findings |
| ARU-10 | Live stage stepper | New | MUST | Stepper shows discrete stages while the audit runs |

### Requirement: Suspense + Loading Skeleton (ARU-3)

When an audit runs inside `<Suspense>`, then the loading state MUST render a pulse skeleton plus a stage stepper, both motion-safe and announced to screen readers.

#### Scenario: Stepper during run

- GIVEN `runAudit` is executing
- WHEN the page streams
- THEN a pulse skeleton renders with `role="status"` and `aria-label="Cargando reporte"`
- AND a stage stepper is visible, and pulse is disabled under `prefers-reduced-motion`

### Requirement: MVP Report Render (ARU-8)

When a result renders, then the report MUST compose ScoreHero, a `ScoreBar` scorecard over the five real domains, the platform matrix, and findings with code — all derived from `AuditResult` via `domain-metrics.ts`.

#### Scenario: Report reads the real result

- GIVEN a full `AuditResult`
- WHEN `AuditReport` renders
- THEN ScoreHero reads `summary`, the five domain bars read `rowScore`, and the matrix reads `perPlatform`/`perBot`
- AND no `categoryScores` or mock `platforms` shape is referenced

### Requirement: Live Stage Stepper (ARU-10)

When the audit runs (10–60s), then the UI MUST show discrete stages (fetch → crawlers → citability → content → schema → platform) that advance as the run progresses.

#### Scenario: Stages progress

- GIVEN a running audit
- WHEN stages complete
- THEN the current stage is highlighted and completed stages are marked
- AND the stepper does not mark a stage finished before its engine returns
