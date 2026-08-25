# Delta: App Shell

> **Change**: `sprint-8-polish-testing-backlog` · **Type**: Delta (MODIFIED)

## Purpose

Neutralize the shell copy: navbar (and footer) strings move to `copy.ts` and switch from tuteo to neutral Spanish (usted). Structural requirements (SHL-1..SHL-5) are unchanged.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| SHL-6 | Neutral shell copy | New | MUST | Navbar/footer copy MUST be neutral Spanish (usted), sourced from `copy.ts` |

### Requirement: Neutral Shell Copy (SHL-6)

When the app shell renders, then its copy (navbar links, user actions, footer text) MUST be neutral Spanish using "usted", MUST be centralized in `copy.ts`, and MUST NOT contain voseo or tuteo forms.

#### Scenario: Navbar copy is neutral

- GIVEN the navbar
- WHEN its copy is inspected
- THEN no voseo/tuteo forms appear and the strings come from `copy.ts`

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| SHL-6 | Navbar copy is neutral | Covered |
