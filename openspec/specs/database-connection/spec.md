# Database Connection Specification

> **Change**: `sprint-2-free-audit-flow` + `sprint-3-auth-dashboard` + `sprint-4-stripe-integration` + `sprint-5-pro-features` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

Define the database connectivity layer for GeoAudit. The system must connect to PostgreSQL (Supabase) through Prisma ORM and function gracefully when the database is not available.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| R1 | Prisma connectivity | MUST | PrismaClient singleton must connect to the DATABASE_URL PostgreSQL instance |
| R2 | Configuration validation | MUST | Missing DATABASE_URL must produce a clear, actionable error |
| R3 | Graceful startup | SHOULD | Application startup SHOULD NOT crash if the database is unreachable at boot |
| R4 | Schema baseline | MUST | Prisma schema must define the Sprint 3 data models (`User`, `Account`, `Session`, `VerificationToken`, `Audit`, `RateLimitEntry`) plus the Sprint 4 `Subscription` model, `SubscriptionStatus` enum, and `Tier.ENTERPRISE`, plus the Sprint 5 `AuditPage` model and `Audit.shareToken`, and a migration must apply them to Supabase |
| R5 | Audit model | MUST | `Audit` must store the full result JSON per authenticated audit with a nullable unique `shareToken`, indexed by user and creation time |
| R6 | RateLimitEntry model | MUST | `RateLimitEntry` must be keyed by `(key, windowStart)` with a `count`, supporting atomic UPSERT |
| R7 | Subscription model | MUST | `Subscription` 1:1 `User` with billing + monthly-counter fields |
| R8 | AuditPage model | MUST | `AuditPage` MUST be 1:N with `Audit` (one master + N pages) |

### Requirement: Prisma Connectivity (R1)

The system MUST expose a detected PrismaClient singleton that connects to the DATABASE_URL PostgreSQL instance.

#### Scenario: Client connects with valid credentials

- GIVEN DATABASE_URL is set to a reachable PostgreSQL instance
- WHEN PrismaClient connects
- THEN `prisma.$connect()` resolves successfully
- AND `prisma.$disconnect()` closes the connection

#### Scenario: Client connection times out on unreachable host

- GIVEN DATABASE_URL points to an unreachable host
- WHEN PrismaClient attempts to connect
- THEN `prisma.$connect()` rejects with a network error

### Requirement: Configuration Validation (R2)

The system MUST fail fast with a clear message when DATABASE_URL is missing.

#### Scenario: Missing DATABASE_URL is detected

- GIVEN DATABASE_URL is not set or is empty
- WHEN PrismaClient is initialized
- THEN an error message mentions DATABASE_URL
- AND the error is surfaced during development startup

### Requirement: Graceful Startup (R3)

The application SHOULD start even when the database is unreachable.

#### Scenario: App boots without database

- GIVEN the database is unreachable at startup
- WHEN `pnpm dev` is invoked
- THEN the application serves pages that do not depend on the database
- AND database-dependent features return an appropriate error or empty state

### Requirement: Schema Baseline (R4)

The system MUST contain a Prisma schema with the Sprint 3 data models (`User`, `Account`, `Session`, `VerificationToken`, `Audit`, `RateLimitEntry`), the Sprint 4 `Subscription` model, the `SubscriptionStatus` enum, `Tier` extended with `ENTERPRISE`, and the Sprint 5 additions (`AuditPage` model, `Audit.shareToken`), with a migration that applies them to Supabase.

#### Scenario: Migration applies cleanly

- GIVEN `DATABASE_URL` resolves to the Supabase instance
- WHEN `pnpm run prisma:migrate` runs the first migration
- THEN all models are created without errors

#### Scenario: Sprint 5 migration applies

- GIVEN `DATABASE_URL` resolves to the Supabase instance
- WHEN `pnpm run prisma:migrate` runs the Sprint 5 migration
- THEN the `AuditPage` table and `Audit.shareToken` column are created without errors

#### Scenario: Schema generation succeeds

- GIVEN the populated Prisma schema file
- WHEN `pnpx prisma generate` is invoked
- THEN the PrismaClient is generated without errors

### Requirement: Audit Model (R5)

The system MUST define an `Audit` model with a `userId` foreign key (cascade on delete), `url`, `geoScore`, `severityBand`, `durationMs`, a `result` JSON column, a nullable unique `shareToken` (`String? @unique`), and `createdAt`, indexed by `(userId, createdAt desc)`.

#### Scenario: Audit row persists the full result

- GIVEN an authenticated audit completes
- WHEN it is persisted
- THEN the full `AuditResult` JSON is stored in the `result` column
- AND the row is indexed by user and creation time for history lookups

#### Scenario: shareToken is nullable unique

- GIVEN the migrated schema
- WHEN a share link is created or revoked
- THEN `shareToken` holds a unique value or null

### Requirement: RateLimitEntry Model (R6)

The system MUST define a `RateLimitEntry` model keyed by `(key, windowStart)` with a `count`, supporting atomic UPSERT for the DB-backed rate limiter.

#### Scenario: Counter increments atomically

- GIVEN a `RateLimitEntry` for `(key, windowStart)`
- WHEN the limiter increments the key
- THEN the count is updated atomically without a read-modify-write race

### Requirement: Subscription Model (R7)

The system MUST define a `Subscription` model in 1:1 relation with `User` carrying `stripeCustomerId` (unique), `stripeSubscriptionId` (nullable), `plan` (typed as `Tier`), `status` (typed as `SubscriptionStatus`), `currentPeriodEnd` (nullable), `auditsUsed` (default 0), and `auditsResetAt` (nullable).

#### Scenario: Subscription links to user

- GIVEN the migrated schema
- WHEN a `Subscription` row is created
- THEN it references exactly one `User` and `stripeCustomerId` is unique

### Requirement: AuditPage Model (R8)

When the migration applies, then an `AuditPage` model MUST exist in 1:N relation with `Audit` (one master `Audit` → many `AuditPage` rows), each page storing its own URL and per-page result.

#### Scenario: One master, many pages

- GIVEN a multi-page audit with 4 pages
- WHEN it is persisted
- THEN one `Audit` row and four `AuditPage` rows are written
- AND each `AuditPage` references the master `Audit`
