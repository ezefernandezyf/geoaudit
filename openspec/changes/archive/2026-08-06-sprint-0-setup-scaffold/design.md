# Design: Sprint 0 — Setup & Scaffold

## Technical Approach

Single-pass coherent scaffold: `create-next-app@15.5.22` → dependency injection (Prisma 7, NextAuth v5 beta, Vitest 4) → config wiring (CI, husky, TDD flag). Zero domain code — only infrastructure. App boots with `pnpm dev`, passes `pnpm lint && pnpm typecheck && pnpm build`, and exports a passing smoke test. Maps to proposal approach 3 (coherent core, deferred depth). Specs: project-setup (R1-R7), github-ci (R1-R5), database-connection (R1-R4), auth-github (R1-R5).

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Next.js 15.5.22 exact pin | Reproducible builds vs. delayed patches | **15.5.22 exact** — no `^` or `~`; patch bumps are explicit audit decisions |
| Prisma 7 + `@prisma/adapter-pg` | Lightweight (no engine binary) vs. driver-adapter maturity | **Adapter-pg** — AGENTS.md standard; avoids native binary in CI/Vercel |
| NextAuth v5 `beta.32` pin | Early API vs. deferred credential complexity | **beta.32 exact** — S3 adds credentials; pin avoids drift mid-sprint |
| Vitest 4 + RTL 16 + jsdom | Speed/ESM vs. Jest ecosystem inertia | **Vitest 4** — AGENTS.md target; jest-dom for assertions; coverage-v8 |
| `onlyBuiltDependencies` + `pnpm approve-builds` | Secure (no blind native builds) vs. friction on new deps | **Explicit allowlist** — proposal mitigation for pnpm native-block risk |

## Data Flow

```
create-next-app scaffold
  │
  ├─→ package.json edits (scripts, onlyBuiltDependencies, pin versions)
  ├─→ prisma/ (empty schema, prisma.config.ts, src/lib/prisma.ts singleton)
  ├─→ src/lib/auth.ts + app/api/auth/[...nextauth]/route.ts + middleware.ts
  ├─→ .github/workflows/ci.yml (PR trigger: lint → typecheck → test)
  ├─→ .husky/pre-commit (lint-staged: eslint --fix + prettier on staged TS/TSX)
  ├─→ vitest.config.ts + src/test/setup.ts + src/app/__tests__/page.test.tsx
  ├─→ src/lib/contracts/url-input.ts (Zod 4)
  ├─→ git init → main → develop; first commit on develop
  └─→ openspec/config.yaml (flip tdd/status/coverage)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modify | Post-scaffold edits: `onlyBuiltDependencies`, scripts, pinned deps |
| `tsconfig.json` | Modify | Ensure strict mode, path alias `@/*`, include `src/test/` |
| `prisma/schema.prisma` | Create | Empty baseline (no models); datasource `postgresql` + adapter-pg |
| `prisma.config.ts` | Create | Prisma 7 config entry |
| `src/lib/prisma.ts` | Create | PrismaClient + adapter-pg singleton; graceful-startup wrappers |
| `src/lib/auth.ts` | Create | NextAuth v5 config: GitHub provider, no DB adapter |
| `src/lib/contracts/url-input.ts` | Create | Zod 4 contract: URL input validation |
| `app/api/auth/[...nextauth]/route.ts` | Create | NextAuth v5 route handler (GET + POST) |
| `middleware.ts` | Create | NextAuth middleware: redirect `/dashboard` → sign-in if unauthenticated |
| `app/dashboard/page.tsx` | Create | Placeholder: "Dashboard" heading, auth check via `auth()` |
| `app/layout.tsx` | Modify | Add Inter font, base styles, metadata |
| `.github/workflows/ci.yml` | Create | PR CI: setup-node 24, pnpm, lint, typecheck, test |
| `.husky/pre-commit` | Create | lint-staged: `eslint --fix` + `prettier --write` on `*.{ts,tsx}` |
| `.lintstagedrc` | Create | lint-staged config mapping |
| `vitest.config.ts` | Create | Vitest 4 + jsdom + coverage-v8 + setup file |
| `src/test/setup.ts` | Create | `@testing-library/jest-dom/vitest` import |
| `src/app/__tests__/page.test.tsx` | Create | Smoke test: renders root page |
| `.env.example` | Modify | Add AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, DATABASE_URL, STRIPE keys |
| `docs/stripe-test-setup.md` | Create | Manual Stripe test-mode guide (no SDK) |
| `openspec/config.yaml` | Modify | `tdd: true`, `strict_tdd: true`, `status: ready`, `coverage.available: true` |

## Interfaces / Contracts

```ts
// src/lib/contracts/url-input.ts — Zod 4
import { z } from "zod";
export const urlInputSchema = z.object({
  url: z.string().url("Invalid URL format")
});
export type UrlInput = z.infer<typeof urlInputSchema>;
```

Middleware contract: NextAuth `auth` export from `src/lib/auth.ts`; middleware redirects `config.matcher: ["/dashboard"]` using `auth((req) => { ... })`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | URL contract validation, Prisma singleton init | Vitest + Zod `.parse` / `.safeParse`; mock env vars |
| Integration | Auth middleware redirect, page render | RTL + `next-auth` mock helpers |
| Smoke | Root page renders, `pnpm dev` boots | `page.test.tsx`: render `<Page />` → assert heading |

## Threat Matrix

| Boundary | Applicability | Design response | Planned RED tests |
|---|---|---|---|
| Documentation-like paths | N/A — no .md/.mdx execution; lint-staged targets only .ts/.tsx | — | — |
| Git repository selection | N/A — no `git -C` or relative path construction in app or CI | — | — |
| Commit state | N/A — lint-staged reads staged files but does not construct commits programmatically | — | — |
| Push state | N/A — no push automation; CI triggers on `pull_request` events only | — | — |
| PR commands | Applicable — CI workflow composes PR job commands via `pull_request: [develop, main]` trigger | `ci.yml` runs only lint/typecheck/test; secrets use `${{ secrets.* }}` gate; fork PRs get no secrets by default; any step failure → check failed → merge blocked | 1. `ci.yml` exists at `.github/workflows/ci.yml` with correct triggers; 2. Workflow fails when `pnpm lint` exits non-zero; 3. All three jobs must pass for green check |

## Migration / Rollout

No migration required — greenfield scaffold. Rollback: delete project dir + `git init` again.

## Open Questions

None — all dependencies are explicit pins with documented tradeoffs above.
