# Auth (GitHub OAuth) Specification

> **Change**: `sprint-0-setup-scaffold` + `sprint-10-free-mode` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

Define the authentication skeleton for GeoAudit using NextAuth v5 with GitHub as the sole OAuth provider during Sprint 0. The setup must be minimal — configuration, a route handler, and middleware — without a user database or session persistence yet.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| R1 | GitHub OAuth provider | MUST | NextAuth must be configured with GitHub as the only provider |
| R2 | Auth route handler | MUST | `GET` and `POST` at `/api/auth/[...nextauth]` must be handled; the sign-in entry resolves to the custom `/login` page |
| R3 | Protected route | MUST | `/dashboard/:path*` must require authentication; unauthenticated requests must redirect to `/login?callbackUrl=` (307) |
| R4 | Configuration safety | MUST | `AUTH_SECRET` and `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET` must be documented in `.env.example` |
| R5 | Sign-in flow | MUST | Clicking "Sign in with GitHub" must complete the OAuth handshake and return the user to the app |
| R6 | Prisma adapter persistence | MUST | GitHub sign-ups/sign-ins persist `User` + `Account` via `@auth/prisma-adapter`; sessions stay stateless (JWT strategy — no `Session` rows) |
| R7 | Custom sign-in/sign-up pages | MUST | `/login` and `/signup` are wired as the sign-in entry points (`pages.signIn`) |

### Requirement: GitHub OAuth Provider (R1)

The system MUST configure NextAuth v5 with GitHub as the only OAuth provider.

#### Scenario: Provider is recognized by NextAuth

- GIVEN `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` are set
- WHEN the auth handler processes a sign-in request
- THEN NextAuth recognizes GitHub as an available provider
- AND the GitHub logo/name appears on the default sign-in page

### Requirement: Auth Route Handler (R2)

The system MUST expose `GET` and `POST` handlers at `/api/auth/[...nextauth]`.

#### Scenario: Sign-in entry point is the custom page

- GIVEN the development server is running
- WHEN a request reaches the sign-in flow
- THEN the custom `/login` page renders with the GitHub button
- AND the default NextAuth sign-in page is not shown

#### Scenario: OAuth callback is handled

- GIVEN a user completes the GitHub OAuth flow
- WHEN GitHub redirects to `/api/auth/callback/github`
- THEN the `POST` handler processes the callback code and state

### Requirement: Protected Route (R3)

The middleware MUST redirect unauthenticated requests to any `/dashboard/:path*` route to the custom `/login` page, preserving the original path as `callbackUrl`.

#### Scenario: Unauthenticated user is redirected

- GIVEN a user without a valid session
- WHEN they navigate to `/dashboard` or any `/dashboard/*` subpath
- THEN they are redirected to `/login?callbackUrl=<original-path>`
- AND the response is a 307 redirect

#### Scenario: Authenticated user accesses dashboard

- GIVEN a user with a valid session
- WHEN they navigate to `/dashboard`
- THEN the dashboard page renders

### Requirement: Configuration Safety (R4)

The system MUST document all required environment variables in `.env.example`.

#### Scenario: Template lists all auth variables

- GIVEN `.env.example` is present
- WHEN a developer reads it
- THEN `AUTH_SECRET` is listed as required
- AND `AUTH_GITHUB_ID` is listed as required
- AND `AUTH_GITHUB_SECRET` is listed as required

### Requirement: Prisma Adapter Persistence (R6)

The system MUST persist GitHub sign-ups and sign-ins via `@auth/prisma-adapter`, creating `User` and `Account` rows while keeping the JWT session strategy. Sessions are stateless: the adapter does NOT write `Session` rows.

#### Scenario: First-time sign-in persists the user

- GIVEN a user signs in with GitHub for the first time
- WHEN the OAuth callback completes
- THEN a `User` row is created
- AND an `Account` row is linked to that user
- AND no `Session` row is written (JWT sessions are stateless)

#### Scenario: Returning sign-in reuses the account

- GIVEN a returning user signs in with the same GitHub account
- WHEN the OAuth callback completes
- THEN no duplicate `User` is created and the existing account is reused

### Requirement: Custom Sign-In/Sign-Up Pages (R7)

The system MUST wire the custom `/login` and `/signup` pages as the sign-in entry points (`pages.signIn`), replacing the default NextAuth sign-in page.

#### Scenario: Sign-in resolves to the custom page

- GIVEN the auth config sets the sign-in page to `/login`
- WHEN NextAuth needs to render a sign-in screen
- THEN it renders the custom `/login` page, not the default