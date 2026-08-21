# Rate Limiting Specification

> **Change**: `sprint-2-free-audit-flow` · **Type**: New capability (ADDED)

## Purpose

Server-action in-memory rate limiter to protect the free audit flow from abuse. Fixed-window algorithm, store injectable via interface, keyed by client IP. Best-effort in serverless (no shared state across instances). No database, no public API endpoint. Disableable via `RATE_LIMIT_ENABLED` env var.

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
