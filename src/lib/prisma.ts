import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * PrismaClient singleton + @prisma/adapter-pg (database-connection R1/R2).
 *
 * - Driver-adapter model (Prisma 7): no engine binary, no datasource url in schema;
 *   the connection string comes from DATABASE_URL at runtime.
 * - Missing/empty DATABASE_URL throws a clear, actionable error (R2) — fail fast.
 * - Singleton is cached on globalThis so Next.js dev hot-reload reuses one pool.
 */
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and configure your Supabase PostgreSQL connection string.",
    );
  }
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
