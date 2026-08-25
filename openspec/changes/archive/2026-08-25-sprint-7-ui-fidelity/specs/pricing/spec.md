# Delta: Pricing

> **Change**: `sprint-7-ui-fidelity` · **Type**: Delta (MODIFIED)

## Purpose

Restyle the pricing page to Gemini's composition while keeping the real billing logic intact: monthly-only (no annual toggle — confirming PRC-5), Pro highlighted (emerald border + "Recomendado" badge + scale), and a billing FAQ. Checkout and portal actions (`checkoutAction`/`portalAction`) are unchanged.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| PRC-5 | Monthly-only | Implemented | MUST | Catalog stays monthly; no annual toggle and no discounted annual price (unchanged) |
| PRC-6 | Pro highlighted | Partial | MUST | Pro MUST be highlighted (emerald border + "Recomendado" badge + scale) in Gemini style |
| PRC-7 | Billing FAQ | New | MUST | A billing FAQ section MUST answer common billing questions |

### Requirement: Monthly-Only (PRC-5)

When the pricing page renders, then it MUST present monthly plans only — no annual/monthly toggle and no discounted annual price (this behavior is unchanged).

#### Scenario: No annual toggle

- GIVEN the pricing page
- WHEN it renders
- THEN only monthly pricing appears and no annual toggle is present

### Requirement: Pro Highlighted (PRC-6)

When the pricing cards render, then the Pro plan MUST be visually highlighted in Gemini style — emerald border, "Recomendado" badge, and a subtle lift/scale relative to the other cards.

#### Scenario: Pro stands out

- GIVEN the three plan cards
- WHEN they render
- THEN Pro has an emerald border, a "Recomendado" badge, and a lift/scale effect

### Requirement: Billing FAQ (PRC-7)

When the pricing page renders, then it MUST include a billing FAQ section answering common questions (billing cycle, cancellation, plan changes).

#### Scenario: FAQ answers billing questions

- GIVEN the pricing page
- WHEN a visitor expands an FAQ item
- THEN the answer addresses billing cycle/cancellation/plan changes

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| PRC-5 | No annual toggle | Covered |
| PRC-6 | Pro stands out | Covered |
| PRC-7 | FAQ answers billing questions | Covered |
