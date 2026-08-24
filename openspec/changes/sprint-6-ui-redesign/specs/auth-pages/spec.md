# Auth Pages Specification (Delta)

> **Change**: `sprint-6-ui-redesign` · **Type**: Delta (MODIFIED)

## Purpose

Restyle login/signup while preserving the `GitHubAuthCard` flow, the `callbackUrl` redirect, and the inline error state.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| ATH-1 | Login page | Partial | MUST | Restyled `/login`, still the GitHub card |
| ATH-2 | Sign-up page | Partial | MUST | Restyled `/signup`, still the GitHub card |
| ATH-3 | GitHub OAuth action | Implemented | MUST | Unchanged |
| ATH-4 | Post-auth redirect | Implemented | MUST | Unchanged (callbackUrl → /dashboard) |
| ATH-5 | Auth error state | Implemented | MUST | Unchanged (inline `role=alert`) |

### Requirement: Login Page (ATH-1)

When an unauthenticated user opens `/login`, then the system MUST render a restyled custom page that still uses the `GitHubAuthCard` and its copy.

#### Scenario: Restyled login keeps the GitHub card

- GIVEN a user without a session on `/login`
- WHEN the page renders
- THEN the restyled page renders the same `GitHubAuthCard` with the GitHub sign-in button

### Requirement: Sign-up Page (ATH-2)

When a visitor opens `/signup`, then the system MUST render a restyled custom page using the same GitHub card flow.

#### Scenario: Restyled signup keeps the GitHub card

- GIVEN a visitor on `/signup`
- WHEN the page renders
- THEN the restyled page renders `GitHubAuthCard` and resolves to the same GitHub OAuth flow
