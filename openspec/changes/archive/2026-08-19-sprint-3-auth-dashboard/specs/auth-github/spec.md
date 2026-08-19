# Delta for Auth (GitHub OAuth)

## MODIFIED Requirements

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

(Previously: `GET /api/auth/signin` rendered the default NextAuth sign-in page.)

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

(Previously: the matcher was the exact `/dashboard` path and the redirect target was `/api/auth/signin`.)

## ADDED Requirements

### Requirement: Prisma Adapter Persistence (R6)

The system MUST persist GitHub sign-ups and sign-ins via `@auth/prisma-adapter`, creating `User` and `Account` rows while keeping the JWT session strategy. Sessions are stateless: the adapter does NOT write `Session` rows.

#### Scenario: First-time sign-in persists the user

- GIVEN a user signs in with GitHub for the first time
- WHEN the OAuth callback completes
- THEN a `User` row is created with tier `FREE`
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
