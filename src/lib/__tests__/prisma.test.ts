import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_URL = process.env.DATABASE_URL;
const globalForPrisma = globalThis as unknown as { prisma?: unknown };

describe("prisma singleton (database-connection R2)", () => {
  beforeEach(() => {
    vi.resetModules();
    delete globalForPrisma.prisma;
  });

  afterEach(() => {
    if (ORIGINAL_URL === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = ORIGINAL_URL;
    }
  });

  it("throws a clear error mentioning DATABASE_URL when it is missing", async () => {
    delete process.env.DATABASE_URL;
    await expect(import("@/lib/prisma")).rejects.toThrow(/DATABASE_URL/);
  });

  it("exports a singleton prisma instance when DATABASE_URL is set", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/geoaudit";
    const modA = await import("@/lib/prisma");
    const modB = await import("@/lib/prisma");
    expect(modA.prisma).toBe(modB.prisma);
  });
});

// Integration pair for database-connection R1/R3: runs only when a real
// DATABASE_URL is provided (proposal risk: "Supabase creds unavailable" →
// skip-if-no-env, verified in Sprint 1). Without env this suite is skipped.
const dbUrl = process.env.DATABASE_URL;
const describeConnectivity = dbUrl ? describe : describe.skip;

describeConnectivity(
  "prisma connectivity (requires DATABASE_URL; verified in Sprint 1)",
  () => {
    it("connects and disconnects with valid credentials", async () => {
      const { prisma } = await import("@/lib/prisma");
      await expect(prisma.$connect()).resolves.toBeUndefined();
      await prisma.$disconnect();
    });
  },
);
