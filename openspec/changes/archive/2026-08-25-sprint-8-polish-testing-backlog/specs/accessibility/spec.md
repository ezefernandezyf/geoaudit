# Accessibility Specification

> **Change**: `sprint-8-polish-testing-backlog` · **Type**: New capability (ADDED)

## Purpose

Automated accessibility coverage with jest-axe asserting WCAG 2.2 AA on the main pages (landing, report, dashboard, pricing, auth), covering contrast, landmarks, roles, and focus order.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| A11Y-1 | jest-axe integration | New | MUST | jest-axe installed + configured in the test setup |
| A11Y-2 | WCAG 2.2 AA on main pages | New | MUST | axe runs on landing/report/dashboard/pricing/auth pages |
| A11Y-3 | Color contrast | New | MUST | Contrast violations MUST be caught (or documented with justification) |
| A11Y-4 | Landmarks | New | MUST | Main/landmark regions MUST be asserted per page |
| A11Y-5 | Focus management | New | MUST | Visible focus + logical order MUST be asserted |

### Requirement: jest-axe Integration (A11Y-1)

When the test suite runs, then `jest-axe` MUST be installed and wired into the test setup so `axe` assertions are available.

#### Scenario: axe assertions available

- GIVEN the test setup
- WHEN a component test renders
- THEN `toHaveNoViolations()` is available

### Requirement: WCAG 2.2 AA on Main Pages (A11Y-2)

When the accessibility suite runs, then it MUST assert WCAG 2.2 AA compliance on the main pages: landing, report, dashboard, pricing, and auth.

#### Scenario: Main pages scanned

- GIVEN the accessibility spec
- WHEN it runs
- THEN each main page is rendered and scanned with axe

### Requirement: Color Contrast (A11Y-3)

When the accessibility suite runs, then it MUST catch color-contrast violations, and any justified exception MUST be documented rather than silently ignored.

#### Scenario: Contrast violations caught

- GIVEN a component with insufficient contrast
- WHEN axe scans it
- THEN the violation is reported (and any accepted exception is documented)

### Requirement: Landmarks (A11Y-4)

When the accessibility suite runs, then it MUST assert semantic landmarks (`main`, `nav`, `header`, `footer`) on the scanned pages.

#### Scenario: Landmarks present

- GIVEN a scanned page
- WHEN the axe rules run
- THEN the page exposes the expected landmark regions

### Requirement: Focus Management (A11Y-5)

When the accessibility suite runs, then it MUST assert a visible focus indicator and logical tab order on interactive elements.

#### Scenario: Focus visible and ordered

- GIVEN an interactive page
- WHEN the focus rules run
- THEN focus indicators are visible and tab order is logical

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| A11Y-1 | axe assertions available | Covered |
| A11Y-2 | Main pages scanned | Covered |
| A11Y-3 | Contrast violations caught | Covered |
| A11Y-4 | Landmarks present | Covered |
| A11Y-5 | Focus visible and ordered | Covered |
