# E-E-A-T Engine Specification (Delta)

> **Change**: `sprint-9-audit-calibration` · **Type**: Delta (MODIFIED)

## Purpose

Soften the authoritativeness rubric with partial credit (option "b") so commercial sites without `sameAs`/authority-domain citations still earn intermediate points instead of a hard floor. Exact thresholds follow the WU-2 calibration decision.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| REE-3 | Authoritativeness score (0-25) | Partial | MUST | Award partial credit for partial authority signals, not binary |

### Requirement: Authoritativeness Score (REE-3)

The system MUST score external source citations to authority domains and author `sameAs` link presence, awarding partial credit for partial signals (e.g., some citations but no `sameAs`, or `sameAs` without authority-domain citations) instead of a hard 0 floor. Exact thresholds follow the WU-2 calibration decision.
(Previously: binary — full credit only with authority-domain citations AND `sameAs`.)

#### Scenario: Partial authority earns intermediate credit

- GIVEN a page with external citations to two non-authority domains and no `sameAs`
- WHEN Authoritativeness is scored
- THEN the page earns intermediate credit (between 0 and full), not the minimum

#### Scenario: Full authority signals

- GIVEN a page with ≥3 authority-domain citations and an author `sameAs` link
- WHEN Authoritativeness is scored
- THEN the score approaches the 25-point cap

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| REE-3 | Partial authority earns intermediate credit, Full authority signals | Covered |
