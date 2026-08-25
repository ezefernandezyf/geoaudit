# Performance Specification

> **Change**: `sprint-8-polish-testing-backlog` · **Type**: New capability (ADDED)

## Purpose

Performance measurement with Lighthouse targeting 95+ where achievable, with documented deviations where heavy pages (report PDF, multi-page) cannot reach the target.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| PERF-1 | Lighthouse tooling | New | MUST | Lighthouse measurement tooling available (script or documented manual run) |
| PERF-2 | 95+ target | New | SHOULD | Target Lighthouse 95+ on achievable pages |
| PERF-3 | Documented deviations | New | MUST | Where 95+ is not reachable, the deviation MUST be documented |

### Requirement: Lighthouse Tooling (PERF-1)

When performance is measured, then a Lighthouse-based tooling path MUST be available (an npm script or a documented manual command) to measure the main pages.

#### Scenario: Measurement tooling present

- GIVEN the repository
- WHEN a Lighthouse measurement is invoked
- THEN the main pages can be measured and reported

### Requirement: 95+ Target (PERF-2)

When a page is measured, then it SHOULD reach a Lighthouse score of 95 or higher where achievable.

#### Scenario: Achievable page hits 95+

- GIVEN a light page (e.g. landing, pricing)
- WHEN it is measured
- THEN the Lighthouse score SHOULD be ≥95

### Requirement: Documented Deviations (PERF-3)

When a page cannot reach the 95+ target (e.g. report PDF or heavy multi-page views), then the deviation and its reason MUST be documented rather than silently accepted.

#### Scenario: Heavy page deviation documented

- GIVEN a heavy page that cannot reach 95+
- WHEN it is measured
- THEN the score and the reason for the deviation are documented

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| PERF-1 | Measurement tooling present | Covered |
| PERF-2 | Achievable page hits 95+ | Covered |
| PERF-3 | Heavy page deviation documented | Covered |
