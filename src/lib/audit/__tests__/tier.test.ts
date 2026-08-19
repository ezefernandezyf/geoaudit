import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  countAuditsInWindow,
  FREE_AUDIT_LIMIT,
  FREE_AUDIT_WINDOW_MS,
  hasFreeAuditsLeft,
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
