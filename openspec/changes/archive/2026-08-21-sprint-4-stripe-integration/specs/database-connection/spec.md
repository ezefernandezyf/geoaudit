# Database Connection Specification — Delta

> **Change**: `sprint-4-stripe-integration` · **Type**: Delta (MODIFIED)

## Purpose

The Prisma schema is no longer auth-only: it gains the `Subscription` model and the `ENTERPRISE` value on `Tier`, plus a `SubscriptionStatus` enum. The connection layer itself (R1–R3, R5–R6) is unchanged.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| R4 | Schema baseline | Partial | MUST | Schema adds `Subscription` + `SubscriptionStatus` + `Tier.ENTERPRISE`; migration applies them |
| R7 | Subscription model | New | MUST | `Subscription` 1:1 `User` with billing + monthly-counter fields |

> Unchanged and not repeated: R1, R2, R3, R5, R6.

## MODIFIED Requirements

### Requirement: Schema Baseline (R4)

**Status**: Partial

The system MUST contain a Prisma schema defining the Sprint 3 models (`User`, `Account`, `Session`, `VerificationToken`, `Audit`, `RateLimitEntry`) plus the Sprint 4 `Subscription` model, the `SubscriptionStatus` enum, and `Tier` extended with `ENTERPRISE`, and a migration MUST apply them to Supabase.

(Previously: schema defined only the Sprint 3 auth/audit models with `Tier` = FREE/PRO.)

#### Scenario: Migration applies the new model

- GIVEN `DATABASE_URL` resolves to the Supabase instance
- WHEN `pnpm run prisma:migrate` runs the Sprint 4 migration
- THEN the `Subscription` table and new enum values are created without errors

## ADDED Requirements

### Requirement: Subscription Model (R7)

**Status**: New

The system MUST define a `Subscription` model in 1:1 relation with `User` carrying `stripeCustomerId` (unique), `stripeSubscriptionId` (nullable), `plan` (typed as `Tier`), `status` (typed as `SubscriptionStatus`), `currentPeriodEnd` (nullable), `auditsUsed` (default 0), and `auditsResetAt` (nullable).

#### Scenario: Subscription links to user

- GIVEN the migrated schema
- WHEN a `Subscription` row is created
- THEN it references exactly one `User` and `stripeCustomerId` is unique
