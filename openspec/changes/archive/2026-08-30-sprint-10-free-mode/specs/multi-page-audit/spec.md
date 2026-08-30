# Multi-Page Audit Delta

> **Change**: `sprint-10-free-mode` · **Type**: Delta (MODIFIED)

## Purpose

Lift the PRO gate on multi-page audit. Any authenticated user can run a multi-page audit (still capped at 5 pages, bounded concurrency, counted as one audit toward the FREE limit). Orchestration, persistence, and single-page preservation are unchanged.

## REMOVED Requirements

### Requirement: PRO Feature Gate (MPA-8)

(Reason: Multi-page audit is now FREE; the `isPaidTier` gate and upgrade CTA are removed.)
(Migration: Any authenticated user may run a multi-page audit under the 10/30d limit.)

## MODIFIED Requirements

### Requirement: Multi-page Orchestration (MPA-1)

When an authenticated user runs a multi-page audit, then the system MUST invoke `runMultiPageAudit`, which audits each discovered page by reusing the single-page `runAudit` and returns one composite result with per-page results and an aggregate view.

(Previously: the trigger was restricted to paid users.)

#### Scenario: Composite result assembled

- GIVEN a list of 3 discovered page URLs
- WHEN `runMultiPageAudit` runs
- THEN `runAudit` executes once per URL
- AND one composite result aggregates the 3 per-page results

#### Scenario: Per-page isolation

- GIVEN one page fetch fails while others succeed
- WHEN `runMultiPageAudit` runs
- THEN the failed page is recorded with its error and the remaining pages still complete

### Requirement: One Audit Toward Limit (MPA-7)

When a multi-page audit is counted against the user's limit, then it MUST count as exactly one audit.

(Previously: the scenario referenced the paid `Subscription.auditsUsed` counter.)

#### Scenario: Multi-page counts once

- GIVEN an authenticated user runs a 5-page multi-page audit
- WHEN the limit counter is updated
- THEN the 30-day window increments by one, not five
