# Pricing Specification

> **Change**: `sprint-4-stripe-integration` · **Type**: New capability (ADDED)

## Purpose

The `/pricing` page presenting the three plans (Free $0, Pro $9/mes, Enterprise $49/mes) with their limits, plus a call-to-action that adapts to auth state and tier. This sprint does NOT add a global nav link — the page is reachable from the dashboard CTA.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| PRC-1 | Pricing page route | New | MUST | `/pricing` renders the three plans with price, limits, and a CTA |
| PRC-2 | Plan catalog | New | MUST | Free $0·3/30d, Pro $9/mes·10/mes, Enterprise $49/mes·50/mes |
| PRC-3 | CTA by auth state | New | MUST | Anonymous→sign-in; FREE→"Upgrade" (checkout); PRO/Enterprise→"Gestionar suscripción" (portal) |
| PRC-4 | Action UX states | New | MUST | Checkout/portal actions expose loading, success, error, and empty states |

### Requirement: Pricing Page Route (PRC-1)

When a user visits `/pricing`, then the page MUST render the three plans, each showing its price, its audit limit, and a call-to-action.

#### Scenario: Page lists three plans

- GIVEN a visitor navigates to `/pricing`
- WHEN the page renders
- THEN Free, Pro, and Enterprise cards are shown with price, limit, and CTA

### Requirement: Plan Catalog (PRC-2)

When the pricing page renders, then it MUST present the exact plans: Free `$0` with 3 audits per 30 days, Pro `$9/mes` with 10 audits per month, and Enterprise `$49/mes` with 50 audits per month.

#### Scenario: Limits match tiers

- GIVEN the pricing page
- WHEN each plan card renders
- THEN Free shows 3/30d, Pro shows 10/month, Enterprise shows 50/month

### Requirement: CTA by Auth State (PRC-3)

When the pricing page renders, then the CTA MUST adapt: anonymous visitors see a sign-in CTA, `FREE` users see an "Upgrade" CTA that starts Checkout, and PRO/Enterprise users see "Gestionar suscripción" that opens the Customer Portal.

#### Scenario: Free user sees upgrade

- GIVEN an authenticated `FREE` user
- WHEN they view `/pricing`
- THEN their CTA is "Upgrade" and it triggers the checkout action

#### Scenario: Pro user sees portal

- GIVEN an authenticated PRO user
- WHEN they view `/pricing`
- THEN their CTA is "Gestionar suscripción" and it triggers the portal action

### Requirement: Action UX States (PRC-4)

When a Checkout or Portal action runs, then the UI MUST expose loading, success (redirect), and error states, and MUST render an empty/neutral state while no action is in flight.

#### Scenario: Error is surfaced

- GIVEN the checkout action fails (e.g. missing `STRIPE_SECRET_KEY`)
- WHEN the user triggers upgrade
- THEN an error message is shown and no redirect occurs

#### Scenario: In-flight shows loading

- GIVEN a checkout/portal action is pending
- WHEN the user is waiting
- THEN a loading state is displayed until the redirect resolves
