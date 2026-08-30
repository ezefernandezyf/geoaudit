# Database Connection Delta

> **Change**: `sprint-10-free-mode` · **Type**: Delta (MODIFIED)

## Purpose

Drop the Stripe/billing schema. A new down-migration removes the `Subscription` model, the `StripeWebhookEvent` model, the `Tier` and `SubscriptionStatus` enums, and `User.tier`/`User.subscription`. `Audit`, `AuditPage`, `RateLimitEntry`, and the auth models are unchanged.

## MODIFIED Requirements

### Requirement: Schema Baseline (R4)

The system MUST contain a Prisma schema with the data models `User`, `Account`, `Session`, `VerificationToken`, `Audit`, `AuditPage`, and `RateLimitEntry`, with a migration that applies them to Supabase. The schema MUST NOT contain `Subscription`, `StripeWebhookEvent`, the `SubscriptionStatus` enum, or the `Tier` enum. A down-migration MUST drop those billing models/enums and the `User.tier`/`User.subscription` columns.

(Previously: the schema included the Sprint 4 `Subscription` model, `SubscriptionStatus` enum, and `Tier.ENTERPRISE`.)

#### Scenario: Migration applies cleanly

- GIVEN `DATABASE_URL` resolves to the Supabase instance
- WHEN `pnpm run prisma:migrate` runs the migration
- THEN all non-billing models are created without errors

#### Scenario: Down-migration drops billing schema

- GIVEN a database with the Sprint 4 billing schema applied
- WHEN the Sprint 10 down-migration runs
- THEN `Subscription` and `StripeWebhookEvent` tables are dropped
- AND the `Tier` and `SubscriptionStatus` enums are dropped
- AND `User.tier` and `User.subscription` columns are removed

#### Scenario: Schema generation succeeds

- GIVEN the populated Prisma schema file
- WHEN `pnpx prisma generate` is invoked
- THEN the PrismaClient is generated without errors

## REMOVED Requirements

### Requirement: Subscription Model (R7)

(Reason: The `Subscription` model is dropped by the Sprint 10 down-migration; no billing counter remains.)
(Migration: Audit limits are counted from `Audit` rows, per `tier-limits` TLM-2.)
