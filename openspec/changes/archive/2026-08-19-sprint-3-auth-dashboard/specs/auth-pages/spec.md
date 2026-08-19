# Auth Pages Specification

## Purpose

Custom sign-in and sign-up pages for GeoAudit, built on the design system (`design-foundation`). GitHub is the sole identity provider; both pages present a single "Sign in with GitHub" action and return the user to their intended destination after OAuth.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| ATH-1 | Login page | MUST | `/login` MUST render a custom, design-system page with a GitHub sign-in button |
| ATH-2 | Sign-up page | MUST | `/signup` MUST render a custom page with the same GitHub action |
| ATH-3 | GitHub OAuth action | MUST | The GitHub button MUST initiate the GitHub OAuth handshake |
| ATH-4 | Post-auth redirect | MUST | After successful OAuth the user MUST return to `callbackUrl` (default `/dashboard`) |
| ATH-5 | Auth error state | MUST | A failed or denied OAuth attempt MUST surface an inline error |

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
