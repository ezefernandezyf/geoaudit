import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkTierLimit, recordPaidAudit } from "@/lib/audit/enforcement";

/**
 * U4.3 — enforcement (TLM-3/7/8, design U4).
 *
 * `checkTierLimit` and `recordPaidAudit` are pure orchestrations over injected
 * structural prisma clients; the tier helpers are mocked so the tests assert
 * the SELECTION wiring (FREE window vs paid counter — TLM-8) and the exact
 * prisma update args (TLM-7), not the helper internals (covered in
 * tier.test.ts).
 */

const { tierHelpers } = vi.hoisted(() => ({
  tierHelpers: {
    countAuditsInWindow: vi.fn(async () => 0),
    hasFreeAuditsLeft: vi.fn(() => true),
    hasPaidAuditsLeft: vi.fn(() => true),
    isPaidTier: vi.fn(() => false),
    resolvePaidCounter: vi.fn(
      (_now: number, used: number, resetAt: Date | null) => ({ used, resetAt }),
    ),
  },
}));

vi.mock("@/lib/audit/tier", () => tierHelpers);

beforeEach(() => {
  tierHelpers.countAuditsInWindow.mockReset();
  tierHelpers.hasFreeAuditsLeft.mockReset();
  tierHelpers.hasPaidAuditsLeft.mockReset();
  tierHelpers.isPaidTier.mockReset();
  tierHelpers.resolvePaidCounter.mockReset();
  tierHelpers.countAuditsInWindow.mockResolvedValue(0);
  tierHelpers.hasFreeAuditsLeft.mockReturnValue(true);
  tierHelpers.hasPaidAuditsLeft.mockReturnValue(true);
  tierHelpers.isPaidTier.mockReturnValue(false);
  tierHelpers.resolvePaidCounter.mockImplementation((_now, used, resetAt) => ({
    used,
    resetAt,
  }));
});

describe("checkTierLimit (TLM-3/8)", () => {
  const NOW = 1_000_000;

  it("FREE: uses the 30-day window and hasFreeAuditsLeft", async () => {
    tierHelpers.isPaidTier.mockReturnValue(false);
    tierHelpers.countAuditsInWindow.mockResolvedValue(2);
    tierHelpers.hasFreeAuditsLeft.mockReturnValue(true);

    const prisma = {
      user: { findUnique: vi.fn(async () => ({ id: "user-1", tier: "FREE" })) },
    };

    const result = await checkTierLimit(prisma as never, "user-1", NOW);

    expect(result).toEqual({ allowed: true });
    expect(tierHelpers.countAuditsInWindow).toHaveBeenCalledWith(
      prisma,
      "user-1",
      NOW,
    );
    expect(tierHelpers.hasFreeAuditsLeft).toHaveBeenCalledWith(2);
  });

  it("FREE: blocks when the window count reached the limit", async () => {
    tierHelpers.isPaidTier.mockReturnValue(false);
    tierHelpers.countAuditsInWindow.mockResolvedValue(3);
    tierHelpers.hasFreeAuditsLeft.mockReturnValue(false);

    const prisma = {
      user: { findUnique: vi.fn(async () => ({ id: "user-1", tier: "FREE" })) },
    };

    const result = await checkTierLimit(prisma as never, "user-1", NOW);

    expect(result).toEqual({ allowed: false });
    expect(tierHelpers.resolvePaidCounter).not.toHaveBeenCalled();
  });

  it("PRO: resolves the paid counter and uses hasPaidAuditsLeft", async () => {
    tierHelpers.isPaidTier.mockReturnValue(true);
    tierHelpers.resolvePaidCounter.mockReturnValue({ used: 9, resetAt: null });
    tierHelpers.hasPaidAuditsLeft.mockReturnValue(true);

    const subscription = {
      plan: "PRO",
      auditsUsed: 9,
      auditsResetAt: null,
      currentPeriodEnd: null,
    };
    const prisma = {
      user: {
        findUnique: vi.fn(async () => ({
          id: "user-1",
          tier: "PRO",
          subscription,
        })),
      },
    };

    const result = await checkTierLimit(prisma as never, "user-1", NOW);

    expect(result).toEqual({ allowed: true });
    expect(tierHelpers.isPaidTier).toHaveBeenCalledWith("PRO");
    expect(tierHelpers.resolvePaidCounter).toHaveBeenCalledWith(
      NOW,
      9,
      null,
      null,
    );
    expect(tierHelpers.hasPaidAuditsLeft).toHaveBeenCalledWith(9, "PRO");
    expect(tierHelpers.countAuditsInWindow).not.toHaveBeenCalled();
  });

  it("PRO: blocks when the paid counter reached the limit", async () => {
    tierHelpers.isPaidTier.mockReturnValue(true);
    tierHelpers.resolvePaidCounter.mockReturnValue({ used: 10, resetAt: null });
    tierHelpers.hasPaidAuditsLeft.mockReturnValue(false);

    const prisma = {
      user: {
        findUnique: vi.fn(async () => ({
          id: "user-1",
          tier: "PRO",
          subscription: {
            plan: "PRO",
            auditsUsed: 10,
            auditsResetAt: null,
            currentPeriodEnd: null,
          },
        })),
      },
    };

    const result = await checkTierLimit(prisma as never, "user-1", NOW);

    expect(result).toEqual({ allowed: false });
  });
});

describe("recordPaidAudit (TLM-7)", () => {
  const NOW = 1_000_000;

  it("increments auditsUsed and sets auditsResetAt after resolving the counter", async () => {
    const resetAt = new Date(NOW + 5_000);
    tierHelpers.resolvePaidCounter.mockReturnValue({
      used: 3,
      resetAt: resetAt,
    });

    const update = vi.fn(async () => ({}));
    const tx = {
      subscription: {
        findUnique: vi.fn(async () => ({
          plan: "PRO",
          auditsUsed: 3,
          auditsResetAt: resetAt,
          currentPeriodEnd: new Date(NOW + 10_000),
        })),
        update,
      },
    };

    await recordPaidAudit(tx as never, "user-1", NOW);

    expect(tierHelpers.resolvePaidCounter).toHaveBeenCalledWith(
      NOW,
      3,
      resetAt,
      new Date(NOW + 10_000),
    );
    expect(update).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: {
        auditsUsed: { increment: 1 },
        auditsResetAt: resetAt,
      },
    });
  });

  it("resets the counter to 0 and advances resetAt when the period ended", async () => {
    const periodEnd = new Date(NOW - 1_000);
    tierHelpers.resolvePaidCounter.mockReturnValue({
      used: 0,
      resetAt: periodEnd,
    });

    const update = vi.fn(async () => ({}));
    const tx = {
      subscription: {
        findUnique: vi.fn(async () => ({
          plan: "PRO",
          auditsUsed: 10,
          auditsResetAt: new Date(NOW - 5_000),
          currentPeriodEnd: periodEnd,
        })),
        update,
      },
    };

    await recordPaidAudit(tx as never, "user-1", NOW);

    expect(tierHelpers.resolvePaidCounter).toHaveBeenCalledWith(
      NOW,
      10,
      new Date(NOW - 5_000),
      periodEnd,
    );
    expect(update).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: {
        auditsUsed: { increment: 1 },
        auditsResetAt: periodEnd,
      },
    });
  });
});
