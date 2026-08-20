import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  countAuditsInWindow,
  FREE_AUDIT_LIMIT,
  FREE_AUDIT_WINDOW_MS,
  getTierLimit,
  hasFreeAuditsLeft,
  hasPaidAuditsLeft,
  isPaidTier,
  PAID_TIER_LIMITS,
  resolvePaidCounter,
} from "@/lib/audit/tier";

/**
 * U3.T1 — tier helpers (TLM-1/TLM-2, design U3).
 *
 * countAuditsInWindow is a pure function over an injected Prisma client
 * (structural `Pick<PrismaClient, "audit">`): the mock is a plain object with
 * a `count` fn, so no real DB and no Prisma runtime are involved. The test
 * asserts the EXACT Prisma query contract: COUNT of Audit rows for the user
 * with `createdAt >= now - 30 days` (TLM-2 moving window).
 */

function mockPrisma(countResult: number) {
  const count = vi.fn(async () => countResult);
  return {
    prisma: { audit: { count } },
    count,
  };
}

describe("FREE tier constants (TLM-1/TLM-2)", () => {
  it("allows exactly 3 free audits", () => {
    expect(FREE_AUDIT_LIMIT).toBe(3);
  });

  it("defines a 30-day moving window", () => {
    expect(FREE_AUDIT_WINDOW_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });
});

describe("hasFreeAuditsLeft (TLM-2)", () => {
  it("returns true while the user is under the limit", () => {
    expect(hasFreeAuditsLeft(0)).toBe(true);
    expect(hasFreeAuditsLeft(2)).toBe(true);
  });

  it("returns false once the limit is reached", () => {
    expect(hasFreeAuditsLeft(3)).toBe(false);
    expect(hasFreeAuditsLeft(7)).toBe(false);
  });
});

describe("countAuditsInWindow (TLM-2)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-18T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts Audit rows for the user with createdAt >= now - 30 days", async () => {
    const { prisma, count } = mockPrisma(2);

    const result = await countAuditsInWindow(prisma, "user-1", Date.now());

    expect(result).toBe(2);
    expect(count).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        createdAt: { gte: new Date("2026-07-19T12:00:00.000Z") },
      },
    });
  });

  it("returns the count for an empty window (triangulation: different data)", async () => {
    const { prisma, count } = mockPrisma(0);

    const result = await countAuditsInWindow(prisma, "user-2", Date.now());

    expect(result).toBe(0);
    expect(count).toHaveBeenCalledWith({
      where: {
        userId: "user-2",
        createdAt: { gte: new Date("2026-07-19T12:00:00.000Z") },
      },
    });
  });

  it("uses the caller-provided now as the window anchor", async () => {
    const { prisma, count } = mockPrisma(3);

    await countAuditsInWindow(prisma, "user-1", 1_000_000);

    expect(count).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        createdAt: { gte: new Date(1_000_000 - 30 * 24 * 60 * 60 * 1000) },
      },
    });
  });
});

/**
 * U4.1 — paid-tier helpers (TLM-2/7/8, design U4).
 *
 * Pure additions to tier.ts. `getTierLimit`/`hasPaidAuditsLeft`/`isPaidTier`
 * are total functions over the `Tier` type; `resolvePaidCounter` is the lazy
 * period-end reset (TLM-7) — NO cron.
 */
describe("PAID_TIER_LIMITS (TLM-2)", () => {
  it("grants Pro 10 audits and Enterprise 50 audits per period", () => {
    expect(PAID_TIER_LIMITS.PRO).toBe(10);
    expect(PAID_TIER_LIMITS.ENTERPRISE).toBe(50);
  });
});

describe("getTierLimit (TLM-2)", () => {
  it("returns 3 for FREE", () => {
    expect(getTierLimit("FREE")).toBe(3);
  });

  it("returns the paid limit for PRO and ENTERPRISE", () => {
    expect(getTierLimit("PRO")).toBe(10);
    expect(getTierLimit("ENTERPRISE")).toBe(50);
  });
});

describe("hasPaidAuditsLeft (TLM-2)", () => {
  it("returns true while the user is under the paid limit", () => {
    expect(hasPaidAuditsLeft(0, "PRO")).toBe(true);
    expect(hasPaidAuditsLeft(9, "PRO")).toBe(true);
    expect(hasPaidAuditsLeft(49, "ENTERPRISE")).toBe(true);
  });

  it("returns false once the paid limit is reached", () => {
    expect(hasPaidAuditsLeft(10, "PRO")).toBe(false);
    expect(hasPaidAuditsLeft(50, "ENTERPRISE")).toBe(false);
    expect(hasPaidAuditsLeft(60, "PRO")).toBe(false);
  });
});

describe("isPaidTier (TLM-8)", () => {
  it("returns true for PRO and ENTERPRISE", () => {
    expect(isPaidTier("PRO")).toBe(true);
    expect(isPaidTier("ENTERPRISE")).toBe(true);
  });

  it("returns false for FREE", () => {
    expect(isPaidTier("FREE")).toBe(false);
  });
});

describe("resolvePaidCounter (TLM-7 lazy reset)", () => {
  const NOW = 1_000_000;

  it("resets used to 0 and advances resetAt when periodEnd is in the past", () => {
    const resetAt = new Date(NOW - 5_000);
    const periodEnd = new Date(NOW - 1_000);

    const result = resolvePaidCounter(NOW, 10, resetAt, periodEnd);

    expect(result).toEqual({ used: 0, resetAt: periodEnd });
  });

  it("resets when periodEnd is exactly now (inclusive boundary)", () => {
    const periodEnd = new Date(NOW);

    const result = resolvePaidCounter(NOW, 7, null, periodEnd);

    expect(result).toEqual({ used: 0, resetAt: periodEnd });
  });

  it("keeps used and resetAt when periodEnd is in the future", () => {
    const resetAt = new Date(NOW - 5_000);
    const periodEnd = new Date(NOW + 1_000);

    const result = resolvePaidCounter(NOW, 4, resetAt, periodEnd);

    expect(result).toEqual({ used: 4, resetAt });
  });

  it("keeps used when periodEnd is null (no period boundary yet)", () => {
    const result = resolvePaidCounter(NOW, 3, null, null);

    expect(result).toEqual({ used: 3, resetAt: null });
  });
});
