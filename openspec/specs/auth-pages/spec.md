# Auth Pages Specification

> **Change**: `sprint-3-auth-dashboard` + `sprint-7-ui-fidelity` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

Custom sign-in and sign-up pages for GeoAudit, built on the design system (`design-foundation`). GitHub is the sole identity provider; both pages present a single "Sign in with GitHub" action and return the user to their intended destination after OAuth. Since Sprint 7, the pages are restyled to Gemini's composition: centered card, signup benefits list, "Continuar con GitHub" copy, and neutral Spanish throughout (removing voseo).

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| ATH-1 | Login page | MUST | `/login` MUST render a custom, design-system page with a GitHub sign-in button |
| ATH-2 | Sign-up page | MUST | `/signup` MUST render a custom page with the same GitHub action |
| ATH-3 | GitHub OAuth action | MUST | The GitHub button MUST initiate the GitHub OAuth handshake |
| ATH-4 | Post-auth redirect | MUST | After successful OAuth the user MUST return to `callbackUrl` (default `/dashboard`) |
| ATH-5 | Auth error state | MUST | A failed or denied OAuth attempt MUST surface an inline error |
| ATH-6 | Centered card | MUST | Both pages MUST render a centered auth card in Gemini style |
| ATH-7 | Signup benefits | MUST | `/signup` MUST list signup benefits |
| ATH-8 | "Continuar con GitHub" copy | MUST | The primary action MUST read "Continuar con GitHub" (neutral) |
| ATH-9 | Neutral copy | MUST | All auth copy MUST be neutral Spanish, no voseo |

### Requirement: Login Page (ATH-1)

The system MUST render a custom `/login` page styled to the design system, with a GitHub sign-in button.

#### Scenario: Unauthenticated user lands on login

- GIVEN a user without a valid session
- WHEN they navigate to `/login`
- THEN the custom login page renders with the GitHub button
- AND the page uses the design system (no default NextAuth styling)

### Requirement: Sign-up Page (ATH-2)

The system MUST render a custom `/signup` page presenting the same GitHub sign-up action.

#### Scenario: New user visits sign-up

- GIVEN a user without a valid session
- WHEN they navigate to `/signup`
- THEN the custom sign-up page renders with the GitHub button
- AND sign-up and login resolve to the same GitHub OAuth flow (account creation is automatic on first sign-in)

### Requirement: GitHub OAuth Action (ATH-3)

The GitHub button on either page MUST initiate the GitHub OAuth handshake.

#### Scenario: Clicking the GitHub button

- GIVEN the login or sign-up page is rendered
- WHEN the user clicks "Sign in with GitHub"
- THEN the GitHub OAuth consent flow begins

### Requirement: Post-auth Redirect (ATH-4)

After successful OAuth the system MUST redirect to `callbackUrl` when present, otherwise to `/dashboard`.

#### Scenario: Redirect to intended page

- GIVEN a user was intercepted on `/dashboard` before sign-in
- WHEN authentication succeeds
- THEN they are redirected to `/dashboard`

#### Scenario: Default redirect

- GIVEN a user completes OAuth with no `callbackUrl`
- WHEN authentication succeeds
- THEN they are redirected to `/dashboard`

### Requirement: Auth Error State (ATH-5)

A failed or denied OAuth attempt MUST render a visible error on the page.

#### Scenario: OAuth denied

- GIVEN the user cancels GitHub consent
- WHEN NextAuth returns to the login page with an error
- THEN the page shows an inline error with `role="alert"`
- AND the GitHub button remains usable

### Requirement: Centered Card (ATH-6)

When the login or signup page renders, then it MUST present a vertically centered card with the Gemini visual language (direct hex, serif heading).

#### Scenario: Card centered

- GIVEN `/login`
- WHEN it renders
- THEN the auth form is centered on the page with Gemini styling

### Requirement: Signup Benefits (ATH-7)

When `/signup` renders, then it MUST list the benefits of signing up (e.g. saved history, share links, multi-page audits).

#### Scenario: Benefits listed

- GIVEN `/signup`
- WHEN it renders
- THEN a benefits list is visible

### Requirement: "Continuar con GitHub" Copy (ATH-8)

When the primary auth action renders, then its label MUST read "Continuar con GitHub" (neutral Spanish), replacing any voseo/English variant.

#### Scenario: Neutral label

- GIVEN the auth button
- WHEN it renders
- THEN the label is "Continuar con GitHub"

### Requirement: Neutral Copy (ATH-9)

When any auth page renders, then its copy MUST be neutral Spanish — no voseo forms anywhere.

#### Scenario: No voseo

- GIVEN the login and signup pages
- WHEN their copy is inspected
- THEN no voseo forms (e.g. "iniciá", "registrate") appear

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| ATH-1 | Unauthenticated user lands on login | Covered |
| ATH-2 | New user visits sign-up | Covered |
| ATH-3 | Clicking the GitHub button | Covered |
| ATH-4 | Redirect to intended page, Default redirect | Covered |
| ATH-5 | OAuth denied | Covered |
| ATH-6 | Card centered | Covered |
| ATH-7 | Benefits listed | Covered |
| ATH-8 | Neutral label | Covered |
| ATH-9 | No voseo | Covered |
