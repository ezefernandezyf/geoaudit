# Tasks: Sprint 3 — Auth & Dashboard

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1.900–2.350 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 5 chained PRs (U1→U5) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| U1 | DB foundation | PR 1 (base: `feat/sprint-3-auth-dashboard` tracker) | `pnpm run prisma:generate && pnpm test` | `pnpm run prisma:migrate -- --name init` (Supabase real) | additive migration; `prisma migrate reset` / drop tables |
| U2 | Auth upgrade | PR 2 (base: PR 1 branch) | `pnpm test src/lib/__tests__/auth-middleware.test.ts src/app/login` | `pnpm dev` GitHub OAuth smoke | remove adapter → Sprint 0 skeleton |
| U3 | Persistence + tier | PR 3 (base: PR 2 branch) | `pnpm test src/lib/audit src/report/__tests__/audit-runner.test.tsx` | `pnpm dev` sign-in + persist audit | revert `actions.ts` + `audit-runner.tsx` |
| U4 | Dashboard | PR 4 (base: PR 3 branch) | `pnpm test src/dashboard src/app/dashboard` | `pnpm dev` dashboard history | revert page + `src/dashboard/*` |
| U5 | Limiter DB | PR 5 (base: PR 4 branch) | `pnpm test src/lib/rate-limit src/lib/audit` | `pnpm dev` with/without `RATE_LIMIT_ENABLED=false` | one-line `InMemoryStore` default swap |

## Work Unit 1: DB Foundation (PR 1)

- [x] 1.1 Populate `prisma/schema.prisma`: `enum Tier {FREE PRO}` + models `User` (tier @default(FREE)), `Account`, `Session`, `VerificationToken`, `Audit` (result Json, `@@index([userId, createdAt(sort: Desc)])`), `RateLimitEntry` (`@@id([key, windowStart])`, `windowStart BigInt`) + datasource `url = env("DATABASE_URL")`. [R4, R5, R6, TLM-1] — done: `pnpm run prisma:generate` passes, models compile. (Desvío: Prisma 7 eliminó `url` del datasource del schema — la URL vive en `prisma.config.ts` `datasource.url`, con `dotenv/config`.)
- [x] 1.2 Run first migration `pnpm run prisma:migrate -- --name init` against Supabase; commit `prisma/migrations/*/migration.sql`. [R4 scenario "Migration applies cleanly"] — done: migrate applies with zero errors (`pnpm run prisma:migrate -- --name X` pasa el `--` literal en pnpm v11 — usar `pnpm exec prisma migrate dev --name X`).
- [x] 1.3 Install `@auth/prisma-adapter` pinned; verify compat × next-auth 5.0.0-beta.32 × Prisma 7 generator `prisma-client`. [R6, design open question] — done: typecheck passes, adapter types resolve; probe probó `PrismaAdapter(prisma)` sin cast (open question resuelta para U2).
- [x] 1.4 No jsdom/unit tests for the migration itself (infra, verified by generate+migrate) — record in notes.

## Work Unit 2: Auth Upgrade (PR 2)

