# Auth (GitHub OAuth) Delta

> **Change**: `sprint-10-free-mode` · **Type**: Delta (MODIFIED)

## Purpose

Drop the now-removed `User.tier` field from the sign-up persistence contract. The OAuth flow, adapter persistence, and JWT session strategy are unchanged.

## MODIFIED Requirements

### Requirement: Prisma Adapter Persistence (R6)

The system MUST persist GitHub sign-ups and sign-ins via `@auth/prisma-adapter`, creating `User` and `Account` rows while keeping the JWT session strategy. Sessions are stateless: the adapter does NOT write `Session` rows.

(Previously: the first-sign-in scenario asserted the `User` row was created with tier `FREE`, a field that no longer exists.)

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
