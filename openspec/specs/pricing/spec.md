# Pricing Specification

> **Change**: `sprint-4-stripe-integration` + `sprint-7-ui-fidelity` + `sprint-8-polish-testing-backlog` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

The `/pricing` page presenting the three plans (Free $0, Pro $9/mes, Enterprise $49/mes) with their limits, plus a call-to-action that adapts to auth state and tier. This sprint does NOT add a global nav link — the page is reachable from the dashboard CTA. Since Sprint 7, the pricing page is restyled to Gemini's composition while keeping the real billing logic intact: monthly-only (no annual toggle), Pro highlighted (emerald border + "Recomendado" badge + scale), and a billing FAQ. Checkout and portal actions (`checkoutAction`/`portalAction`) are unchanged. Since Sprint 8, the page emits OpenGraph/Twitter metadata via the shared OG helper (PRC-8).

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| PRC-1 | Pricing page route | MUST | `/pricing` renders the three plans with price, limits, and a CTA |
| PRC-2 | Plan catalog | MUST | Free $0·3/30d, Pro $9/mes·10/mes, Enterprise $49/mes·50/mes |
| PRC-3 | CTA by auth state | MUST | Anonymous→sign-in; FREE→"Upgrade" (checkout); PRO/Enterprise→"Gestionar suscripción" (portal) |
| PRC-4 | Action UX states | MUST | Checkout/portal actions expose loading, success, error, and empty states |
| PRC-5 | Monthly-only | MUST | Catalog stays monthly; no annual toggle and no discounted annual price (unchanged) |
| PRC-6 | Pro highlighted | MUST | Pro MUST be highlighted (emerald border + "Recomendado" badge + scale) in Gemini style |
| PRC-7 | Billing FAQ | MUST | A billing FAQ section MUST answer common billing questions |
| PRC-8 | OG/SEO tags | MUST | `/pricing` MUST emit OpenGraph + Twitter metadata |

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

### Requirement: OG/SEO Tags (PRC-8)

When the pricing page renders, then it MUST emit OpenGraph and Twitter card metadata via the shared OG helper (reusing the default metadata with OG fields added).

#### Scenario: OG + Twitter tags present on pricing

- GIVEN the `/pricing` page
- WHEN it renders
- THEN `og:title`, `og:description`, `og:image`, and Twitter card tags are present

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| PRC-1 | Page lists three plans | Covered |
| PRC-2 | Limits match tiers | Covered |
| PRC-3 | Free user sees upgrade, Pro user sees portal | Covered |
| PRC-4 | Error is surfaced, In-flight shows loading | Covered |
| PRC-5 | No annual toggle | Covered |
| PRC-6 | Pro stands out | Covered |
| PRC-7 | FAQ answers billing questions | Covered |
| PRC-8 | OG + Twitter tags present on pricing | Covered |
