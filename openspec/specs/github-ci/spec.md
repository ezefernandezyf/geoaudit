# GitHub CI Specification

## Purpose

Define the continuous integration pipeline that gates pull requests to `develop` and `main`. Every PR must pass linting, type-checking, and test execution before merge.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| R1 | Lint gate | MUST | `eslint` on all TS/TSX files must pass in CI |
| R2 | Typecheck gate | MUST | `tsc --noEmit` must pass in CI |
| R3 | Test gate | MUST | `pnpm test` must pass in CI |
| R4 | PR trigger | MUST | Pipeline must trigger on PRs targeting `develop` or `main` |
| R5 | Fast failure | SHOULD | If lint fails, typecheck and test SHOULD NOT block on its completion before reporting |

### Requirement: Lint Gate (R1)

The CI pipeline MUST run `eslint` and fail the check if any linting violation is detected.

#### Scenario: Lint passes

- GIVEN a clean PR with no lint violations
- WHEN CI executes the lint job
- THEN the job exits with code 0

#### Scenario: Lint fails and blocks PR

- GIVEN a PR introducing a lint violation
- WHEN CI executes the lint job
- THEN the job exits with a non-zero code
- AND the PR status shows as failed

### Requirement: Typecheck Gate (R2)

The CI pipeline MUST run `tsc --noEmit` and fail if any type error exists.

#### Scenario: Typecheck failure blocks merge

- GIVEN a PR with a TypeScript type error
- WHEN CI executes the typecheck job
- THEN the job exits with a non-zero code
- AND the PR cannot be merged

### Requirement: Test Gate (R3)

The CI pipeline MUST execute the full test suite.

#### Scenario: Test failure surfaces in CI

- GIVEN a PR that breaks an existing test
- WHEN CI executes `pnpm test`
- THEN the test job fails with details about the broken assertion

#### Scenario: New test passes in CI

- GIVEN a PR that adds a passing test
- WHEN CI executes `pnpm test`
- THEN the job exits with code 0
- AND the new test appears in the results

### Requirement: PR Trigger (R4)

The pipeline MUST trigger automatically when a PR is opened or updated against `develop` or `main`.

#### Scenario: PR to develop triggers CI

- GIVEN a branch pushed to the remote
- WHEN a PR is opened targeting `develop`
- THEN the CI pipeline starts automatically
- AND marks the PR with a pending or complete check
