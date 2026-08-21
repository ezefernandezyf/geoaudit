# Billing Specification

> **Change**: `sprint-4-stripe-integration` · **Type**: New capability (ADDED)

## Purpose

Stripe billing domain (`src/billing/`): `Subscription` persistence, a lazy env-guarded Stripe client singleton, Checkout/Portal Server Actions, an idempotent signature-verified webhook, and centralized tier sync (`aplicaSubscriptionEvent`). A single `Tier` enum (FREE/PRO/ENTERPRISE) is the source of truth for both `User.tier` and `Subscription.plan` — there is no separate `Plan` enum.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| BLG-1 | Unified tier enum | New | MUST | Single `Tier` (FREE/PRO/ENTERPRISE) used by `User.tier` AND `Subscription.plan`; no separate Plan enum |
| BLG-2 | Subscription model | New | MUST | `Subscription` 1:1 `User`: stripeCustomerId (unique), stripeSubscriptionId?, plan, status, currentPeriodEnd, auditsUsed, auditsResetAt |
| BLG-3 | Subscription status enum | New | MUST | `SubscriptionStatus` enum mirroring Stripe lifecycle (ACTIVE, TRIALING, PAST_DUE, CANCELED, UNPAID, INCOMPLETE, INCOMPLETE_EXPIRED) |
| BLG-4 | Stripe client singleton | New | MUST | Lazy singleton, env-guarded: missing `STRIPE_SECRET_KEY` fails safe, never crashes |
| BLG-5 | Checkout action | New | MUST | Authed user → get/create customer → `checkout.sessions.create` (price id from env) → redirect to session URL |
| BLG-6 | Portal action | New | MUST | PRO/Enterprise → `billingPortal.sessions.create` → redirect |
| BLG-7 | Webhook signature verification | New | MUST | `runtime: nodejs`, raw body, `constructEvent` with `STRIPE_WEBHOOK_SECRET`; never trust the body |
| BLG-8 | Webhook idempotency | New | MUST | Dedupe by event id / `stripeSubscriptionId`; replays MUST NOT double-apply |
| BLG-9 | Tier sync | New | MUST | `aplicaSubscriptionEvent`: ACTIVE→PRO/ENTERPRISE (by price), canceled/expired→FREE |
| BLG-10 | Handled events | New | MUST | Process `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` |

### Requirement: Unified Tier Enum (BLG-1)

When the schema or billing domain references a plan, then it MUST use the single `Tier` enum (`FREE`/`PRO`/`ENTERPRISE`) for both `User.tier` and `Subscription.plan`, and MUST NOT introduce a divergent `Plan` enum.

#### Scenario: No divergent plan enum

- GIVEN the Prisma schema defines `User.tier` and `Subscription.plan`
- WHEN the schema is generated
- THEN both fields share the same `Tier` enum type
- AND no separate `Plan` enum exists

### Requirement: Subscription Model (BLG-2)

When the migration applies, then a `Subscription` model MUST exist in 1:1 relation with `User` carrying `stripeCustomerId` (unique), `stripeSubscriptionId` (nullable), `plan` (`Tier`), `status` (`SubscriptionStatus`), `currentPeriodEnd` (nullable), `auditsUsed` (default 0), and `auditsResetAt` (nullable).

#### Scenario: One subscription per user

- GIVEN a `User` row
- WHEN a `Subscription` is created for them
- THEN at most one `Subscription` exists per user
- AND `stripeCustomerId` is unique across all users

### Requirement: Subscription Status Enum (BLG-3)

When the webhook stores a subscription, then `Subscription.status` MUST mirror Stripe's lifecycle (`ACTIVE`, `TRIALING`, `PAST_DUE`, `CANCELED`, `UNPAID`, `INCOMPLETE`, `INCOMPLETE_EXPIRED`).

#### Scenario: Status reflects Stripe

- GIVEN a `customer.subscription.updated` event with status `past_due`
- WHEN the webhook persists it
- THEN `Subscription.status` is `PAST_DUE`

### Requirement: Stripe Client Singleton (BLG-4)

When billing code needs the Stripe SDK, then a lazy singleton MUST be used, and when `STRIPE_SECRET_KEY` is missing it MUST fail safe with a clear error rather than crash the app.

#### Scenario: Missing key fails safe

- GIVEN `STRIPE_SECRET_KEY` is not set
- WHEN a Checkout action runs
- THEN it returns an error state and does not throw an uncaught exception

### Requirement: Checkout Action (BLG-5)

When an authenticated user requests an upgrade, then a Server Action MUST resolve `auth()` → get-or-create the Stripe customer, create a `checkout.sessions.create` using the env price id for the requested plan, and redirect to `session.url`.

#### Scenario: Free user upgrades to Pro

- GIVEN an authenticated `FREE` user with a `stripeCustomerId`
- WHEN they trigger the Pro checkout action
- THEN a Checkout Session is created with `STRIPE_PRICE_PRO`
- AND the user is redirected to `session.url`

#### Scenario: Unauthenticated is rejected

- GIVEN no active session
- WHEN the checkout action runs
- THEN it returns an error and does not create a session

### Requirement: Portal Action (BLG-6)

When a PRO or Enterprise user requests subscription management, then a Server Action MUST create a `billingPortal.sessions.create` for their customer and redirect to `session.url`.

#### Scenario: Pro user opens the portal

- GIVEN an authenticated PRO user with a `stripeCustomerId`
- WHEN they trigger the portal action
- THEN a portal session is created and they are redirected

### Requirement: Webhook Signature Verification (BLG-7)

When `/api/webhooks/stripe` receives a request, then it MUST run under `runtime: nodejs`, read the raw body, verify the signature with `stripe.webhooks.constructEvent` and `STRIPE_WEBHOOK_SECRET`, and MUST NOT trust any claim in the body before verification.

#### Scenario: Invalid signature rejected

- GIVEN a request with a tampered body or wrong signature
- WHEN the webhook handler runs
- THEN it returns a non-2xx response and processes nothing

### Requirement: Webhook Idempotency (BLG-8)

When a Stripe event is delivered more than once, then the handler MUST dedupe by event id and `stripeSubscriptionId` so replays MUST NOT double-apply tier or counter changes.

#### Scenario: Duplicate event is a no-op

- GIVEN `checkout.session.completed` for a subscription already processed
- WHEN the same event id is delivered again
- THEN no tier or counter mutation occurs

### Requirement: Tier Sync (BLG-9)

When `aplicaSubscriptionEvent` runs, then an ACTIVE subscription MUST set `tier` to PRO or ENTERPRISE according to the price id, and canceled/expired statuses MUST set `tier` to FREE.

#### Scenario: Active pro maps to PRO

- GIVEN an ACTIVE subscription with price `STRIPE_PRICE_PRO`
- WHEN the sync runs
- THEN `User.tier` and `Subscription.plan` are `PRO`

#### Scenario: Canceled maps to FREE

- GIVEN a subscription transitioning to canceled
- WHEN the sync runs
- THEN `User.tier` is reset to `FREE`

### Requirement: Handled Events (BLG-10)

When the webhook dispatches, then it MUST process `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`, and MUST acknowledge other event types without error.

#### Scenario: Unrelated event is acknowledged

- GIVEN a Stripe event of an unhandled type
- WHEN the webhook receives it
- THEN it returns a 2xx acknowledgement and mutates nothing
