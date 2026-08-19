# Design: Sprint 3 — Auth & Dashboard

## Technical Approach

Add a real persistence layer under the Sprint 0 GitHub-OAuth skeleton: `@auth/prisma-adapter` persists `User`/`Account` on GitHub sign-in (JWT strategy keeps sessions stateless), `Audit` rows persist full `AuditResult` JSON for authenticated users, a 30-day moving-window tier limits FREE to 3 audits, and a DB-backed `RateLimitStore` replaces the per-instance in-memory one. Five chained slices (U1→U5), strict TDD (config `apply.tdd: true`), runtime stays Node (SSRF `node:dns`).

## Architecture Decisions

| Decision | Option | Tradeoff | Chosen |
|---|---|---|---|
| Store signature | Sync interface (current) vs **async everywhere** | Async breaks `InMemoryStore` + `index.ts` + `actions.ts` + 2 test files; sync would need a fake-sync wrapper over Prisma's async UPSERT (impossible without blocking) | **Async everywhere** — `PrismaRateLimitStore` UPSERT is inherently async; `InMemoryStore` adapts trivially (`async` wrappers) |
| Migration datasource url | `url=env()` in schema vs override in `prisma.config.ts` | Schema url is used only by CLI (`migrate`); runtime ignores it (driver adapter). Config override is extra indirection | **Schema `url=env("DATABASE_URL")`** — matches existing `prisma.config.ts` comment |
| Session rows | Adapter + JWT strategy | With `strategy:"jwt"`, adapter writes `User`+`Account` but **no `Session` rows** (stateless). Spec R6 "Session rows linked" is aspirational | **Define `Session` model, document it stays empty** — no test asserts Session writes |
| `windowStart` type | `Int` vs `BigInt` vs `String` | Epoch ms exceeds `Int` (2.1B). `BigInt`=Postgres `bigint`, matches in-memory `number` ms exactly | **`BigInt`** — convert `number↔bigint` at the adapter boundary |
| DB store default | Always-Prisma vs env-guarded | `@/lib/prisma` import **throws at module load** when `DATABASE_URL` unset → would break `rate-limit/*` tests. | **Env-guarded**: `NODE_ENV==="production"` → `PrismaRateLimitStore`, else `InMemoryStore`; `PrismaRateLimitStore` lives in its own module taking an injected `PrismaClient` (structural type) so tests mock it and `store.ts`/`index.ts` stay prisma-import-free |
| `email` nullability | Required vs nullable | GitHub OAuth returns `null` email when user hides it | **`String? @unique`** — matches Auth.js MongoDB variant |

## Prisma Schema (U1)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")   // added for `prisma migrate dev`
}

enum Tier { FREE PRO }

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  tier          Tier      @default(FREE)
  createdAt     DateTime  @default(now())
  accounts      Account[]
  sessions      Session[]
  audits        Audit[]
}

model Account {
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([provider, providerAccountId])
}

model Session {
  sessionToken String   @id
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime
  @@id([identifier, token])
}

model Audit {
  id           String   @id @default(cuid())
  userId       String
  url          String
  geoScore     Int
  severityBand String
  durationMs   Int
  result       Json
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, createdAt(sort: Desc)])
}

model RateLimitEntry {
  key         String
  windowStart BigInt
  count       Int    @default(1)
  @@id([key, windowStart])
}
```

Migration: `pnpm prisma:migrate -- --name init` against Supabase (`prisma migrate dev`). Runtime keeps `PrismaPg` adapter (`src/lib/prisma.ts` unchanged).

## Data Flow

```
POST /report  (auditAction, server action)
  ├─ await limiter.check(ip)            # IP rate limit (all users)
  ├─ if session && countAuditsInWindow >= 3 → { error: limitReached }   # cheap pre-check
  └─ redirect /report?url=

/report?url= (AuditRunner, server component)
  ├─ result = await runAudit(url)
  ├─ session = await auth()
  ├─ if session:
  │    ├─ if countAuditsInWindow(prisma, userId, now) >= 3 → render limit copy (no persist)  # authoritative
  │    └─ else prisma.audit.create({ ..., result: JSON })
  └─ render report

