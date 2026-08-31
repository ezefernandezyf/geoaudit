# Rate Limiting Specification

> **Change**: `sprint-2-free-audit-flow` + `sprint-11-rebrand-polish` · **Type**: New capability (ADDED)

## Purpose

Server-action in-memory rate limiter to protect the free audit flow from abuse. Fixed-window algorithm, store injectable via interface, keyed by client IP. Best-effort in serverless (no shared state across instances). No database, no public API endpoint. Disableable via `RATE_LIMIT_ENABLED` env var. Since Sprint 11, a second limiter `getAnonymousAuditLimiter()` (3 requests / 30-day window, keyed `anon:{ip}`) enforces the anonymous audit cap at completion in the audit runner, reusing the same `PrismaRateLimitStore` and `rateLimitEntry` table (RTL-8).

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| RTL-1 | Fixed window algorithm | MUST | Track request counts per window; configurable `windowMs` and `maxRequests` |
| RTL-2 | Store injectable | MUST | Store behind interface (`get`/`increment`/`reset`, async); production default: DB-backed `PrismaRateLimitStore` |
| RTL-3 | Key by client IP | MUST | Extract IP from `x-forwarded-for` header fallback `x-real-ip` |
| RTL-4 | Server Action only | MUST | Enforce only in the audit form Server Action; no standalone route handler |
| RTL-5 | Over-limit response | MUST | Return `{ allowed: false, remaining: 0, resetMs }`; form shows inline error with `role="alert"` |
| RTL-6 | DB-backed store | MUST | Default store is `PrismaRateLimitStore` performing atomic UPSERT on `(key, windowStart)`; `RATE_LIMIT_ENABLED=false` bypasses it |
| RTL-7 | Feature flag | MUST | Read `RATE_LIMIT_ENABLED`; when `"false"`, bypass all checks (no counter increment) |
| RTL-8 | Anonymous audit limiter | MUST | Provide `getAnonymousAuditLimiter()` — 3 requests / 30-day window, keyed `anon:{ip}`, enforced ONLY at anonymous audit completion (no pre-check in `actions.ts`) |

### RTL-1: Fixed window algorithm

**Rationale**: Fixed window is simple, predictable, and sufficient pre-auth. Sliding window/log adds complexity without material benefit until Sprint 3 (tiered limits with DB).

#### Scenario: Requests within limit

- GIVEN window of 60s with max 5 requests
- AND client IP `1.2.3.4` has made 3 requests in the current window
- WHEN client makes a 4th request
- THEN `{ allowed: true, remaining: 1, resetMs: <time> }` is returned
- AND the counter for `1.2.3.4` is incremented to 4

#### Scenario: Requests exceed limit

- GIVEN `1.2.3.4` has made 5 requests in the current 60s window
- WHEN a 6th request arrives
- THEN `{ allowed: false, remaining: 0, resetMs: <time> }` is returned

#### Scenario: Window resets

- GIVEN `1.2.3.4` made its first request 65 seconds ago (window expired)
- WHEN a new request arrives
- THEN a new window starts with counter reset to 1
- AND `{ allowed: true, remaining: 4, resetMs: <60s from now> }` is returned

### RTL-2: Store injectable

**Rationale**: The store must be injectable so unit tests can assert limiter behavior against a mock and so the production default can swap between in-memory and DB-backed implementations without changing the limiter.

#### Scenario: Injected mock store

- GIVEN a test provides a mock `RateLimitStore` with `get(key)` returning `{ count: 3, windowStart: now }`
- WHEN `createRateLimiter({ store: mockStore, windowMs: 60000, maxRequests: 5 })` checks `"1.2.3.4"`
- THEN the limiter queries `mockStore.get("1.2.3.4")` and returns its decision based on mock data
- AND `mockStore.increment` is called on allowed requests
- AND no shared `Map` or global state is accessed

### RTL-7: Feature flag

**Rationale**: In production serverless (multi-instance), the in-memory limiter may block legit traffic across instances. `RATE_LIMIT_ENABLED=false` is the emergency kill switch.

#### Scenario: Rate limiting disabled via env

- GIVEN `RATE_LIMIT_ENABLED="false"` in environment
- WHEN `limiter.check(ip)` is called
- THEN it returns `{ allowed: true }` immediately (bypass)
- AND no counter is incremented and no store method is called

### RTL-6: DB-backed store

**Rationale**: The in-memory store is per-instance; in serverless each instance enforces its own budget, multiplying the effective limit by the instance count. A DB-backed store shares state across instances.

The system MUST use a DB-backed `PrismaRateLimitStore` as the default store, performing an atomic UPSERT on `(key, windowStart)`.

#### Scenario: Shared counter across instances

- GIVEN two serverless instances share the same database
- WHEN both instances check the same client IP in the same window
- THEN both read and increment the same persisted counter, with no per-instance drift

#### Scenario: Kill switch still bypasses the store

- GIVEN `RATE_LIMIT_ENABLED="false"`
- WHEN the limiter checks any key
- THEN no DB read or write occurs and the check returns allowed

### RTL-8: Anonymous audit limiter

The system MUST provide a second limiter `getAnonymousAuditLimiter()` — a singleton configured as **3 requests / 30-day window**, keyed `anon:{ip}`, reusing the existing `PrismaRateLimitStore` and `rateLimitEntry` table (no schema change). Its namespaced key MUST NOT collide with the burst limiter's plain-IP keys (RTL-1, 5/60s). Unlike the burst limiter (enforced in the audit form Server Action, RTL-4), the anonymous limiter MUST be enforced ONLY in the audit runner at the point an anonymous audit completes, incrementing exactly once (no pre-check in `actions.ts`).

#### Scenario: Namespace isolation

- GIVEN both limiters share `PrismaRateLimitStore`
- WHEN the burst limiter increments `1.2.3.4` and the anonymous limiter increments `anon:1.2.3.4`
- THEN the two counters are stored under distinct keys and do not affect each other

#### Scenario: 3/30d configuration

- GIVEN `getAnonymousAuditLimiter()` is instantiated
- WHEN it checks an IP
- THEN it applies a 30-day window with a maximum of 3 requests

#### Scenario: Single increment on completion

- GIVEN an anonymous audit completes via the audit runner
- WHEN the limiter is consulted
- THEN exactly one increment is recorded (no pre-check in the form action double-counts it)

#### Scenario: Kill switch bypasses anonymous limiter

- GIVEN `RATE_LIMIT_ENABLED="false"`
- WHEN the anonymous limiter checks any `anon:{ip}` key
- THEN it returns allowed and no counter is incremented

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RTL-1 | Within limit, Exceed limit, Window resets | Covered |
| RTL-2 | Injected mock store | Covered |
| RTL-3 | (IP extraction from headers — integration test) | Implicit |
| RTL-4 | (integration: limiter only wired in audit action) | Implicit |
| RTL-5 | (via ADF-9 rate limit scenario) | Implicit |
| RTL-6 | Shared counter across instances, Kill switch bypasses store | Covered (prisma-store tests + HARD GATE DB real) |
| RTL-7 | Rate limiting disabled | Covered |
| RTL-8 | Namespace isolation, 3/30d configuration, Single increment on completion, Kill switch bypasses anonymous limiter | Covered |
