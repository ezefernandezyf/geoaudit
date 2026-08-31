# App Profile Specification

> **Change**: `sprint-7-ui-fidelity` + `sprint-10-free-mode` + `sprint-11-rebrand-polish` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

The `/dashboard/profile` page, styled with the Gemini visual language, showing the authenticated user's account data — name, email, plan, audit usage, and support — read from real `User` rows. It is a read-only account surface. Since Sprint 10, the tier and subscription surfaces are removed: the plan pill shows the single "Free" plan and audit usage is shown against the FREE 10/30-day limit (PRF-5 Manage Subscription removed with the billing capability). Since Sprint 11, the plan pill reads "Plan Free", unified with the navbar pill (PRF-3), and the support entry uses the shared support email constant (PRF-6).

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| PRF-1 | Profile route | New | MUST | `/dashboard/profile` MUST render for an authenticated user |
| PRF-2 | User identity | New | MUST | MUST show the user's name and email from the session |
| PRF-3 | Plan display | New | MUST | MUST show the user's single plan pill reading "Plan Free" (unified with the navbar) |
| PRF-4 | Audit usage | New | MUST | MUST show audit usage against the single FREE limit (10 per 30 days) |
| PRF-6 | Support entry | New | MUST | MUST expose a support entry using the shared support email constant |

### Requirement: Profile Route (PRF-1)

When an authenticated user navigates to `/dashboard/profile`, then the system MUST render the profile page; an unauthenticated request MUST redirect to sign-in.

#### Scenario: Authenticated access

- GIVEN a user with a valid session
- WHEN they navigate to `/dashboard/profile`
- THEN the profile page renders

#### Scenario: Unauthenticated redirect

- GIVEN no valid session
- WHEN `/dashboard/profile` is requested
- THEN the user is redirected to sign-in

### Requirement: User Identity (PRF-2)

When the profile page renders, then it MUST display the user's name and email sourced from the authenticated session/User row.

#### Scenario: Name and email shown

- GIVEN a user with name "Ana" and email "ana@example.com"
- WHEN the profile renders
- THEN both name and email are visible

### Requirement: Plan Display (PRF-3)

When the profile page renders, then it MUST show the user's single plan pill reading "Plan Free", unified with the navbar pill (SHL-2).
(Previously: the pill read "Free"; the profile and navbar strings differed.)

#### Scenario: Unified plan pill

- GIVEN an authenticated user
- WHEN the profile renders
- THEN the plan pill reads "Plan Free" (matching the navbar)

### Requirement: Audit Usage (PRF-4)

When the profile page renders, then it MUST show the user's audits used against the single FREE limit (10 per 30 days).

#### Scenario: Usage against limit

- GIVEN a user who has used 4 audits
- WHEN the profile renders
- THEN it shows "4 / 10" audits used

### Requirement: Support Entry (PRF-6)

When the profile page renders, then it MUST expose a support entry point using the shared support email constant (`ezefernandezyf@gmail.com`).
(Previously: support entry existed; email was not guaranteed to come from the shared constant.)

#### Scenario: Support link uses shared email

- GIVEN the profile page
- WHEN it renders
- THEN the support contact references the shared support email constant

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| PRF-1 | Authenticated access, Unauthenticated redirect | Covered |
| PRF-2 | Name and email shown | Covered |
| PRF-3 | Unified plan pill | Covered |
| PRF-4 | Usage against limit | Covered |
| PRF-6 | Support link uses shared email | Covered |