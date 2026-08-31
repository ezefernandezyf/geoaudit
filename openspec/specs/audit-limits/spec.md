# Audit Limits Specification

> **Change**: `sprint-3-auth-dashboard` + `sprint-4-stripe-integration` + `sprint-5-pro-features` + `sprint-10-free-mode` + `sprint-11-rebrand-polish` · **Type**: New capability (ADDED) + Delta (MODIFIED) + Capability renamed (`tier-limits` → `audit-limits`)

## Purpose

Usage limits for the audit flow. There is a single FREE limit: **10 audits per 30-day moving window** (was 3), enforced for authenticated users only. Paid monthly counters (`Subscription.auditsUsed`/`auditsResetAt`), counter selection by tier, the `Tier` enum, and the `isPaidTier` PRO feature gate are removed with the billing capability. Anonymous audits are allowed; since Sprint 11 they MUST NOT persist `Audit` rows nor count toward the authenticated 10/30d limit, and instead count toward a separate **3-audit / 30-day fixed window per client IP** limit (TLM-11), enforced at completion in the audit runner. Since Sprint 5, multi-page audit, PDF export, and share links are available to every authenticated user (no tier gate), and one multi-page audit counts as exactly one audit toward the limit.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| TLM-2 | Free limit (10/30d) | MUST | Every authenticated user MUST get 10 audits per 30-day moving window; no other limits or tiers |
| TLM-3 | Pre-check enforcement | MUST | The audit Server Action MUST block an over-limit user before running |
| TLM-4 | Authoritative check | MUST | The report page MUST re-check the limit before persisting |
| TLM-5 | Limit-reached message | MUST | Over-limit users MUST see clear copy explaining the 10-audit limit and the 30-day reset |
| TLM-6 | Anonymous allowed | MUST | Anonymous audits MUST be permitted, MUST NOT persist `Audit` rows, MUST NOT count toward the 10/30d limit; they MUST count toward the separate IP-based 3/30d limit (TLM-11) |
| TLM-10 | Multi-page counts once | MUST | One multi-page audit MUST count as exactly one toward the limit |
| TLM-11 | Anonymous IP limit | MUST | Anonymous audits MUST be limited to 3 per 30-day fixed window per client IP, enforced at completion |

### Requirement: Free Limit (TLM-2)

The system MUST allow every authenticated user **10 audits per 30-day moving window**, counting `Audit` rows created in the last 30 days from now. There are no other limits or tiers.

#### Scenario: Counting the moving window

- GIVEN an authenticated user
- WHEN the system counts their audits
- THEN it counts `Audit` rows created in the last 30 days from now

#### Scenario: Eleventh audit blocked

- GIVEN an authenticated user with 10 audits in the last 30 days
- WHEN they run an 11th audit
- THEN it is blocked with a limit-reached result

### Requirement: Pre-check Enforcement (TLM-3)

The audit Server Action MUST block an authenticated user who has reached the 10-audit/30-day limit before running the audit.

#### Scenario: Eleventh audit is blocked

- GIVEN an authenticated user with 10 audits in the last 30 days
- WHEN they submit an 11th audit
- THEN the action returns a limit-reached result and does not run the audit

### Requirement: Authoritative Check (TLM-4)

The report page MUST re-check the limit before persisting an audit (TOCTOU accepted).

#### Scenario: Persist is guarded

- GIVEN an authenticated audit completed
- WHEN the report page is about to persist the `Audit`
- THEN it re-verifies the user is within the limit before writing

### Requirement: Limit-reached Message (TLM-5)

An over-limit user MUST see clear copy explaining the 10-audit limit and that the window resets 30 days after each audit.

#### Scenario: User sees limit copy

- GIVEN an authenticated user over the 10-audit limit
- WHEN they attempt another audit
- THEN a message explains the 10-audit limit
- AND states the window resets 30 days after each audit

### Requirement: Anonymous Allowed (TLM-6)

Anonymous audits MUST be permitted. They MUST NOT persist `Audit` rows and MUST NOT count toward the authenticated 10/30d limit; instead they MUST count toward a separate 3-audit/30-day IP-based limit (TLM-11).
(Previously: anonymous audits were permitted and MUST NOT count toward any limit.)

#### Scenario: Anonymous audit proceeds

- GIVEN a user without a session
- WHEN they run an audit
- THEN the audit proceeds (IP rate limiting still applies)
- AND no `Audit` row is persisted

#### Scenario: Anonymous audit counts toward IP limit

- GIVEN a user without a session
- WHEN an anonymous audit completes
- THEN exactly one increment is recorded against the IP limit (TLM-11)

### Requirement: Anonymous IP Limit (TLM-11)

The system MUST allow **3 anonymous audits per 30-day fixed window per client IP**. The window MUST be anchored at the first increment for that IP and MUST reset 30 days after that anchor (fixed window, not rolling). Enforcement MUST occur only at the point an anonymous audit completes (authoritative gate), incrementing exactly once per completed anonymous audit, and MUST be disabled when `RATE_LIMIT_ENABLED="false"`.

#### Scenario: Third anonymous audit allowed

- GIVEN an IP with 2 completed anonymous audits in the current 30-day window
- WHEN a 3rd anonymous audit completes
- THEN it is allowed and the counter reaches 3

#### Scenario: Fourth anonymous audit blocked

- GIVEN an IP with 3 completed anonymous audits in the current window
- WHEN a 4th anonymous audit attempts to complete
- THEN it is blocked with a limit-reached result

#### Scenario: Fixed window does not roll

- GIVEN an IP that completed 3 anonymous audits on day 1
- WHEN 2 more anonymous audits are attempted on day 29 (still within the 30-day window)
- THEN both are blocked (the window is anchored at day 1, not rolling)

#### Scenario: Window resets after 30 days

- GIVEN an IP whose fixed window started more than 30 days ago
- WHEN a new anonymous audit completes
- THEN a new window starts with counter reset to 1

#### Scenario: Signed-in user unaffected

- GIVEN an authenticated user
- WHEN they run an audit
- THEN the anonymous IP limit does not apply; the authenticated 10/30d limit (TLM-2) applies instead

### Requirement: Multi-page Counts Once (TLM-10)

When a multi-page audit is counted against the limit, then it MUST count as exactly one audit regardless of page count.

#### Scenario: Five-page audit increments once

- GIVEN an authenticated user runs a 5-page multi-page audit
- WHEN the counter is updated
- THEN the 30-day window counts it as exactly one audit