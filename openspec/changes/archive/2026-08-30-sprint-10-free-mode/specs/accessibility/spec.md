# Accessibility Delta

> **Change**: `sprint-10-free-mode` · **Type**: Delta (MODIFIED)

## Purpose

Drop the `/pricing` page from the axe coverage scope, since the pricing capability is deleted.

## MODIFIED Requirements

### Requirement: WCAG 2.2 AA on Main Pages (A11Y-2)

When the accessibility suite runs, then it MUST assert WCAG 2.2 AA compliance on the main pages: landing, report, dashboard, and auth.

(Previously: also scanned the `pricing` page.)

#### Scenario: Main pages scanned

- GIVEN the accessibility spec
- WHEN it runs
- THEN each main page is rendered and scanned with axe

### Requirement: Audit Fixes Batch (A11Y-6)

The codebase MUST apply the four one-line accessibility fixes identified by the audit: an `aria-progressbar-name` on the score bar, contrast corrections on affected UI, and `label-content-name-mismatch` fixes on the navbar controls.

(Previously: the label-mismatch fixes also referenced the pricing cards.)

#### Scenario: Progress bar is named

- GIVEN the score bar with `role="progressbar"`
- WHEN axe scans it
- THEN it has an accessible name (no `aria-progressbar-name` violation)

#### Scenario: Contrast and label mismatches resolved

- GIVEN the navbar controls
- WHEN axe scans them
- THEN no contrast violation and no `label-content-name-mismatch` violation remain
