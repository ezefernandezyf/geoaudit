import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 CLI config entry (schema + migrations paths).
 *
 * - The runtime client uses the driver-adapter model (adapter-pg supplies the
 *   connection at runtime, src/lib/prisma.ts). `datasource.url` here is used
 *   ONLY by CLI commands that need a direct connection (`migrate`, `db push`).
 * - Prisma 7 removed `url` from the schema datasource block and does NOT
 *   auto-load `.env`, so this file imports `dotenv/config` and reads the URL
 *   lazily: `prisma generate` keeps working when DATABASE_URL is unset (CI
 *   has no secrets), while `migrate` fails loudly without it.
 * - Migrations prefer `DIRECT_DATABASE_URL` (session pooler, port 5432 +
 *   `pgbouncer=true`): Prisma Migrate hangs on the transaction pooler (6543),
 *   which is only suitable for runtime queries. `DATABASE_URL` remains the
 *   runtime connection and the CLI fallback.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL,
  },
  migrations: {
    path: "prisma/migrations",
  },
});
