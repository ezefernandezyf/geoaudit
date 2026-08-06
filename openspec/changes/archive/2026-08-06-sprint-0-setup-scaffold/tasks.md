# Tasks: Sprint 0 — Setup & Scaffold

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~390 authored (range 350–450); scaffold boilerplate + lockfile excluded |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR — infra slices would re-touch the same scaffold; CI verification needs the repo live |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

> Exclusion: `create-next-app` boilerplate and `pnpm-lock.yaml` are generated, not authored, and do not count toward the review budget.

## Phase 1: Foundation & Toolchain

- [x] 1.1 Scaffold: `pnpm create next-app@15.5.22 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"`; pin next `15.5.22` exact in `package.json`
- [x] 1.2 Edit `package.json`: add scripts `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `format`; add `onlyBuiltDependencies`
- [x] 1.3 Edit `tsconfig.json`: `strict: true`, `@/*` alias, include `src/test/`
- [x] 1.4 `pnpm install` + `pnpm approve-builds`; `pnpm dev` boots on :3000 (project-setup R5)
- [x] 1.5 Git: `git init`, initial commit on `main`, create `develop` from `main` (project-setup R4)

## Phase 2: Test Infrastructure

- [x] 2.1 Create `vitest.config.ts`: jsdom, globals, setup file, coverage-v8
- [x] 2.2 Create `src/test/setup.ts`: import `@testing-library/jest-dom/vitest`

## Phase 3: Prisma & Contracts (strict TDD)

- [x] 3.1 Create `prisma/schema.prisma` (empty baseline, postgresql datasource) + `prisma.config.ts`; `pnpx prisma generate` passes (database-connection R4)
- [x] 3.2 RED: `src/lib/contracts/__tests__/url-input.test.ts` — safeParse accepts valid URL, rejects `"not-a-url"`/empty with "Invalid URL format"
- [x] 3.3 GREEN: create `src/lib/contracts/url-input.ts` with Zod 4 schema (design interface)
- [x] 3.4 RED: `src/lib/__tests__/prisma.test.ts` — missing DATABASE_URL throws error mentioning it; `prisma` export is singleton
- [x] 3.5 GREEN: create `src/lib/prisma.ts` — PrismaClient + adapter-pg singleton, env validation (database-connection R2), skip-if-no-env connectivity test (R1/R3)
- [x] 3.6 RED: `src/app/__tests__/page.test.tsx` — render root page, assert heading (project-setup R7)
- [x] 3.7 GREEN: adapt `app/page.tsx` + `app/layout.tsx` (Inter font, metadata) so smoke test passes

## Phase 4: Auth Skeleton (TDD)

- [x] 4.1 Create `.env.example`: AUTH_SECRET, AUTH_GITHUB_ID/SECRET, DATABASE_URL, STRIPE keys (auth-github R4)
- [x] 4.2 RED: `src/lib/__tests__/auth-middleware.test.ts` — unauthenticated `/dashboard` → 307 redirect to sign-in (auth-github R3)
- [x] 4.3 GREEN: create `src/lib/auth.ts` (GitHub provider, no DB adapter), `app/api/auth/[...nextauth]/route.ts` (GET+POST), `middleware.ts` (matcher `/dashboard`), `app/dashboard/page.tsx`
- [x] 4.4 Verify: `GET /api/auth/signin` renders GitHub button; callback POST handled (auth-github R2/R5, manual OAuth)

## Phase 5: CI, Hooks & Config Flip

- [x] 5.1 RED (threat matrix "PR commands"): create `.github/workflows/ci.yml` — `pull_request` on develop/main, jobs lint/typecheck/test gated by `${{ secrets.* }}`; temporary lint violation proves lint job fails check
- [x] 5.2 GREEN: remove violation; push branch, open PR to `develop`; all three jobs green (github-ci R1-R5)
- [x] 5.3 Create `.husky/pre-commit` + `.lintstagedrc`: eslint --fix + prettier --write on staged `*.{ts,tsx}`
- [x] 5.4 Create `docs/stripe-test-setup.md` (manual test-mode guide, no SDK)
- [x] 5.5 Flip `openspec/config.yaml`: `tdd: true`, `strict_tdd: true`, `status: ready`, `coverage.available: true`
