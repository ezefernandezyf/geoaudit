# Delta for Rate Limiting

## MODIFIED Requirements

### RTL-2: Store injectable

**Rationale**: The store must be injectable so unit tests can assert limiter behavior against a mock and so the production default can swap between in-memory and DB-backed implementations without changing the limiter.

#### Scenario: Injected mock store

- GIVEN a test provides a mock `RateLimitStore` with `get(key)` returning `{ count: 3, windowStart: now }`
- WHEN `createRateLimiter({ store: mockStore, windowMs: 60000, maxRequests: 5 })` checks `"1.2.3.4"`
- THEN the limiter queries `mockStore.get("1.2.3.4")` and returns its decision based on mock data
- AND `mockStore.increment` is called on allowed requests
- AND no shared `Map` or global state is accessed

(Previously: the production default store was the in-memory `Map`.)

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

(Previously: RTL-6 was a SHOULD-level documentation note promising a DB-backed limiter in Sprint 3; the default store was in-memory and best-effort per instance.)
