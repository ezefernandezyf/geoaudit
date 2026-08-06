# Auth (GitHub OAuth) Specification

## Purpose

Define the authentication skeleton for GeoAudit using NextAuth v5 with GitHub as the sole OAuth provider during Sprint 0. The setup must be minimal — configuration, a route handler, and middleware — without a user database or session persistence yet.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| R1 | GitHub OAuth provider | MUST | NextAuth must be configured with GitHub as the only provider |
| R2 | Auth route handler | MUST | `GET` and `POST` at `/api/auth/[...nextauth]` must be handled |
| R3 | Protected route | MUST | `/dashboard` must require authentication; unauthenticated requests must redirect to sign-in |
| R4 | Configuration safety | MUST | `AUTH_SECRET` and `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET` must be documented in `.env.example` |
| R5 | Sign-in flow | MUST | Clicking "Sign in with GitHub" must complete the OAuth handshake and return the user to the app |

### Requirement: GitHub OAuth Provider (R1)

The system MUST configure NextAuth v5 with GitHub as the only OAuth provider.

#### Scenario: Provider is recognized by NextAuth

- GIVEN `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` are set
- WHEN the auth handler processes a sign-in request
- THEN NextAuth recognizes GitHub as an available provider
- AND the GitHub logo/name appears on the default sign-in page

### Requirement: Auth Route Handler (R2)

The system MUST expose `GET` and `POST` handlers at `/api/auth/[...nextauth]`.

#### Scenario: Sign-in page renders

- GIVEN the development server is running
- WHEN a `GET` request hits `/api/auth/signin`
- THEN the default NextAuth sign-in page renders with the GitHub button

#### Scenario: OAuth callback is handled

- GIVEN a user completes the GitHub OAuth flow
- WHEN GitHub redirects to `/api/auth/callback/github`
- THEN the `POST` handler processes the callback code and state

### Requirement: Protected Route (R3)

The middleware MUST redirect unauthenticated requests to `/dashboard`.

#### Scenario: Unauthenticated user is redirected

- GIVEN a user without a valid session
- WHEN they navigate to `/dashboard`
- THEN they are redirected to the sign-in page
- AND the response is a 307 redirect

#### Scenario: Authenticated user accesses dashboard

- GIVEN a user with a valid session
- WHEN they navigate to `/dashboard`
- THEN the dashboard placeholder page renders

### Requirement: Configuration Safety (R4)

The system MUST document all required environment variables in `.env.example`.

#### Scenario: Template lists all auth variables

- GIVEN `.env.example` is present
- WHEN a developer reads it
- THEN `AUTH_SECRET` is listed as required
- AND `AUTH_GITHUB_ID` is listed as required
- AND `AUTH_GITHUB_SECRET` is listed as required
