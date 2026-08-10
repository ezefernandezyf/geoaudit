# Exploration: Sprint 0 — Setup & Scaffold (GeoAudit)

> Change: `sprint-0-setup-scaffold` · Phase: explore · Date: 2026-08-05 · Mode: hybrid

## Current State

The repository is **pre-scaffold**: no `.git`, no `package.json`, no application code. It contains only `AGENTS.md`, `geo-saas-brief.md`, `.atl/`, and `openspec/` (created by `sdd-init`). All stack declarations are targets, not installed reality.

Key facts verified against npm registry (2026-08-05) and project docs:

- **Next.js**: `next@latest` is **16.3.0**, but the project contract (AGENTS.md + brief §5 + openspec config) declares **Next.js 15**. Latest 15.x is **15.5.22**; `create-next-app@15.5.22` exists and can be pinned. NextAuth v5 beta peer-depends on `next: ^14 || ^15 || ^16` → Next 15 fully supported.
- **Prisma**: latest is **7.9.1** (major architecture shift from v6): new `prisma-client` generator (TS-only client, custom output path), `prisma.config.ts`, driver adapters (`@prisma/adapter-pg` + `pg`), JS engine, **no native engine binaries** → dramatically less postinstall friction with pnpm. Node engines: `^20.19 || ^22.12 || >=24.0` (local Node v24.16 OK).
- **NextAuth v5**: still **beta** (`5.0.0-beta.32`); stable latest remains v4. Peer deps: `next ^14||^15||^16`, `react ^18.2||^19`. Project already committed to v5.
- **Tooling**: Vitest **4.1.10**, @testing-library/react **16.3.2**, jest-dom **7.0.0**, jsdom **30.0.1**, @vitejs/plugin-react **6.0.5**, @vitest/coverage-v8 **4.1.10**, husky **9.1.7**, lint-staged **17.3.0**, Tailwind **4.3.3**, Stripe **22.4.0**, Zod **4.4.3**, Playwright **1.62.1**, prettier **3.9.6** + prettier-plugin-tailwindcss **0.8.1**.
- **create-next-app** (canary, applies to 15.5): flags `--ts`, `--tailwind`, `--eslint`, `--app`, `--src-dir`, `--import-alias "@/*"`, `--use-pnpm`, `--skip-install`, `--yes`; negations `--no-*` exist. New templates also generate an `AGENTS.md` — **conflict risk** with the project's own AGENTS.md (must verify/preserve the project file).
- **DaisyUI discrepancy**: brief §5 lists "Tailwind CSS 4 + DaisyUI 5" but AGENTS.md (newer, authoritative) explicitly forbids component libraries ("design system propio"). **Resolution: no DaisyUI** — token-based design system.
- **openspec/config.yaml** is pre-configured for strict TDD: `apply.tdd: false`, `testing.strict_tdd: false`, `testing.status: pending-scaffold`, runner `vitest`, `verify.build_command: pnpm run lint && pnpm run typecheck && pnpm run build`. The decision to flip `tdd: true` / `strict_tdd: true` when the Vitest runner exists is approved — the scaffold must land Vitest + RTL and perform the flip as part of the change.

## Affected Areas

Planned files to be **created** by this change (nothing exists yet):

- `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc` — scaffold core + scripts (`dev`, `build`, `lint`, `format`, `typecheck`, `test`)
- `src/app/**` — routing only (layout.tsx, page.tsx) per AGENTS.md; create-next-app `--src-dir` puts app inside `src/`
- `src/lib/contracts/` — first Zod 4 shared contract (URL audit input) to establish the screaming-architecture pattern
- `src/lib/prisma.ts` — PrismaClient singleton with `PrismaPg` driver adapter (Prisma 7 pattern)
- `prisma/schema.prisma` + `prisma.config.ts` — empty baseline schema (no domain models yet)
- `.env` + `.env.example` — DATABASE_URL (Supabase), AUTH_SECRET, AUTH_GITHUB_ID/SECRET, Stripe keys (test)
- `.github/workflows/ci.yml` — lint + typecheck + test on PR/push
- `.husky/pre-commit` + lint-staged config — quality gate
- `vitest.config.ts` + `src/test/setup.ts` + `src/app/page.test.tsx` smoke test
- `openspec/config.yaml` — flip `tdd` / `strict_tdd` / `status` after Vitest runner lands
- `.gitignore` (generated), git init with `develop` + `main` per AGENTS.md workflow

