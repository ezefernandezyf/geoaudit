# Delta for Database Connection

## MODIFIED Requirements

### Requirement: Schema Baseline (R4)

The system MUST contain a Prisma schema with the Sprint 3 data models (`User`, `Account`, `Session`, `VerificationToken`, `Audit`, `RateLimitEntry`) and a first migration that applies them to Supabase.

#### Scenario: Migration applies cleanly

- GIVEN `DATABASE_URL` resolves to the Supabase instance
- WHEN `pnpm run prisma:migrate` runs the first migration
- THEN all models are created without errors

#### Scenario: Schema generation succeeds

- GIVEN the populated Prisma schema file
- WHEN `pnpx prisma generate` is invoked
- THEN the PrismaClient is generated without errors

(Previously: the schema was empty with zero models; no migrations existed.)

## ADDED Requirements

### Requirement: Audit Model (R5)

The system MUST define an `Audit` model with a `userId` foreign key (cascade on delete), `url`, `geoScore`, `severityBand`, `durationMs`, a `result` JSON column, and `createdAt`, indexed by `(userId, createdAt desc)`.

#### Scenario: Audit row persists the full result

- GIVEN an authenticated audit completes
- WHEN it is persisted
- THEN the full `AuditResult` JSON is stored in the `result` column
- AND the row is indexed by user and creation time for history lookups

### Requirement: RateLimitEntry Model (R6)

The system MUST define a `RateLimitEntry` model keyed by `(key, windowStart)` with a `count`, supporting atomic UPSERT for the DB-backed rate limiter.

#### Scenario: Counter increments atomically

- GIVEN a `RateLimitEntry` for `(key, windowStart)`
- WHEN the limiter increments the key
- THEN the count is updated atomically without a read-modify-write race
