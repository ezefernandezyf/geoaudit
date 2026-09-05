# E2E Testing Specification

> **Change**: `sprint-8-polish-testing-backlog` + `sprint-10-free-mode` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

End-to-end testing with Playwright from scratch: config + `e2e` script + browsers, the critical flows (free audit, signup), mobile viewports, and a CI job. Since Sprint 10, the Stripe test checkout flow (E2E-4) is removed with the billing capability; since Sprint 18, the PDF download flow (E2E-5) is removed with the PDF export feature.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| E2E-1 | Playwright setup | New | MUST | @playwright/test + playwright.config.ts + `e2e` script + browsers installed |
| E2E-2 | Free audit flow | New | MUST | Anonymous URL input → report page renders |
| E2E-3 | Signup flow | New | MUST | GitHub signup → authenticated dashboard |
| E2E-6 | Mobile viewports | New | MUST | Tests run at mobile viewports; report/multipage reviewed at mobile |
| E2E-7 | CI E2E job | New | MUST | GitHub Actions job runs the Playwright suite |

### Requirement: Playwright Setup (E2E-1)

When the project is set up, then `@playwright/test` MUST be installed with a `playwright.config.ts`, an `e2e` script, and the browser binaries installed.

#### Scenario: Config + script present

- GIVEN the repository
- WHEN `pnpm e2e` runs
- THEN Playwright launches with the configured browsers

### Requirement: Free Audit Flow (E2E-2)

When an anonymous user uses the free audit, then the E2E flow MUST enter a URL and assert the report page renders.

#### Scenario: Anonymous audit end-to-end

- GIVEN an anonymous visitor on the landing page
- WHEN they submit a valid URL
- THEN the report page renders a score

### Requirement: Signup Flow (E2E-3)

When a new user signs up, then the E2E flow MUST complete GitHub signup and land on the authenticated dashboard.

#### Scenario: Signup lands on dashboard

- GIVEN a GitHub test identity
- WHEN signup completes
- THEN the user is redirected to `/dashboard`

### Requirement: Mobile Viewports (E2E-6)

When the E2E suite runs, then it MUST execute at least the free-audit and report/multipage flows at mobile viewports.

#### Scenario: Mobile layout exercised

- GIVEN a mobile viewport (e.g. 390×844)
- WHEN the report/multipage page renders
- THEN the layout is usable at that width

### Requirement: CI E2E Job (E2E-7)

When a PR is opened, then a GitHub Actions job MUST install browsers and run the Playwright suite.

#### Scenario: E2E runs in CI

- GIVEN a PR to `develop`
- WHEN CI executes
- THEN the E2E job runs the Playwright suite and gates the PR

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| E2E-1 | Config + script present | Covered |
| E2E-2 | Anonymous audit end-to-end | Covered |
| E2E-3 | Signup lands on dashboard | Covered |
| E2E-6 | Mobile layout exercised | Covered |
| E2E-7 | E2E runs in CI | Covered |