Deliberately **not** in Sprint 0: domain engines (Sprint 1), UI/STYLE-BRIEF (Sprint 2), auth pages + middleware protection of real routes + credentials provider (Sprint 3), Stripe SDK code + checkout/webhooks (Sprint 4), Playwright E2E suite (Sprint 6).

## Approaches

### 1. Full-scope Sprint 0 (literal brief §17) — install everything, configure everything
Scaffold Next 15 + Prisma 7 + Supabase connection + NextAuth v5 (GitHub OAuth + credentials) + Stripe test products/prices + GH Actions + husky/lint-staged, all in one change.

- Pros: matches brief §17 checklist literally; one change covers setup; early validation of every integration.
- Cons: credentials provider has **no user table yet** (User model arrives in Sprint 3) — cannot be wired end-to-end; Stripe products/prices are a **manual dashboard action**, not code; enormous change (blows the 400-line review budget badly); violates "cero sobreingeniería"; Prisma with zero domain models is a hollow setup.
- Effort: **High**

### 2. Minimal scaffold only — Next 15 + tooling + CI, defer everything else
Only `create-next-app` + pnpm scripts + git init + GH Actions + husky/lint-staged + Vitest/RTL + config flip.

- Pros: smallest possible change, clean review; everything testable in one session; zero integration risk.
- Cons: ignores brief §17 explicit Sprint-0 items (Prisma/Supabase, NextAuth, Stripe); config.yaml context already declares Prisma/NextAuth/Stripe as "declared target, scaffold pending" — leaving them out makes Sprint 0 incomplete vs. project docs; user loses early validation of the most brittle integrations (DB connection, OAuth app).
- Effort: **Low-Medium**

### 3. Coherent core + deferred depth (RECOMMENDED) — scaffold + DB plumbing + auth skeleton + quality gates
Scaffold Next 15.5 (App Router, TS strict, Tailwind 4, ESLint, Prettier, `--src-dir`, alias `@/*`, pnpm). Git init (`develop`/`main`). Prisma 7 + Supabase connection with **empty schema** (connection smoke-tested, no domain models). NextAuth v5 skeleton: `auth.ts` config + GitHub OAuth provider wired with env keys + `[...nextauth]/route.ts` handler + middleware protecting a placeholder `/dashboard` shell — **no credentials provider, no auth UI** (those need the User model in Sprint 3). Stripe: **only** `.env.example` keys + documented manual checklist for test-mode products/prices (no SDK code — Sprint 4). GH Actions (lint+typecheck+test). husky + lint-staged. Vitest + RTL + first smoke test, then flip `tdd`/`strict_tdd` in config.yaml.

- Pros: honors brief §17 intent while keeping each integration at its *coherent minimum*; validates the three brittle things early (Supabase connectivity, GitHub OAuth app, pnpm/Next toolchain); respects AGENTS.md (no DaisyUI, no component libs, screaming-architecture dirs start now); reviewable (~300-400 lines); strict TDD lands with a working runner.
- Cons: auth/Stripe are "skeletons", not features — needs explicit scope wording so it isn't mistaken for Sprint 3/4 work; Prisma empty schema means `prisma migrate` produces an empty baseline (acceptable; domain migrations come per-sprint).
- Effort: **Medium**

### Sub-decision A — Next 15 vs 16
- Pin `create-next-app@15.5.22` (contract compliance, NextAuth v5 peers verified, ecosystem proven) vs. adopt `next@16.3.0` (current latest, but contradicts AGENTS.md/brief/config and adds migration risk).
- **Recommendation: Next 15.5.22** — project contract explicitly declares 15; no product reason to upgrade in Sprint 0. Note to user: 16 is out; revisit deliberately later, not in setup.

### Sub-decision B — Prisma 7 vs Prisma 6
- Prisma 7 is current (7.9.1) and *simpler for this project*: no engine binaries (solves the `pnpm approve-builds` friction the old stack notes), TS-native client, adapter-pg fits Supabase. Node 24 OK.
- **Recommendation: Prisma 7** with `prisma-client` generator + `@prisma/adapter-pg`. The AGENTS.md note about `pnpm approve-builds` remains relevant for other postinstall deps (e.g. `@tailwindcss/oxide` / `esbuild`-adjacent native bits), not for Prisma itself.

### Sub-decision C — TDD flip timing
- Flip `apply.tdd: true` / `testing.strict_tdd: true` / `status: ready` **within this change**, as the final task after the smoke test is green. Red-green-refactor then governs every later change.
- **Recommendation: yes, in-change, as last apply task + verified by `pnpm test` passing.**