- [x] 2.1 RED: update `src/lib/__tests__/auth-middleware.test.ts` — expect redirect target `/login`, 307, callbackUrl. [R3 scenario] — done: 3 guard tests (root, subpath+query, autenticado).
- [x] 2.2 Change `src/lib/auth-guard.ts` target `/api/auth/signin` → `/login`. [R3, D7] — done: guard test green (callbackUrl ahora es path+query, alinea R3 `<original-path>`).
- [x] 2.3 Widen `src/middleware.ts` matcher to `["/dashboard/:path*"]`. [R3] — done: subpaths redirect too. (Desvío: matcher DEBE ser literal inline — Next exige análisis estático; un import rompe el matcher y cae a "todas las rutas", verificado empíricamente.)
- [x] 2.4 Add `adapter: PrismaAdapter(prisma)` + `pages: { signIn: "/login" }` to `src/lib/auth.ts`. [R6, R7, D1] — done: typecheck + smoke; NO test asserts Session-write (JWT strategy, design decision). (Desvío: config edge-safe separada en `src/lib/auth.config.ts` — el middleware Edge no puede importar prisma → pg/node:net.)
- [x] 2.5 RED→GREEN: create `src/app/login/page.tsx` + `src/app/signup/page.tsx` (client, `signIn("github", { callbackUrl })`, error `role="alert"`), RTL tests. [ATH-1..ATH-5, R7] — done: 12 tests green (card compartido `src/ui/github-auth-card.tsx` + mapeo puro `src/lib/auth-errors.ts`).
- [x] 2.6 Smoke (NOT unit): real GitHub OAuth handshake — HARD GATE `pnpm dev`. — done parcial: /login y /signup renderizan (200), /dashboard y /dashboard/* redirigen 307 a /login?callbackUrl=, resto 200. Handshake real de GitHub requiere credenciales + browser — pendiente para el orquestador.

## Work Unit 3: Persistence + Tier (PR 3)

- [x] 3.1 RED: `src/lib/audit/__tests__/tier.test.ts` — mock `prisma.audit.count` asserts `createdAt >= now - 30d`. [TLM-2] — done: RED confirmado (módulo inexistente), 7 tests.
- [x] 3.2 Create `src/lib/audit/tier.ts`: `FREE_AUDIT_LIMIT = 3`, `FREE_AUDIT_WINDOW_MS`, `countAuditsInWindow`. [TLM-1, TLM-2] — done: tier tests green. (Desvío: parámetro estructural `AuditCountClient` — `Pick<PrismaClient, "audit">` del design no aceptaba el mock ni el cliente real; tipo mínimo propio `{ audit: { count(args: AuditCountArgs) } }`.)
- [x] 3.3 RED: extend `src/lib/audit/__tests__/actions.test.ts` — 4th audit in window blocked before run. [TLM-3] — done: 4 tests nuevos (bloqueo, conteo, allowed, anónimo sin check).
- [x] 3.4 Add `auth()` + tier pre-check (new `AUDIT_FORM_ERRORS.limitReached` copy, TLM-5 wording) in `src/lib/audit/actions.ts` before redirect. [TLM-3, TLM-5, D3] — done: action tests green. (Además: `callbacks.session` en `auth.config.ts` exponiendo `token.sub` como `session.user.id` — el default de @auth/core NO expone id con JWT strategy, el tier check sería no-op sin esto. Helper puro `exposeUserIdInSession` + 3 tests.)
- [x] 3.5 RED: extend `src/report/__tests__/audit-runner.test.tsx` — authorized persists, over-limit renders limit copy (no persist), anonymous never persists. [TLM-4/5/6, R5, D5] — done: 4 tests nuevos.
- [x] 3.6 In `src/report/audit-runner.tsx`: `auth()` + authoritative `countAuditsInWindow` check + `prisma.audit.create({ ..., result })` after `runAudit`. [TLM-4, D5] — done: runner tests green. (Decisiones: persist best-effort con try/catch — la falla de DB no oculta el reporte; `result` como `Prisma.InputJsonValue` vía cast tipado, el contrato RAO-10 garantiza JSON-serializable; persist fallido se loguea.)
- [x] 3.7 Smoke (NOT unit): real Supabase persist + limit — HARD GATE `pnpm dev`. — done parcial: / 200, /dashboard 307, /api/auth/session 200, /report?url=example.com 200 con reporte completo anónimo SIN persist y SIN estado de límite. Persist real + límite con 3 audits requiere OAuth real — pendiente orquestador.

## Work Unit 4: Dashboard (PR 4)

- [x] 4.1 RED: fixtures + RTL tests for table order (newest→oldest), CSS-only trend bars, empty state, re-audit link. [DSH-1..DSH-4] — done: RED confirmado (3 módulos sin resolver + 7 fallas contra el placeholder); 16 tests finales.
- [x] 4.2 Create `src/dashboard/audit-history-table.tsx`, `score-trend.tsx`, `dashboard-empty-state.tsx` (type `DashboardAudit`; reuse `src/ui/` Card/Button/SeverityBadge). [DSH-1..DSH-4] — done: RTL green (9 tests de componentes).
- [x] 4.3 Rewrite `src/app/dashboard/page.tsx`: RSC reads `auth()` → `prisma.audit.findMany({ userId, orderBy: { createdAt: "desc" } })`, composes components + re-audit `/report?url=`. [DSH-1, DSH-3, DSH-5] — done: renders history, never re-runs audit (7 tests de página; mock de prisma expone solo findMany).
- [x] 4.4 Smoke (NOT unit): real history + trend — HARD GATE `pnpm dev`. — done parcial: `/dashboard` 307 → `/login?callbackUrl=%2Fdashboard`, `/` 200, `/login` 200, `/report` 200, log sin errores. Render real con historial requiere OAuth GitHub + audits persistidos — pendiente orquestador.

## Work Unit 5: Limiter DB (PR 5)

- [x] 5.1 RED: convert `store.test.ts`, `index.test.ts`, `actions.test.ts` to `await` async store calls. [RTL-2 ripple] — done: RED confirmado (17 fallas: contrato async en store, mocks async vs limiter síncrono, check mockeado async vs action síncrona).
- [x] 5.2 Make `RateLimitStore` async (`get`/`increment`/`reset` → Promise) + async `InMemoryStore` wrappers in `src/lib/rate-limit/store.ts`. [RTL-2, design async decision] — done: store tests green (8, incl. test de contrato async).
- [x] 5.3 Create `src/lib/rate-limit/prisma-store.ts`: `PrismaRateLimitStore` with injected `Pick<PrismaClient, "rateLimitEntry">` — `get` findFirst orderBy desc, `increment` atomic UPSERT (BigInt), `reset` deleteMany; tests with mocked client. [RTL-6, R6 "Counter increments atomically"] — done: RED (módulo sin resolver) → GREEN 7/7 mock tests. (Desvío: tipo estructural `RateLimitEntryClient { rateLimitEntry: {...} }` propio — `Pick<PrismaClient, ...>` no acepta mocks ni cliente real, mismo patrón que `AuditCountClient` de U3.)
- [x] 5.4 `src/lib/rate-limit/index.ts`: async `check`/`reset`; env-guarded default (`NODE_ENV === "production"` → PrismaStore, else InMemoryStore); `RATE_LIMIT_ENABLED` kill switch preserved. [RTL-6, RTL-7] — done: index tests green. (Desvío 2: `defaultRateLimiter` const → `getDefaultRateLimiter()` async factory memoizada — el import dinámico de prisma exige factory async; `require` no funciona en el module runner de vitest y quedaría sin verificar.)
- [x] 5.5 Await limiter in `src/lib/audit/actions.ts` (pre-check unchanged). [RTL-6] — done: actions tests green (mock de `getDefaultRateLimiter`).
- [x] 5.6 Smoke (NOT unit): shared counter + kill switch — HARD GATE `pnpm dev`. — done: dev smoke 200/200/200/307 con y sin `RATE_LIMIT_ENABLED=false`; HARD GATE DB real contra Supabase (store temporal, borrado): upsert atómico persiste count 2, nueva window crea fila nueva, reset limpia. 3/3.

## Implementation Order

U1 → U2 → U3 → U4 → U5, one PR each in the feature-branch chain (`feat/sprint-3-auth-dashboard` tracker; PR 2+ base = previous PR branch). U2/U3 depend on U1 (adapter + migration); U4 depends on U3 (Audit rows); U5 depends only on U1 but lands last to isolate the sync→async ripple.

## NOT unit-testable in jsdom (HARD GATE = manual smoke `pnpm dev` against real Supabase)

Real Prisma/migrations, GitHub OAuth flow, actual Audit persistence, real dashboard queries, shared DB limiter counter.