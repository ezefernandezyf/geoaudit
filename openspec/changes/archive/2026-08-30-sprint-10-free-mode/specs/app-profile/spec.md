# App Profile Delta

> **Change**: `sprint-10-free-mode` · **Type**: Delta (MODIFIED)

## Purpose

Remove tier and subscription surfaces from the profile page. The page still shows identity, audit usage against the single FREE limit, and a support entry. Subscription management is removed with the billing capability.

## MODIFIED Requirements

### Requirement: Plan/Tier Display (PRF-3)

When the profile page renders, then it MUST show the user's single plan ("Free"), since there is only one plan.

(Previously: showed the user's tier — `FREE`/`PRO`/`ENTERPRISE`.)

#### Scenario: Plan visible

- GIVEN an authenticated user
- WHEN the profile renders
- THEN the plan pill shows "Free"

### Requirement: Audit Usage (PRF-4)

When the profile page renders, then it MUST show the user's audits used against the single FREE limit (10 per 30 days).

(Previously: usage was shown against the tier limit — FREE 3/30d, PRO 10, ENTERPRISE 50.)

#### Scenario: Usage against limit

- GIVEN a user who has used 4 audits
- WHEN the profile renders
- THEN it shows "4 / 10" audits used

## REMOVED Requirements

### Requirement: Manage Subscription (PRF-5)

(Reason: The Customer Portal action and `/pricing` are deleted with the billing/pricing capabilities.)
(Migration: None — no subscription management surface remains.)
