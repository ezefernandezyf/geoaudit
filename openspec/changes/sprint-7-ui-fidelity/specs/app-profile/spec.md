# App Profile Specification

> **Change**: `sprint-7-ui-fidelity` · **Type**: New capability (ADDED)

## Purpose

The `/dashboard/profile` page, styled with the Gemini visual language, showing the authenticated user's account data — name, email, plan/tier, audit usage, subscription management, and support — all read from real `User` + `Subscription` rows. It is a read-only account surface: subscription changes route through the existing Customer Portal action (no new billing logic).

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| PRF-1 | Profile route | New | MUST | `/dashboard/profile` MUST render for an authenticated user |
| PRF-2 | User identity | New | MUST | MUST show the user's name and email from the session |
| PRF-3 | Plan/tier display | New | MUST | MUST show the user's current tier |
| PRF-4 | Audit usage | New | MUST | MUST show audit usage against the tier limit |
| PRF-5 | Manage subscription | New | MUST | Paid users MUST get a "Gestionar suscripción" portal action |
| PRF-6 | Support entry | New | MUST | MUST expose a support entry point |

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

### Requirement: Plan/Tier Display (PRF-3)

When the profile page renders, then it MUST show the user's current tier (`FREE`, `PRO`, or `ENTERPRISE`) styled in the Gemini plan-pill language.

#### Scenario: Tier visible

- GIVEN a `FREE` user
- WHEN the profile renders
- THEN the plan pill shows "Free"

### Requirement: Audit Usage (PRF-4)

When the profile page renders, then it MUST show the user's audits used against their tier limit (FREE → 3/30d, PRO → 10, ENTERPRISE → 50).

#### Scenario: Usage against limit

- GIVEN a PRO user who has used 4 audits
- WHEN the profile renders
- THEN it shows "4 / 10" audits used

### Requirement: Manage Subscription (PRF-5)

When a paid user views the profile, then it MUST present a "Gestionar suscripción" action that triggers the existing Customer Portal action; a FREE user instead sees an upgrade CTA to `/pricing`.

#### Scenario: Pro user manages

- GIVEN a PRO user
- WHEN the profile renders
- THEN the portal action is available

### Requirement: Support Entry (PRF-6)

When the profile page renders, then it MUST expose a support entry point (link/contact) for account help.

#### Scenario: Support link present

- GIVEN the profile page
- WHEN it renders
- THEN a support link is visible

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| PRF-1 | Authenticated access, Unauthenticated redirect | Covered |
| PRF-2 | Name and email shown | Covered |
| PRF-3 | Tier visible | Covered |
| PRF-4 | Usage against limit | Covered |
| PRF-5 | Pro user manages | Covered |
| PRF-6 | Support link present | Covered |