/dashboard/* (middleware) → 307 /login?callbackUrl=  (matcher /dashboard/:path*)
/dashboard (RSC) → prisma.audit.findMany(userId, createdAt desc) → table + trend + empty state
```

## File Changes

| File | Action | Description |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add 6 models + enum + `url=env()` (above) |
| `prisma/migrations/*/migration.sql` | Create | First migration |
| `src/lib/auth.ts` | Modify | `adapter: PrismaAdapter(prisma)`, `pages: { signIn: "/login" }` |
| `src/lib/auth-guard.ts` | Modify | target `/api/auth/signin` → `/login` |
| `src/middleware.ts` | Modify | matcher `["/dashboard/:path*"]` |
| `src/app/login/page.tsx`, `src/app/signup/page.tsx` | Create | Client components → `signIn("github",{callbackUrl})`, inline error `role="alert"` |
| `src/lib/audit/tier.ts` | Create | `FREE_AUDIT_LIMIT`, `FREE_AUDIT_WINDOW_MS`, `countAuditsInWindow` |
| `src/lib/audit/actions.ts` | Modify | `await` limiter; add pre-check tier gate |
| `src/report/audit-runner.tsx` | Modify | `auth()` + authoritative check + persist |
| `src/lib/rate-limit/store.ts` | Modify | interface async + `InMemoryStore` async |
| `src/lib/rate-limit/prisma-store.ts` | Create | `PrismaRateLimitStore` |
| `src/lib/rate-limit/index.ts` | Modify | async `check`/`reset`; env-guarded default store |
| `src/app/dashboard/page.tsx` | Modify | RSC fetch + compose |
| `src/dashboard/*.tsx` | Create | `AuditHistoryTable`, `ScoreTrend`, `DashboardEmptyState` |

## Interfaces / Contracts

```ts
// src/lib/rate-limit/store.ts — ASYNC (breaking)
export interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  increment(key: string, windowStart: number): Promise<void>;
  reset(key: string): Promise<void>;
}

// src/lib/rate-limit/prisma-store.ts
export class PrismaRateLimitStore implements RateLimitStore {
  constructor(private prisma: Pick<PrismaClient, "rateLimitEntry">) {}
  async get(key) {                       // findFirst({ key }, orderBy windowStart desc)
    const row = await this.prisma.rateLimitEntry.findFirst({ where: { key },
      orderBy: { windowStart: "desc" } });
    return row ? { count: row.count, windowStart: Number(row.windowStart) } : null;
  }
  async increment(key, windowStart) {    // atomic UPSERT on (key, windowStart)
    const ws = BigInt(windowStart);
    await this.prisma.rateLimitEntry.upsert({
      where: { key_windowStart: { key, windowStart: ws } },
      create: { key, windowStart: ws, count: 1 },
      update: { count: { increment: 1 } } });
  }
  async reset(key) { await this.prisma.rateLimitEntry.deleteMany({ where: { key } }); }
}

// src/lib/audit/tier.ts — pure, testable with prisma mock
export const FREE_AUDIT_LIMIT = 3;
export const FREE_AUDIT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export function countAuditsInWindow(prisma: Pick<PrismaClient, "audit">, userId: string, now: number) {
  return prisma.audit.count({ where: { userId, createdAt: { gte: new Date(now - FREE_AUDIT_WINDOW_MS) } } });
}
```

Dashboard presentational contract (`src/dashboard/`): `type DashboardAudit = { id, url, geoScore, severityBand, createdAt }`. `AuditHistoryTable({ audits })`, `ScoreTrend({ audits })` (bars = `<div style={{height: `${score}%`}}>`), `DashboardEmptyState()`. Re-audit link `/report?url=${encodeURIComponent(url)}`. Reuses `src/ui/` Card/Button/SeverityBadge.

## Testing Strategy

| Layer | Test (Vitest) | Not tested |
|---|---|---|
| `countAuditsInWindow` | pure fn vs mocked `prisma.audit.count` (assert `gte` window) | real Prisma |
| `PrismaRateLimitStore` | mocked `rateLimitEntry` upsert/findFirst (atomicity by construction) | real DB |
| `requireDashboardAuth` | `/login` target + 307 + callbackUrl; matcher string | — |
| Dashboard components | render table/trend/empty-state vs fixtures (RTL) | — |
| Tier gate | `auditAction` pre-check + `AuditRunner` limit copy via injected `countAuditsInWindow` | OAuth flow, Supabase |

Supabase smoke (`pnpm dev`, real DB) = HARD GATE: real sign-in + persist + dashboard + limit. Sync→async ripple: `store.test.ts`, `index.test.ts` gain `await`; `actions.test.ts` awaits `check`.

## Threat Matrix

`N/A — no shell commands, subprocesses, VCS/PR automation, executable-file classification, or process-integration boundary.` Middleware matcher widening is a redirect-only routing change (no security boundary); the SSRF `node:dns` guard is pre-existing (Sprint 1, unchanged).

## Migration / Rollout

Additive first migration; `prisma migrate reset` in dev. Revert per-slice: U2 removes adapter (returns to skeleton), U5 `RATE_LIMIT_ENABLED=false` bypasses store / one-line `InMemoryStore` swap. `RATE_LIMIT_ENABLED` kill switch preserved (checks env before any `await store`).

## Slice Dependencies (U1→U5)

| Slice | Files | Depends |
|---|---|---|
| U1 DB foundation | schema, migration, `prisma:generate`, install `@auth/prisma-adapter` | — |
| U2 auth upgrade | `auth.ts`, `auth-guard.ts`, `middleware.ts`, `/login`, `/signup` | U1 |
| U3 persistence + tier | `tier.ts`, `actions.ts`, `audit-runner.tsx` | U1, U2 |
| U4 dashboard | `dashboard/page.tsx`, `src/dashboard/*` | U3 |
| U5 limiter DB | `store.ts`, `prisma-store.ts`, `index.ts`, `actions.ts` (await) | U1 |

## Open Questions

- [ ] `@auth/prisma-adapter` exact version vs next-auth 5.0.0-beta.32 × Prisma 7 (generator `prisma-client`): verify at U2 with typecheck + smoke; if types diverge from `@prisma/client`, cast adapter param. Mitigation documented, not blocking.
- [ ] Spec R6 asserts "Session rows linked" — resolved: JWT strategy writes no `Session` rows. Confirm sdd-tasks does not add a Session-write test.
