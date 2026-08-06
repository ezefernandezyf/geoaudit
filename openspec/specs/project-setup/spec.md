# Project Setup Specification

## Purpose

Define the baseline scaffold for GeoAudit: a Next.js 15.5 project with TypeScript strict mode, Tailwind CSS 4, pnpm, and a Git branching model aligned with the project's AGENTS.md conventions.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| R1 | Next.js scaffold | MUST | `create-next-app@15.5.22` with App Router, `--src-dir`, `@/*` path alias, and TypeScript strict |
| R2 | Tailwind CSS 4 | MUST | Tailwind CSS 4 configured with the project token palette and no component libraries |
| R3 | pnpm toolchain | MUST | pnpm as sole package manager; `dev`, `build`, `lint`, `format`, `typecheck`, `test` scripts in `package.json` |
| R4 | Git model | MUST | `main` + `develop` branches; initial commit on `main`, then `develop` created; no other branches until sprint-0 is done |
| R5 | Dev server | MUST | `pnpm dev` must serve a smoke-test page on port 3000 |
| R6 | Quality gates | MUST | `pnpm lint`, `pnpm typecheck`, and `pnpm build` must pass with zero errors from a clean scaffold |
| R7 | Test runner | MUST | Vitest configured with at least one smoke test (`page.test.tsx`) that passes |

### Requirement: Next.js Scaffold (R1)

The system MUST be scaffolded with `create-next-app@15.5.22` using the App Router, `--src-dir`, and TypeScript strict mode.

#### Scenario: Scaffold produces a bootable dev server

- GIVEN a freshly scaffolded project
- WHEN `pnpm dev` is invoked
- THEN the Next.js dev server starts on `http://localhost:3000`
- AND the root page renders without errors

#### Scenario: TypeScript strict is enforced

- GIVEN the scaffolded project
- WHEN `pnpm typecheck` is invoked
- THEN it runs `tsc --noEmit` in strict mode
- AND any type error causes a non-zero exit code

### Requirement: Quality Gates (R6)

The system MUST pass lint, typecheck, and build from a clean scaffold.

#### Scenario: Full quality chain passes

- GIVEN the scaffolded project with no code changes
- WHEN `pnpm lint && pnpm typecheck && pnpm build` is invoked
- THEN all three commands exit zero
- AND no warnings or errors are emitted

### Requirement: Git Model (R4)

The system MUST be initialized with `main` and `develop` branches.

#### Scenario: develop is created from main

- GIVEN the repository has been initialized
- WHEN `git branch` is invoked
- THEN both `main` and `develop` branches exist
- AND `main` is the default branch

### Requirement: Test Runner (R7)

The system MUST have a passing smoke test.

#### Scenario: Smoke test verifies the page renders

- GIVEN Vitest + React Testing Library are configured
- WHEN `pnpm test` is invoked
- THEN at least one test passes
- AND it is a render check on the root page
