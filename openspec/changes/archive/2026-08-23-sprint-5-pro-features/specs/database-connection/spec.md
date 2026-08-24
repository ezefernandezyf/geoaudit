# Database Connection Delta

> **Change**: `sprint-5-pro-features` · **Type**: Delta (MODIFIED)

## Purpose

Extend the Prisma schema with the Sprint 5 additions: `Audit.shareToken` (nullable unique) and the new `AuditPage` model (1:N with `Audit`), applied via an additive migration.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| R4 | Schema baseline | Partial | MUST | Add `AuditPage` model and `Audit.shareToken` to the schema baseline |
| R5 | Audit model | Partial | MUST | `Audit` gains `shareToken String? @unique` |
| R8 | AuditPage model | New | MUST | `AuditPage` MUST be 1:N with `Audit` (one master + N pages) |

### Requirement: Schema Baseline (R4)

The system MUST contain a Prisma schema with the Sprint 3 data models (`User`, `Account`, `Session`, `VerificationToken`, `Audit`, `RateLimitEntry`), the Sprint 4 `Subscription` model, the `SubscriptionStatus` enum, `Tier` extended with `ENTERPRISE`, and the Sprint 5 additions (`AuditPage` model, `Audit.shareToken`), with a migration that applies them to Supabase.

(Previously: schema baseline ended at Sprint 4 models.)

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

(Previously: `Audit` had no `shareToken`.)

#### Scenario: Audit row persists the full result

- GIVEN an authenticated audit completes
- WHEN it is persisted
- THEN the full `AuditResult` JSON is stored in the `result` column
- AND the row is indexed by user and creation time for history lookups

#### Scenario: shareToken is nullable unique

- GIVEN the migrated schema
- WHEN a share link is created or revoked
- THEN `shareToken` holds a unique value or null

### Requirement: AuditPage Model (R8)

When the migration applies, then an `AuditPage` model MUST exist in 1:N relation with `Audit` (one master `Audit` → many `AuditPage` rows), each page storing its own URL and per-page result.

#### Scenario: One master, many pages

- GIVEN a multi-page audit with 4 pages
- WHEN it is persisted
- THEN one `Audit` row and four `AuditPage` rows are written
- AND each `AuditPage` references the master `Audit`
