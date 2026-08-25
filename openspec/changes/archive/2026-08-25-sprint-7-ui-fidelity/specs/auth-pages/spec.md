# Delta: Auth Pages

> **Change**: `sprint-7-ui-fidelity` · **Type**: Delta (MODIFIED)

## Purpose

Restyle `/login` and `/signup` to Gemini's composition: centered card, signup benefits list, "Continuar con GitHub" copy, and neutral Spanish throughout (removing voseo). GitHub OAuth remains the sole provider; post-auth redirect and error handling are unchanged (ATH-3/ATH-4/ATH-5).

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| ATH-6 | Centered card | Partial | MUST | Both pages MUST render a centered auth card in Gemini style |
| ATH-7 | Signup benefits | New | MUST | `/signup` MUST list signup benefits |
| ATH-8 | "Continuar con GitHub" copy | Partial | MUST | The primary action MUST read "Continuar con GitHub" (neutral) |
| ATH-9 | Neutral copy | Partial | MUST | All auth copy MUST be neutral Spanish, no voseo |

### Requirement: Centered Card (ATH-6)

When the login or signup page renders, then it MUST present a vertically centered card with the Gemini visual language (direct hex, serif heading).

#### Scenario: Card centered

- GIVEN `/login`
- WHEN it renders
- THEN the auth form is centered on the page with Gemini styling

### Requirement: Signup Benefits (ATH-7)

When `/signup` renders, then it MUST list the benefits of signing up (e.g. saved history, share links, multi-page audits).

#### Scenario: Benefits listed

- GIVEN `/signup`
- WHEN it renders
- THEN a benefits list is visible

### Requirement: "Continuar con GitHub" Copy (ATH-8)

When the primary auth action renders, then its label MUST read "Continuar con GitHub" (neutral Spanish), replacing any voseo/English variant.

#### Scenario: Neutral label

- GIVEN the auth button
- WHEN it renders
- THEN the label is "Continuar con GitHub"

### Requirement: Neutral Copy (ATH-9)

When any auth page renders, then its copy MUST be neutral Spanish — no voseo forms anywhere.

#### Scenario: No voseo

- GIVEN the login and signup pages
- WHEN their copy is inspected
- THEN no voseo forms (e.g. "iniciá", "registrate") appear

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| ATH-6 | Card centered | Covered |
| ATH-7 | Benefits listed | Covered |
| ATH-8 | Neutral label | Covered |
| ATH-9 | No voseo | Covered |
