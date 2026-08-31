# Delta for App Profile

> **Change**: `sprint-11-rebrand-polish` · **Type**: Delta (MODIFIED)

## MODIFIED Requirements

### Requirement: Plan Display (PRF-3)

When the profile page renders, then it MUST show the user's single plan pill reading "Plan Free", unified with the navbar pill (SHL-2).
(Previously: the pill read "Free"; the profile and navbar strings differed.)

#### Scenario: Unified plan pill

- GIVEN an authenticated user
- WHEN the profile renders
- THEN the plan pill reads "Plan Free" (matching the navbar)

### Requirement: Support Entry (PRF-6)

When the profile page renders, then it MUST expose a support entry point using the shared support email constant (`ezefernandezyf@gmail.com`).
(Previously: support entry existed; email was not guaranteed to come from the shared constant.)

#### Scenario: Support link uses shared email

- GIVEN the profile page
- WHEN it renders
- THEN the support contact references the shared support email constant
