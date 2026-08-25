# App Shell Specification

> **Change**: `sprint-7-ui-fidelity` · **Type**: New capability (ADDED)

## Purpose

The shared app shell (navbar + footer) restyled to Gemini: active-state nav links, a plan pill, a user chip, and the new logo. The shell is present on all authenticated/landing pages and provides the entry points for profile, terms, privacy, and multi-page.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| SHL-1 | Active nav states | New | MUST | Navbar MUST highlight the active route |
| SHL-2 | Plan pill | New | MUST | Navbar MUST show the user's plan pill |
| SHL-3 | User chip | New | MUST | Navbar MUST show a user chip with identity/logout |
| SHL-4 | Logo | New | MUST | Navbar MUST render the new logo + wordmark |
| SHL-5 | Footer links | New | MUST | Footer MUST link to terms/privacy |

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

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| SHL-1 | Active link highlighted | Covered |
| SHL-2 | Plan pill shown | Covered |
| SHL-3 | User chip with logout | Covered |
| SHL-4 | Logo + wordmark | Covered |
| SHL-5 | Legal links present | Covered |
