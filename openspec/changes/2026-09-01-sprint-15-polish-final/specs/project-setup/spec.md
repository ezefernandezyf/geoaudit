# Delta for Project Setup

> **Change**: `2026-09-01-sprint-15-polish-final` · **Type**: Delta (MODIFIED)

## Racional

`eslint.config.mjs` ignora `node_modules/**`, `.next/**`, `out/**`, `build/**` y `next-env.d.ts` pero NO `coverage/**`, que existe con artefactos generados (base.css, block-navigation.js, favicon.png, …) — `pnpm lint` los procesa. Se agrega `coverage/**` a los ignores.

| # | Change | Summary |
|---|--------|---------|
| R8 | ADDED | eslint ignora `coverage/**` |

## ADDED Requirements

### Requirement: Lint Ignores Generated Coverage (R8)

The ESLint configuration MUST ignore the generated `coverage/` directory, so `pnpm lint` passes with coverage artifacts present.

#### Scenario: lint passes with coverage artifacts

- GIVEN `coverage/` exists with generated artifacts
- WHEN `pnpm lint` runs
- THEN lint passes without linting coverage files

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| R8 | lint passes with coverage artifacts | Covered |