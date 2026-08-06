# Database Connection Specification

## Purpose

Define the database connectivity layer for GeoAudit. The system must connect to PostgreSQL (Supabase) through Prisma ORM and function gracefully when the database is not available.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| R1 | Prisma connectivity | MUST | PrismaClient singleton must connect to the DATABASE_URL PostgreSQL instance |
| R2 | Configuration validation | MUST | Missing DATABASE_URL must produce a clear, actionable error |
| R3 | Graceful startup | SHOULD | Application startup SHOULD NOT crash if the database is unreachable at boot |
| R4 | Schema baseline | MUST | An empty Prisma schema (no models yet) must be present and generate cleanly |

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

The system MUST contain an empty Prisma schema that generates without errors.

#### Scenario: Schema generation succeeds

- GIVEN the empty Prisma schema file
- WHEN `pnpx prisma generate` is invoked
- THEN the PrismaClient is generated without errors
