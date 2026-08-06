# Proposal: Sprint 0 — Setup & Scaffold

## Intent

Scaffold GeoAudit from zero: Next.js 15.5 toolchain, Prisma 7 + Supabase, NextAuth v5 GitHub OAuth skeleton, Stripe env keys, CI + quality gates, strict TDD.

## Scope

### In Scope
- `create-next-app@15.5.22`: App Router, TS strict, Tailwind 4, `--src-dir`, `@/*`, pnpm
- Scripts: `dev`, `build`, `lint`, `format`, `typecheck`, `test`
- Prisma 7 + `@prisma/adapter-pg`, `prisma.config.ts`, empty schema, DATABASE_URL
- NextAuth v5 skeleton: GitHub provider, route handler, middleware on `/dashboard`; AUTH + Stripe keys in `.env.example`
- `docs/stripe-test-setup.md` (manual, no SDK)
- GitHub Actions `ci.yml`: lint/typecheck/test on PR to `develop`/`main`
- husky + lint-staged (eslint --fix + prettier on staged TS/TSX)
- Vitest 4 + RTL 16 + jsdom + setup.ts + `page.test.tsx`
- `src/lib/contracts/` — Zod 4 contract
- Git init → `main` → `develop` per AGENTS.md
- Flip `openspec/config.yaml`: `tdd: true`, `strict_tdd: true`, `status: ready`, `coverage.available: true`

### Out of Scope
Domain engines (S1), UI (S2), credentials (S3), Stripe SDK (S4), Playwright (S6). Empty Prisma baseline; migrations start S1/S3.

## Capabilities

### New Capabilities
- `project-setup`: Next.js 15.5.22 scaffold, TS strict, Tailwind 4, pnpm, git develop/main
- `github-ci`: PR CI (lint, typecheck, test)
- `database-connection`: Prisma 7 + Supabase via `@prisma/adapter-pg`, empty baseline
- `auth-github`: NextAuth v5 GitHub OAuth skeleton (config, handler, middleware)

### Modified Capabilities
None.

## Approach

Approach 3 (coherent core, deferred depth). Single pass: scaffold → Prisma/Supabase → NextAuth skeleton → CI → Vitest/RTL → TDD flip. Authored deltas ~300 lines; generated boilerplate excluded.

## Affected Areas

- **Root**: `package.json`, configs, `.env.example`
- **`prisma/`**: empty schema, `prisma.config.ts`
- **`src/lib/prisma.ts`**: PrismaClient + adapter-pg singleton
- **`src/lib/contracts/`**: Zod 4 URL input contract
- **`src/app/`**: layout, page, auth route, middleware
- **`.github/workflows/`**: CI pipeline
- **`.husky/`**: pre-commit hooks
- **`src/test/`**: setup.ts, page.test.tsx
- **`openspec/config.yaml`**: TDD flag flip (modified)

## Risks

| Risk | L. | Mitigation |
|------|-----|------------|
| Scaffold overwrites AGENTS.md | Med | Diff + restore project file |
| Supabase creds unavailable | Med | Skip-if-no-env test; verified S1 |
| pnpm blocks native builds | Med | `onlyBuiltDependencies` in package.json |
| `next-auth@beta` API shift | Low | Pin `5.0.0-beta.32` |

## Rollback Plan

Delete project dir + re-scaffold (zero irreversibility). Revert config.yaml if TDD flip fails. Drop prisma/ + prisma.ts — app works without DB.

## Dependencies

Supabase project + GitHub OAuth app (manual). Node.js ≥20.19. Stripe test account (manual, no code).

## Success Criteria

- `pnpm dev` starts on port 3000
- `pnpm lint && pnpm typecheck && pnpm build` pass
- `pnpm test` passes (≥1 smoke test green)
- Git `develop` branch + first commit
- CI triggerable on PR to `develop`
- Config: `tdd: true`, `strict_tdd: true`, `status: ready`
