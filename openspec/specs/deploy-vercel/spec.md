# Deploy (Vercel) Specification

> **Change**: `sprint-10-free-mode` · **Type**: New capability (ADDED)

## Purpose

Make the Vercel Free (Hobby) deploy work end-to-end on `geoaudit-tau.vercel.app`. The preview previously returned 500 (digest `1768612064`) because `src/lib/prisma.ts` throws on module load when `DATABASE_URL` is absent. This capability configures env vars, runs migrations at build, and verifies the full flow.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| DPV-1 | Env vars configured | MUST | DATABASE_URL + auth secrets + NEXT_PUBLIC_APP_URL set in the Vercel project |
| DPV-2 | Migrations at build | MUST | `prisma migrate deploy` runs during the Vercel build |
| DPV-3 | No-500 on preview | MUST | Landing, login, and audit flow serve without the DATABASE_URL-absent 500 |
| DPV-4 | End-to-end smoke | MUST | Audit + login + PDF verified on the live preview |

### Requirement: Env Vars Configured (DPV-1)

When the app is deployed to Vercel, then the project environment MUST define `DATABASE_URL`, the GitHub OAuth secrets (`AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET`), `AUTH_SECRET`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_APP_URL`.

#### Scenario: Missing DATABASE_URL blocks deploy

- GIVEN `DATABASE_URL` is not set in the Vercel project
- WHEN the preview renders a report/dashboard route that imports `prisma.ts`
- THEN the module throws and the route returns 500 (digest `1768612064`)

#### Scenario: All vars present

- GIVEN all required env vars are set
- WHEN the deploy builds
- THEN `prisma.ts` initializes without throwing

### Requirement: Migrations at Build (DPV-2)

When the Vercel build runs, then it MUST execute `prisma migrate deploy` so the Supabase schema matches the Prisma schema (including the Sprint 10 down-migration).

#### Scenario: Build applies migrations

- GIVEN the Vercel build step
- WHEN the build script runs
- THEN `prisma migrate deploy` applies pending migrations without error

### Requirement: No-500 on Preview (DPV-3)

When a visitor uses `geoaudit-tau.vercel.app`, then the landing, login, and audit flow MUST serve 200 responses with no digest `1768612064` error.

#### Scenario: Preview serves the app

- GIVEN the preview deploy is live
- WHEN a visitor requests the landing page and submits an audit
- THEN no 500 occurs and the report renders

### Requirement: End-to-End Smoke (DPV-4)

When the deploy is verified, then audit + GitHub login + PDF download MUST be exercised end-to-end on the live preview.

#### Scenario: Audit + login + PDF verified

- GIVEN the live preview
- WHEN an audit is run, a user signs in via GitHub, and a PDF is requested
- THEN each step completes without error
