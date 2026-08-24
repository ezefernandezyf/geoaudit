# Tier Limits Delta

> **Change**: `sprint-5-pro-features` · **Type**: Delta (MODIFIED)

## Purpose

Gate the three new PRO features (multi-page audit, PDF export, share links) to paid tiers via the existing `isPaidTier` helper, and confirm that one multi-page audit counts as exactly one audit toward the tier limit.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| TLM-9 | PRO feature gate | New | MUST | Multi-page, PDF, and share MUST be gated to PRO/Enterprise via `isPaidTier` |
| TLM-10 | Multi-page counts once | New | MUST | One multi-page audit MUST count as exactly one toward the limit |

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
