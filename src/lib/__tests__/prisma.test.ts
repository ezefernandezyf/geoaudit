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

describe("prisma connectivity failure (database-connection R1-S2)", () => {
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

  // R1-S2: GIVEN DATABASE_URL points to an unreachable host, WHEN PrismaClient
  // attempts to connect, THEN it rejects with a network error. Always runs.
  //
  // Empirical contract of this stack (Prisma 7 + @prisma/adapter-pg + pg 8.22):
  // - $connect() is a lifecycle no-op with driver adapters (connection is lazy),
  //   so the test forces the real connection attempt through the first query.
  // - pg-connection-string 2.14 drops `connect_timeout` from the URL (it is not
  //   mapped to connectionTimeoutMillis), so RFC 5737 TEST-NET-1 192.0.2.1 hangs
  //   for the full OS TCP retry window (~2 min) — unusable in CI.
  // - The reachable loopback host with a closed port (127.0.0.1:1) fails in ~6ms
  //   with ECONNREFUSED, which the adapter classifies as DatabaseNotReachable and
  //   Prisma surfaces as PrismaClientKnownRequestError P2010 whose message says
  //   "Can't reach database server" (the classic P1001 text). Same network-error
  //   contract as the scenario, deterministic, and independent of DNS/env.
  it("rejects with a network error when DATABASE_URL points to an unreachable host", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@127.0.0.1:1/geoaudit";
    const { prisma } = await import("@/lib/prisma");
    const attempt = prisma.$queryRaw`SELECT 1`;
    await expect(attempt).rejects.toMatchObject({
      code: "P2010",
      meta: {
        driverAdapterError: { cause: { kind: "DatabaseNotReachable" } },
      },
    });
    await expect(attempt).rejects.toThrow(/Can't reach database server/);
  }, 15_000);
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
