# Delta for Rate Limiting

> **Change**: `sprint-11-rebrand-polish` · **Type**: New requirement (ADDED)

## ADDED Requirements

### Requirement: Anonymous Audit Limiter (RTL-8)

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
