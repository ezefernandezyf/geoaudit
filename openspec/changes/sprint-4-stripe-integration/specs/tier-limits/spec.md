# Tier Limits Specification — Delta

> **Change**: `sprint-4-stripe-integration` · **Type**: Delta (MODIFIED)

## Purpose

Extend the tier system from FREE-only enforcement to three tiers. `Tier` gains `ENTERPRISE`; enforcement becomes per-tier (FREE = 3 per 30-day moving window, PRO = 10 per billing period, ENTERPRISE = 50 per billing period). Paid tiers use a `Subscription`-backed monthly counter (`auditsUsed`/`auditsResetAt`) reset at `currentPeriodEnd`; FREE keeps its 30-day moving window (TLM-2 unchanged in semantics).

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| TLM-1 | Tier field | Partial | MUST | `User.tier` gains `ENTERPRISE` (values FREE/PRO/ENTERPRISE) |
| TLM-2 | Per-tier limits | Partial | MUST | FREE=3/30d moving window, PRO=10/period, ENTERPRISE=50/period |
| TLM-3 | Pre-check enforcement | Partial | MUST | Audit action blocks any over-limit authenticated user using their tier's counter |
| TLM-7 | Paid monthly counter | New | MUST | `Subscription.auditsUsed`/`auditsResetAt` reset when `currentPeriodEnd` passes |
| TLM-8 | Counter selection | New | MUST | FREE counts `Audit` rows in window; PRO/ENTERPRISE count `Subscription.auditsUsed` |

> Unchanged and not repeated: TLM-4 (authoritative check), TLM-5 (limit message), TLM-6 (anonymous allowed).

## MODIFIED Requirements

### Requirement: Tier Field (TLM-1)

**Status**: Partial

When a user row is created or read, then `tier` MUST be one of `FREE`, `PRO`, or `ENTERPRISE`, defaulting to `FREE`.

(Previously: `tier` had only `FREE` and `PRO`.)

#### Scenario: Enterprise is a valid tier

- GIVEN a user with an Enterprise subscription
- WHEN their tier is read
- THEN it is `ENTERPRISE`

### Requirement: Per-tier Limits (TLM-2)

**Status**: Partial

When an authenticated user runs an audit, then their allowed count MUST follow their tier: `FREE` = 3 per 30-day moving window, `PRO` = 10 per billing period, `ENTERPRISE` = 50 per billing period.

(Previously: only `FREE` had a limit — 3 per 30-day moving window.)

#### Scenario: Pro gets ten per period

- GIVEN a PRO user at the start of their billing period
- WHEN they run audits
- THEN they may complete up to 10 before being blocked

#### Scenario: Enterprise gets fifty per period

- GIVEN an Enterprise user at the start of their billing period
- WHEN they run audits
- THEN they may complete up to 50 before being blocked

### Requirement: Pre-check Enforcement (TLM-3)

**Status**: Partial

When an authenticated user submits an audit, then the audit action MUST block them if they have reached their tier's limit, using the tier-appropriate counter, before running the audit.

(Previously: only authenticated `FREE` users were blocked.)

#### Scenario: Pro over limit is blocked

- GIVEN a PRO user who has used 10 audits in the current period
- WHEN they submit an 11th audit
- THEN the action returns a limit-reached result and does not run the audit

## ADDED Requirements

### Requirement: Paid Monthly Counter (TLM-7)

**Status**: New

When a paid (PRO/Enterprise) user runs an audit, then `Subscription.auditsUsed` MUST increment, and when `currentPeriodEnd` passes, then `auditsUsed` MUST reset to 0 with `auditsResetAt` advanced to the new period.

#### Scenario: Counter resets at period end

- GIVEN a PRO user with `auditsUsed = 10` and `currentPeriodEnd` in the past
- WHEN they run their next audit
- THEN `auditsUsed` is reset to 0 before counting the new audit

### Requirement: Counter Selection (TLM-8)

**Status**: New

When enforcement counts a user's usage, then it MUST select the counter by tier: `FREE` counts `Audit` rows in the 30-day window, and PRO/ENTERPRISE count `Subscription.auditsUsed` within the current period.

#### Scenario: Free uses window, paid uses counter

- GIVEN a `FREE` user and a `PRO` user
- WHEN each user's limit is evaluated
- THEN FREE is measured by `Audit` rows in the last 30 days
- AND PRO is measured by `Subscription.auditsUsed` since `auditsResetAt`
