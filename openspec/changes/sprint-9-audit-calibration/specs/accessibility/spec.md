# Accessibility Specification (Delta)

> **Change**: `sprint-9-audit-calibration` · **Type**: Delta (ADDED)

## Purpose

Apply four one-line accessibility fixes surfaced by the code audit: progress-bar naming, contrast violations, and label/content mismatches across the score bar, pricing cards, and navbar.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| A11Y-6 | Audit fixes batch | New | MUST | Fix aria-progressbar-name, contrast, and label-content-name-mismatch (4 one-line fixes) |

### Requirement: Audit Fixes Batch (A11Y-6)

The codebase MUST apply the four one-line accessibility fixes identified by the audit: an `aria-progressbar-name` on the score bar, contrast corrections on affected UI, and `label-content-name-mismatch` fixes on the navbar/pricing controls.

#### Scenario: Progress bar is named

- GIVEN the score bar with `role="progressbar"`
- WHEN axe scans it
- THEN it has an accessible name (no `aria-progressbar-name` violation)

#### Scenario: Contrast and label mismatches resolved

- GIVEN the pricing cards and navbar controls
- WHEN axe scans them
- THEN no contrast violation and no `label-content-name-mismatch` violation remain

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| A11Y-6 | Progress bar is named, Contrast and label mismatches resolved | Covered |
