# Delta for Audit Limits

> **Change**: `sprint-11-rebrand-polish` · **Type**: Delta (MODIFIED) + New requirement (ADDED)

## MODIFIED Requirements

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

## ADDED Requirements

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