## Recommendation

**Approach 3** — coherent core, deferred depth — with these concrete decisions:

1. `pnpm create next-app@15.5.22 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm` (verify it doesn't overwrite the project AGENTS.md; preserve it if the template writes one).
2. Add scripts: `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `format` (`prettier --write .`).
3. Prisma 7: `prisma init` style setup → `prisma.config.ts` + `@prisma/adapter-pg` singleton in `src/lib/prisma.ts`, empty `schema.prisma`, `.env` with Supabase `DATABASE_URL`. Connection smoke test in Vitest (skip-if-no-env).
4. NextAuth v5: `next-auth@5.0.0-beta.32`, `auth.ts` with GitHub provider, `AUTH_SECRET` generated, `app/api/auth/[...nextauth]/route.ts`, middleware guarding `/dashboard` placeholder. No credentials provider, no login UI (Sprint 3).
5. Stripe: keys in `.env.example` only + `docs/stripe-test-setup.md` checklist (manual: create Free/Pro/Enterprise products + prices in Stripe test dashboard). No `stripe` SDK dependency yet.
6. Git: `git init` → rename to `main` → `git checkout -b develop` (integration branch per AGENTS.md). First commit on `develop`.
7. GH Actions `ci.yml`: setup-node 24 + pnpm/action-setup, `pnpm install --frozen-lockfile`, `pnpm run lint`, `pnpm run typecheck`, `pnpm test`; runs on PR to `develop` and `main`.
8. husky 9 (`pnpm dlx husky init`) + lint-staged (eslint --fix + prettier --write on staged TS/TSX).
9. Vitest 4 + @testing-library/react 16 + jest-dom 7 + jsdom + @vitejs/plugin-react + coverage-v8; `src/test/setup.ts`; one smoke test (`src/app/page.test.tsx`).
10. Final task: flip `openspec/config.yaml` → `tdd: true`, `strict_tdd: true`, `status: ready`, `coverage.available: true`. Verify with `pnpm test` + manual `pnpm dev` smoke (AGENTS.md HARD GATE).

## Risks

- **create-next-app overwrites/generates AGENTS.md** — template now ships its own AGENTS.md; must diff and preserve the project file. Medium.
- **Next 15.5.22 vs `next@latest` 16.3.0 drift** — pinning 15 means `pnpm add next@15` style care; accidental `latest` installs pull 16. Use exact-version deps. Low-Medium.
- **Supabase credentials not available at scaffold time** — connection smoke test needs a real DATABASE_URL; if the user hasn't created the Supabase project, that test is skipped and the wiring is unverified until Sprint 1. Medium (process, not code).
- **next-auth v5 still beta** — API surface may shift between beta versions; acceptable (already a project decision), pin exact version. Low.
- **pnpm 10/11 blocks postinstall scripts by default** — some deps (native binaries like `@tailwindcss/oxide`) need `pnpm approve-builds` or `pnpm.onlyBuiltDependencies` in package.json; CI install may warn/fail on ignored build scripts. Medium.
- **Review budget 400 lines** — scaffold changes are notoriously large (generated configs). Mitigation: exclude generated boilerplate (create-next-app output, lockfile) from authored count; the *authored* delta (prisma/auth/ci/vitest/config edits) stays well under 400.
- **No domain models means `prisma migrate` is empty** — acceptable, but the proposal/spec must state the empty-baseline decision explicitly so Sprint 3 migration is expected.

## Ready for Proposal

**Yes.** The exploration has enough evidence: verified current versions, resolved the DaisyUI conflict (no DaisyUI), resolved the Next 15/16 question (pin 15.5.22 per contract), defined a coherent scope with deferral boundaries per sprint, and confirmed the TDD flip lands inside this change.

What the orchestrator should tell the user before propose:
1. Next.js latest is now 16.x — the project contract says 15; we recommend pinning 15.5.22 (compatible with NextAuth v5). Confirm no desire to move to 16.
2. DaisyUI from the brief §5 is dropped per AGENTS.md (design system propio) — confirm.
3. Sprint 0 will contain auth/Stripe **skeletons only** (GitHub OAuth wiring + env keys + manual Stripe checklist); full credentials auth and Stripe code land in Sprint 3/4. Confirm that matches expectations.
4. A Supabase project + GitHub OAuth app need to be created by the user for the connection/auth parts to be fully verified (non-blocking for the rest of the scaffold).
