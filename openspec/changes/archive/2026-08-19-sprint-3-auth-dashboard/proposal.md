# Proposal: Sprint 3 — Auth & Dashboard

## Intent

Convert the Sprint 0 GitHub-OAuth skeleton and empty Prisma schema into a real, persisted auth + dashboard experience. Authenticated users get a persistent account (tier FREE/PRO), a 30-day moving-window free limit, an audit history they can re-open without re-running, and a DB-backed shared rate limiter replacing the in-memory one.

## Context

- **Auth today**: `src/lib/auth.ts` = GitHub-only, `session: { strategy: "jwt" }`, **no DB adapter**. Middleware protects only `/dashboard` (exact matcher) → 307 to `/api/auth/signin`.
- **DB today**: `prisma/schema.prisma` is **empty** (zero models); `prisma/migrations/` does not exist. Driver-adapter `@prisma/adapter-pg` (7.9.1) in `src/lib/prisma.ts`; `.env` already has `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GITHUB_ID/SECRET`.
- **Rate limiter**: fixed-window with injectable `RateLimitStore`, `InMemoryStore` default (Sprint 2, spec `rate-limiting` RTL-1..RTL-7). RTL-6 explicitly promises "real limiter with DB in Sprint 3".
- **Dashboard**: placeholder RSC (`src/app/dashboard/page.tsx`) — "Signed in as…".
- **Not installed**: `@auth/prisma-adapter`, bcrypt/argon2, Resend, nodemailer.
- 463 tests green; verify PASS for Sprint 2. Runtime stays Node (SSRF `node:dns`).

## Scope

### In Scope
- Prisma adapter persistence: `User` (tier enum FREE/PRO, default FREE, createdAt), `Account`, `Session`, `VerificationToken`, `Audit`, `RateLimitEntry`; first migration against Supabase.
- GitHub OAuth signup/login via `@auth/prisma-adapter` + JWT session strategy.
- Custom `/login` and `/signup` pages (design system); middleware matcher `/dashboard/:path*` → `/login?callbackUrl=`.
- Persist full `AuditResult` JSON on authenticated audit; dashboard history + CSS-bar score trend + re-audit link + empty state.
- Tier enforcement: free = **3 audits / 30-day moving window**; anonymous audits allowed (IP limiter still protects).
- `PrismaRateLimitStore` as default store (RTL-6), `RATE_LIMIT_ENABLED` kill switch preserved.

### Out of Scope
- Credentials (email+password) provider, forgot/reset password, email sending (bcrypt + Resend) → **separate SDD change**.
- Stripe subscription sync, PRO tier upgrades (Sprint 4).
- Chart libraries, multi-page audits, PDF export, shareable links (Sprint 5+).

## Capabilities

> Contract with sdd-spec. Baseline = `openspec/specs/`.

### New Capabilities
- `user-account`: User/Account/Session/VerificationToken persistence via Prisma adapter; tier enum FREE/PRO; GitHub OAuth signup/login.
- `audit-persistence`: `Audit` model (userId FK cascade, url, geoScore, severityBand, durationMs, `result Json`, createdAt, index `(userId, createdAt desc)`); persist full result post-runAudit; tier limit enforcement (`countAuditsInWindow`).
- `dashboard`: RSC history table (URL/score/date), pure-CSS bar trend, re-audit link, empty state.

### Modified Capabilities
- `auth-github`: **R3** — sign-in target changes `/api/auth/signin` → `/login`; matcher `/dashboard` → `/dashboard/:path*`.
- `database-connection`: **R4** — schema is no longer empty (first migration adds models).
- `rate-limiting`: **RTL-6** — default store becomes DB-backed `PrismaRateLimitStore`. ⚠️ Note: this spec currently lives in `openspec/changes/sprint-2-free-audit-flow/specs/rate-limiting/` (Sprint 2 not yet archived to `openspec/specs/`); archive Sprint 2 **before** spec phase.

## Approach

