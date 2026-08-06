import { defineConfig } from "prisma/config";

/**
 * Prisma 7 CLI config entry (schema + migrations paths).
 * No datasource url here on purpose: Sprint 0 uses the driver-adapter model
 * (adapter-pg supplies the connection at runtime), and `prisma generate`
 * must work without DATABASE_URL set. Migrations (S1/S3) may add
 * `datasource: { url: env("DATABASE_URL") }` when they land.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
