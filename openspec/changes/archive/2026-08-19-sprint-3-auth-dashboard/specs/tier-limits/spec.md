# Tier Limits Specification

## Purpose

Tiered usage limits. Users carry a tier (`FREE`/`PRO`); `FREE` allows 3 audits per 30-day moving window. Enforcement happens in the audit Server Action (pre-check) and in the report page (authoritative check before persist). Anonymous audits are allowed and do not count toward the tier.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| TLM-1 | Tier field | MUST | `User` MUST carry a `tier` (`FREE`/`PRO`), defaulting to `FREE` |
| TLM-2 | Free window limit | MUST | `FREE` users are limited to 3 audits per 30-day moving window |
| TLM-3 | Pre-check enforcement | MUST | The audit Server Action MUST block over-limit users before running |
| TLM-4 | Authoritative check | MUST | The report page MUST re-check the limit before persisting |
| TLM-5 | Limit-reached message | MUST | Over-limit users MUST see clear copy explaining the 30-day reset |
| TLM-6 | Anonymous allowed | MUST | Anonymous audits MUST be permitted and MUST NOT count toward the tier |

### Requirement: Tier Field (TLM-1)

The `User` model MUST carry a `tier` field with values `FREE` and `PRO`, defaulting to `FREE`.

#### Scenario: New user defaults to FREE

- GIVEN a user signs up via GitHub for the first time
- WHEN their `User` row is created
- THEN their `tier` is `FREE`

### Requirement: Free Window Limit (TLM-2)

`FREE` users MUST be limited to 3 audits within a 30-day moving window measured backward from the current time.

#### Scenario: Counting the moving window

- GIVEN a `FREE` user
- WHEN the system counts their audits
- THEN it counts `Audit` rows created in the last 30 days from now

### Requirement: Pre-check Enforcement (TLM-3)

The audit Server Action MUST block an authenticated `FREE` user who has reached the limit before running the audit.

#### Scenario: Fourth audit is blocked

- GIVEN a `FREE` user with 3 audits in the last 30 days
- WHEN they submit a 4th audit
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
