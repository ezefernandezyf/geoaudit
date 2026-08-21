# Dashboard Specification — Delta

> **Change**: `sprint-4-stripe-integration` · **Type**: Delta (MODIFIED)

## Purpose

Add a billing call-to-action to the dashboard: `FREE` users see an "Upgrade" CTA linking to `/pricing`, and PRO/Enterprise users see "Gestionar suscripción" linking to the Stripe Customer Portal. No global nav link is introduced this sprint.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| DSH-6 | Billing CTA | New | MUST | Dashboard shows "Upgrade" (FREE→/pricing) or "Gestionar suscripción" (PRO/Enterprise→portal) |

> Unchanged and not repeated: DSH-1..DSH-5.

## ADDED Requirements

### Requirement: Billing CTA (DSH-6)

**Status**: New

When the dashboard renders for an authenticated user, then it MUST show a billing CTA that adapts to tier: `FREE` shows "Upgrade" linking to `/pricing`, and PRO/Enterprise show "Gestionar suscripción" triggering the Customer Portal action.

#### Scenario: Free user sees upgrade CTA

- GIVEN an authenticated `FREE` user
- WHEN the dashboard renders
- THEN an "Upgrade" CTA is shown linking to `/pricing`

#### Scenario: Pro user sees manage CTA

- GIVEN an authenticated PRO or Enterprise user
- WHEN the dashboard renders
- THEN a "Gestionar suscripción" CTA is shown and it triggers the portal action
