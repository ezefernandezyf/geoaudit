# App Shell Specification

> **Change**: `sprint-7-ui-fidelity` + `sprint-8-polish-testing-backlog` + `sprint-9-audit-calibration` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

The shared app shell (navbar + footer) restyled to Gemini: active-state nav links, a plan pill, a user chip, and the new logo. The shell is present on all authenticated/landing pages and provides the entry points for profile, terms, privacy, and multi-page. Since Sprint 8, the shell copy (navbar links, user actions, footer text) is neutral Spanish (usted), centralized in `copy.ts`, and free of voseo/tuteo forms (SHL-6).

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| SHL-1 | Active nav states | New | MUST | Navbar MUST highlight the active route |
| SHL-2 | Plan pill | New | MUST | Navbar MUST show the user's plan pill |
| SHL-3 | User chip | New | MUST | Navbar MUST show a user chip with identity/logout |
| SHL-4 | Logo | New | MUST | Navbar MUST render the new logo + wordmark |
| SHL-5 | Footer links | New | MUST | Footer MUST link to terms/privacy |
| SHL-6 | Neutral shell copy | New | MUST | Navbar/footer copy MUST be neutral Spanish (usted), sourced from `copy.ts` |
| SHL-7 | Security headers | New | MUST | Every response MUST send CSP + HSTS (CSP report-only first, then enforced) |

### Requirement: Active Nav States (SHL-1)

When the navbar renders, then it MUST visually mark the link corresponding to the current route.

#### Scenario: Active link highlighted

- GIVEN the user is on `/dashboard`
- WHEN the navbar renders
- THEN the "Dashboard" link is highlighted

### Requirement: Plan Pill (SHL-2)

When an authenticated user is signed in, then the navbar MUST show a plan pill reflecting their tier (`Free`/`Pro`/`Enterprise`).

#### Scenario: Plan pill shown

- GIVEN a PRO user
- WHEN the navbar renders
- THEN a "Pro" plan pill is visible

### Requirement: User Chip (SHL-3)

When an authenticated user is signed in, then the navbar MUST show a user chip with their identity and a logout action.

#### Scenario: User chip with logout

- GIVEN a signed-in user
- WHEN the navbar renders
- THEN the user chip shows identity and a logout control

### Requirement: Logo (SHL-4)

When the navbar renders, then it MUST show the new "G" serif + wave + globe logo with the "GeoAudit" wordmark.

#### Scenario: Logo + wordmark

- GIVEN the navbar
- WHEN it renders
- THEN the new logo and "GeoAudit" wordmark appear

### Requirement: Footer Links (SHL-5)

When the footer renders, then it MUST link to `/terms` and `/privacy` (and other legal/help pages).

#### Scenario: Legal links present

- GIVEN the footer
- WHEN it renders
- THEN `/terms` and `/privacy` are linked

### Requirement: Neutral Shell Copy (SHL-6)

When the app shell renders, then its copy (navbar links, user actions, footer text) MUST be neutral Spanish using "usted", MUST be centralized in `copy.ts`, and MUST NOT contain voseo or tuteo forms.

#### Scenario: Navbar copy is neutral

- GIVEN the navbar
- WHEN its copy is inspected
- THEN no voseo/tuteo forms appear and the strings come from `copy.ts`

### Requirement: Security Headers (SHL-7)

Every app response MUST send a Content-Security-Policy and Strict-Transport-Security header. CSP MUST start in report-only mode (with reporting) and only move to enforcement after assets/inline/third-party resources are verified unbroken.

#### Scenario: CSP + HSTS emitted

- GIVEN any route response
- WHEN the response is inspected
- THEN `Content-Security-Policy` (or `Content-Security-Policy-Report-Only`) and `Strict-Transport-Security` headers are present

#### Scenario: CSP report-only before enforce

- GIVEN CSP is initially rolled out
- WHEN the landing/report routes render
- THEN CSP is report-only until no inline/third-party breakage is observed, then it is enforced

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| SHL-1 | Active link highlighted | Covered |
| SHL-2 | Plan pill shown | Covered |
| SHL-3 | User chip with logout | Covered |
| SHL-4 | Logo + wordmark | Covered |
| SHL-5 | Legal links present | Covered |
| SHL-6 | Navbar copy is neutral | Covered |
| SHL-7 | CSP + HSTS emitted, CSP report-only before enforce | Covered |