- **Auth (D1, D7)**: add `@auth/prisma-adapter` to `authConfig`; `pages: { signIn: "/login" }`. Adapter persists User/Account/Session (JWT strategy keeps sessions stateless in serverless).
- **DB**: first `prisma migrate dev` against Supabase; wire datasource url via `prisma.config.ts` if needed; keep driver-adapter PrismaPg runtime model.
- **Tier limit (D2, D4)**: pure `countAuditsInWindow(prisma, userId, now)` — COUNT of `Audit` in 30-day moving window; enforce pre-check in the audit Server Action + authoritative check in report page before persist (TOCTOU accepted).
- **Persistence (D3, D5)**: report page persists `Audit` post-`runAudit` only when session exists; anonymous audits never persist.
- **Dashboard**: RSC reads Audits newest→oldest (no re-run); bars are pure CSS divs (no chart lib).
- **Limiter**: `PrismaRateLimitStore implements RateLimitStore` via atomic UPSERT on `(key, windowStart)`; fixed-window logic unchanged.
- **Slices (5 chained PRs, budget 400 lines each, ~1.9–2.35k lines → ask-on-risk)**: U1 DB foundation → U2 auth upgrade → U3 persistence+tier → U4 dashboard → U5 limiter DB.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **GitHub-only auth now** (signup+login via GitHub button, Prisma adapter). Credentials + forgot password = later change. | Zero new security/email deps; OAuth already works from Sprint 0; keeps sprint focused on dashboard/tier/limiter. Credentials add bcrypt + Resend + high risk (3–4 deps, +1 slice). |
| D2 | **Tier count = 30-day moving window** (from first audit backward), not calendar month. | Predictable per-audit expiry; simpler mental model than calendar boundaries. Dashboard copy MUST communicate "resets 30 days after each audit". |
| D3 | **Anonymous audits allowed** (IP limiter still protects). | Preserves acquisition funnel. Only authenticated users count toward tier and persist history. |
| D4 | **Free = 3 audits / 30-day window** (brief §18 Q3), not §17's 1/month. | §18 Q3 explicitly proposes 3 at signup for a growth loop; 1/month is too restrictive pre-trial. |
| D5 | **Persist full `AuditResult` JSON** on audit. | Dashboard reads history without re-running; `AuditResult` is JSON-serializable (Sprint 1 contract maps 1:1 to Json column). |
| D6 | **Defer `/forgot-password`** route entirely. | Pointless with GitHub-only (no password exists). Returns when credentials land. |
| D7 | **Middleware target = `/login` custom page** (design system), not `/api/auth/signin`. | Owns the sign-in UX per design system; updates `requireDashboardAuth` + its tests. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| First migration: `prisma migrate dev` needs resolvable `DATABASE_URL`; `prisma.config.ts` has no datasource url. | Med | Wire url in `prisma.config.ts`/schema before migrating (U1). |
| `@auth/prisma-adapter` × next-auth 5.0.0-beta.32 × Prisma 7 compat. | Med | Verify versions in U2; generated client must include adapter types. |
| TOCTOU tier-limit race (two concurrent audits pass check). | Low | Accepted; no complex constraint. Authoritative check before persist. |
| DB limiter increment race. | Low | Best-effort documented (RTL-6 semantics already allow). |
| Vitest without real DB. | Med | All DB code injectable/mocked (existing fetcher/now pattern); Supabase smoke via `pnpm dev` = HARD GATE. |
| Sprint 2 not archived → `rate-limiting` spec missing from baseline. | Med | Archive Sprint 2 before spec phase (see Capabilities). |

## Rollback Plan

- Each slice lands as its own PR; revert any PR independently.
- U1 (migration): migrations are additive; `prisma migrate reset` in dev, drop tables in Supabase if needed — no destructive baseline exists yet.
- U5 (limiter): `RATE_LIMIT_ENABLED=false` bypasses the store; revert to `InMemoryStore` is a one-line default swap in `src/lib/rate-limit/index.ts`.
- U2 (auth): removing the adapter returns to the Sprint 0 JWT skeleton; no data migration blocks rollback.

## Success Criteria

- [ ] Signup + login complete via GitHub; `User`/`Account`/`Session` rows persist; tier defaults to FREE.
- [ ] Unauthenticated `/dashboard/*` → 307 to `/login?callbackUrl=` (custom page).
- [ ] Authenticated audit persists full `AuditResult` JSON; dashboard lists history newest→oldest with score trend + empty state.
- [ ] Free user's 4th audit in a 30-day window is blocked with clear copy; anonymous audits still work.
- [ ] `PrismaRateLimitStore` is the default store; `RATE_LIMIT_ENABLED=false` still bypasses.
- [ ] `pnpm test` (Vitest) green; lint + typecheck + build pass; Supabase smoke via `pnpm dev`.
