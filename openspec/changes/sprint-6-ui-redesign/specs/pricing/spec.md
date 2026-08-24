# Pricing Specification (Delta)

> **Change**: `sprint-6-ui-redesign` · **Type**: Delta (MODIFIED)

## Purpose

Restyle the pricing cards and pin the plan set to monthly-only: no annual/monthly toggle and no discounted annual price. The plan catalog and CTA-by-auth-state behavior are unchanged.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| PRC-1 | Pricing page route | Partial | MUST | Restyled page; same three plans + CTA |
| PRC-5 | Monthly-only pricing | New | MUST | MUST NOT render an annual toggle or discounted annual price |

### Requirement: Pricing Page Route (PRC-1)

When a visitor opens `/pricing`, then the page MUST render the three restyled plan cards, each showing price, limit and CTA.

#### Scenario: Restyled three-plan page

- GIVEN a visitor on `/pricing`
- WHEN the page renders
- THEN Free, Pro and Enterprise cards render with price, limit and CTA in the new style

### Requirement: Monthly-only Pricing (PRC-5)

When the pricing page renders, then it MUST NOT present an annual/monthly toggle or any annual (discounted) price.

#### Scenario: No annual toggle

- GIVEN the pricing page
- WHEN rendered
- THEN only monthly prices are shown (`$0`, `$9/mes`, `$49/mes`)
- AND no annual toggle and no `-17%` discounted price appear
