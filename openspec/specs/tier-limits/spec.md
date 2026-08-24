# Tier Limits Specification

> **Change**: `sprint-3-auth-dashboard` + `sprint-4-stripe-integration` + `sprint-5-pro-features` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

Tiered usage limits. Users carry a tier (`FREE`/`PRO`/`ENTERPRISE`); `FREE` allows 3 audits per 30-day moving window, `PRO` 10 per billing period, and `ENTERPRISE` 50 per billing period. Paid tiers use a `Subscription`-backed monthly counter (`auditsUsed`/`auditsResetAt`) reset at `currentPeriodEnd`; `FREE` keeps its 30-day moving window. Enforcement happens in the audit Server Action (pre-check) and in the report page (authoritative check before persist). Anonymous audits are allowed and do not count toward the tier. Since Sprint 5, the three PRO features (multi-page audit, PDF export, share links) are gated to paid tiers via the `isPaidTier` helper, and one multi-page audit counts as exactly one audit toward the limit.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| TLM-1 | Tier field | MUST | `User` MUST carry a `tier` (`FREE`/`PRO`/`ENTERPRISE`), defaulting to `FREE` |
| TLM-2 | Per-tier limits | MUST | `FREE`=3/30d moving window, `PRO`=10/period, `ENTERPRISE`=50/period |
| TLM-3 | Pre-check enforcement | MUST | The audit Server Action MUST block over-limit users before running |
| TLM-4 | Authoritative check | MUST | The report page MUST re-check the limit before persisting |
| TLM-5 | Limit-reached message | MUST | Over-limit users MUST see clear copy explaining the limit reset |
| TLM-6 | Anonymous allowed | MUST | Anonymous audits MUST be permitted and MUST NOT count toward the tier |
| TLM-7 | Paid monthly counter | MUST | `Subscription.auditsUsed`/`auditsResetAt` reset when `currentPeriodEnd` passes |
| TLM-8 | Counter selection | MUST | `FREE` counts `Audit` rows in window; PRO/ENTERPRISE count `Subscription.auditsUsed` |
| TLM-9 | PRO feature gate | MUST | Multi-page, PDF, and share MUST be gated to PRO/Enterprise via `isPaidTier` |
| TLM-10 | Multi-page counts once | MUST | One multi-page audit MUST count as exactly one toward the limit |

### Requirement: Tier Field (TLM-1)

The `User` model MUST carry a `tier` field with values `FREE`, `PRO`, and `ENTERPRISE`, defaulting to `FREE`.

#### Scenario: New user defaults to FREE

- GIVEN a user signs up via GitHub for the first time
- WHEN their `User` row is created
- THEN their `tier` is `FREE`

#### Scenario: Enterprise is a valid tier

- GIVEN a user with an Enterprise subscription
- WHEN their tier is read
- THEN it is `ENTERPRISE`

### Requirement: Per-tier Limits (TLM-2)

An authenticated user's allowed audit count MUST follow their tier: `FREE` = 3 per 30-day moving window, `PRO` = 10 per billing period, `ENTERPRISE` = 50 per billing period.

#### Scenario: Counting the moving window

- GIVEN a `FREE` user
- WHEN the system counts their audits
- THEN it counts `Audit` rows created in the last 30 days from now

#### Scenario: Pro gets ten per period

- GIVEN a PRO user at the start of their billing period
- WHEN they run audits
- THEN they may complete up to 10 before being blocked

#### Scenario: Enterprise gets fifty per period

- GIVEN an Enterprise user at the start of their billing period
- WHEN they run audits
- THEN they may complete up to 50 before being blocked

### Requirement: Pre-check Enforcement (TLM-3)

The audit Server Action MUST block an authenticated user who has reached their tier's limit, using the tier-appropriate counter, before running the audit.

#### Scenario: Fourth audit is blocked

- GIVEN a `FREE` user with 3 audits in the last 30 days
- WHEN they submit a 4th audit
- THEN the action returns a limit-reached result and does not run the audit

#### Scenario: Pro over limit is blocked

- GIVEN a PRO user who has used 10 audits in the current period
- WHEN they submit an 11th audit
- THEN the action returns a limit-reached result and does not run the audit

### Requirement: Authoritative Check (TLM-4)

The report page MUST re-check the limit before persisting an audit (TOCTOU accepted).

#### Scenario: Persist is guarded

- GIVEN an authenticated audit completed
- WHEN the report page is about to persist the `Audit`
- THEN it re-verifies the user is within the limit before writing

### Requirement: Limit-reached Message (TLM-5)

An over-limit user MUST see clear copy explaining the limit and that it resets 30 days after each audit.

#### Scenario: User sees limit copy

- GIVEN a `FREE` user who is over the limit
- WHEN they attempt another audit
- THEN a message explains the 3-audit limit
- AND states the window resets 30 days after each audit

### Requirement: Anonymous Allowed (TLM-6)

Anonymous audits MUST be permitted and MUST NOT count toward any tier.

#### Scenario: Anonymous audit bypasses tier

- GIVEN a user without a session
- WHEN they run an audit
- THEN the audit proceeds (IP rate limiting still applies)
- AND no `Audit` row is persisted and no tier counter is incremented

### Requirement: Paid Monthly Counter (TLM-7)

When a paid (PRO/Enterprise) user runs an audit, then `Subscription.auditsUsed` MUST increment, and when `currentPeriodEnd` passes, then `auditsUsed` MUST reset to 0 with `auditsResetAt` advanced to the new period.

#### Scenario: Counter resets at period end

- GIVEN a PRO user with `auditsUsed = 10` and `currentPeriodEnd` in the past
- WHEN they run their next audit
- THEN `auditsUsed` is reset to 0 before counting the new audit

### Requirement: Counter Selection (TLM-8)

When enforcement counts a user's usage, then it MUST select the counter by tier: `FREE` counts `Audit` rows in the 30-day window, and PRO/ENTERPRISE count `Subscription.auditsUsed` within the current period.

#### Scenario: Free uses window, paid uses counter

- GIVEN a `FREE` user and a `PRO` user
- WHEN each user's limit is evaluated
- THEN FREE is measured by `Audit` rows in the last 30 days
- AND PRO is measured by `Subscription.auditsUsed` since `auditsResetAt`

### Requirement: PRO Feature Gate (TLM-9)

When a user attempts a multi-page audit, PDF export, or share-link creation, then the system MUST allow it only when `isPaidTier(user.tier)` is true; FREE users MUST be denied with an upgrade CTA.

#### Scenario: FREE denied all three features

- GIVEN a FREE user
- WHEN they attempt multi-page audit, PDF export, or share creation
- THEN each is denied with an upgrade CTA

#### Scenario: PRO allowed all three features

- GIVEN a PRO or Enterprise user
- WHEN they attempt multi-page audit, PDF export, or share creation
- THEN each proceeds

### Requirement: Multi-page Counts Once (TLM-10)

When a multi-page audit is counted against the tier limit, then it MUST count as exactly one audit regardless of page count.

#### Scenario: Five-page audit increments once

- GIVEN a PRO user runs a 5-page multi-page audit
- WHEN the counter is updated
- THEN `Subscription.auditsUsed` increments by one
