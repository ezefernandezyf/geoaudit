# E2E Testing Specification

> **Change**: `sprint-8-polish-testing-backlog` · **Type**: New capability (ADDED)

## Purpose

End-to-end testing with Playwright from scratch: config + `e2e` script + browsers, four critical flows (free audit, signup, Stripe test checkout, PDF download), mobile viewports, and a CI job. Stripe checkout uses test secrets and skips when env vars are absent.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| E2E-1 | Playwright setup | New | MUST | @playwright/test + playwright.config.ts + `e2e` script + browsers installed |
| E2E-2 | Free audit flow | New | MUST | Anonymous URL input → report page renders |
| E2E-3 | Signup flow | New | MUST | GitHub signup → authenticated dashboard |
| E2E-4 | Stripe test checkout | New | MUST | Pro checkout with test secrets; skip-if-no-env |
| E2E-5 | PDF download flow | New | MUST | Report PDF generation/download |
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

### Requirement: Stripe Test Checkout (E2E-4)

When a paid flow is exercised, then the E2E flow MUST drive Stripe test checkout using test secrets, and MUST skip itself (not fail) when those env vars are absent.

#### Scenario: Checkout with test secrets

- GIVEN Stripe test secrets are set
- WHEN a Pro upgrade is initiated
- THEN the Stripe test checkout completes

#### Scenario: Skip when secrets absent

- GIVEN Stripe test secrets are NOT set
- WHEN the checkout spec runs
- THEN it is skipped (skip-if-no-env), not failed

### Requirement: PDF Download Flow (E2E-5)

When a report PDF is requested, then the E2E flow MUST trigger generation and assert the download.

#### Scenario: PDF downloads

- GIVEN a completed audit
- WHEN the user requests the PDF
- THEN the PDF file downloads successfully

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
| E2E-4 | Checkout with test secrets, Skip when secrets absent | Covered |
| E2E-5 | PDF downloads | Covered |
| E2E-6 | Mobile layout exercised | Covered |
| E2E-7 | E2E runs in CI | Covered |
