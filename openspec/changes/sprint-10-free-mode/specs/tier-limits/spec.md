# Tier Limits Delta

> **Change**: `sprint-10-free-mode` · **Type**: Delta (MODIFIED)

## Purpose

Remove the tiered limit model. With Stripe and the `Tier` enum gone, there is a single FREE limit: **10 audits per 30-day moving window** (was 3), enforced for authenticated users only. Paid monthly counters (`Subscription.auditsUsed`/`auditsResetAt`), counter selection by tier, and the `isPaidTier` PRO feature gate are removed. Multi-page audits still count as exactly one audit toward the window.

## REMOVED Requirements

### Requirement: Tier Field (TLM-1)

(Reason: The `User.tier` field and `Tier` enum are dropped by the down-migration; there is no tier concept.)
(Migration: None — all users share one FREE plan.)

### Requirement: Paid Monthly Counter (TLM-7)

(Reason: The `Subscription` model is deleted; no monthly billing counter remains.)
(Migration: Count `Audit` rows in a 30-day window for all users, per TLM-2.)

### Requirement: Counter Selection (TLM-8)

(Reason: With a single limit there is no counter to select by tier.)
(Migration: Use the single 30-day `Audit`-row window for everyone.)

### Requirement: PRO Feature Gate (TLM-9)

(Reason: Multi-page, PDF, and share are now FREE; the `isPaidTier` gate and upgrade CTA are removed.)
(Migration: See the `multi-page-audit`, `pdf-export`, and `share-links` deltas, which lift their gates.)

## MODIFIED Requirements

### Requirement: Per-Tier Limits (TLM-2)

The system MUST allow every authenticated user **10 audits per 30-day moving window**, counting `Audit` rows created in the last 30 days from now. There are no other limits or tiers.

(Previously: FREE=3/30d moving window, PRO=10/period, ENTERPRISE=50/period.)

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

(Previously: blocked per-tier using the tier-appropriate counter.)

#### Scenario: Eleventh audit is blocked

- GIVEN an authenticated user with 10 audits in the last 30 days
- WHEN they submit an 11th audit
- THEN the action returns a limit-reached result and does not run the audit

### Requirement: Limit-reached Message (TLM-5)

An over-limit user MUST see clear copy explaining the 10-audit limit and that the window resets 30 days after each audit.

(Previously: message described the 3-audit FREE limit.)

#### Scenario: User sees limit copy

- GIVEN an authenticated user over the 10-audit limit
- WHEN they attempt another audit
- THEN a message explains the 10-audit limit
- AND states the window resets 30 days after each audit

### Requirement: Multi-page Counts Once (TLM-10)

When a multi-page audit is counted against the limit, then it MUST count as exactly one audit regardless of page count.

(Previously: incremented `Subscription.auditsUsed` by one.)

#### Scenario: Five-page audit increments once

- GIVEN an authenticated user runs a 5-page multi-page audit
- WHEN the counter is updated
- THEN the 30-day window counts it as exactly one audit
