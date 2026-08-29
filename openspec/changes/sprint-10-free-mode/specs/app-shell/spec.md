# App Shell Delta

> **Change**: `sprint-10-free-mode` · **Type**: Delta (MODIFIED)

## Purpose

Remove the tier-dependent plan pill. The navbar always shows the single FREE plan, and the multi-page link is always visible to authenticated users. All other shell behavior is unchanged.

## MODIFIED Requirements

### Requirement: Plan Pill (SHL-2)

When an authenticated user is signed in, then the navbar MUST show a plan pill reading "Free" for every user. There is no tier-dependent pill.

(Previously: the pill reflected the user's tier — `Free`/`Pro`/`Enterprise`.)

#### Scenario: Plan pill shown

- GIVEN an authenticated user
- WHEN the navbar renders
- THEN a "Free" plan pill is visible
