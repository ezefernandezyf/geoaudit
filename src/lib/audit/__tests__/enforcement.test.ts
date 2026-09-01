import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkTierLimit } from "@/lib/audit/enforcement";

/**
 * U4.3 - enforcement (TLM-3, design decision B).
 *
 * Sprint 10 collapses enforcement to a SINGLE FREE-only gate: `checkTierLimit`
 * counts the user's `Audit` rows in the 30-day moving window and applies
 * `hasFreeAuditsLeft` - no tier lookup, no paid counter, no `recordPaidAudit`
 * (deleted with the billing capability, TLM-7/8 removed).
 *
 * The tier helpers are mocked so the tests assert the WIRING (window count →
 * `hasFreeAuditsLeft`, exact prisma surface passed through) and the TLM-3
 * block-at-10 boundary, not the helper internals (covered in tier.test.ts).
 */

const { tierHelpers } = vi.hoisted(() => ({
  tierHelpers: {
    countAuditsInWindow: vi.fn(async () => 0),
    hasFreeAuditsLeft: vi.fn(() => true),
  },
}));

vi.mock("@/lib/audit/tier", () => tierHelpers);

beforeEach(() => {
  tierHelpers.countAuditsInWindow.mockReset();
  tierHelpers.hasFreeAuditsLeft.mockReset();
  tierHelpers.countAuditsInWindow.mockResolvedValue(0);
  tierHelpers.hasFreeAuditsLeft.mockReturnValue(true);
});

describe("checkTierLimit (TLM-3, decision B)", () => {
  const NOW = 1_000_000;
  const prisma = { audit: { count: vi.fn(async () => 0) } };

  it("allows while the window count is under the FREE limit", async () => {
    tierHelpers.countAuditsInWindow.mockResolvedValue(9);
    tierHelpers.hasFreeAuditsLeft.mockReturnValue(true);

    const result = await checkTierLimit(prisma as never, "user-1", NOW);

    expect(result).toEqual({ allowed: true });
    expect(tierHelpers.countAuditsInWindow).toHaveBeenCalledWith(
      prisma,
      "user-1",
      NOW,
    );
    expect(tierHelpers.hasFreeAuditsLeft).toHaveBeenCalledWith(9);
  });

  it("blocks at the 10-audit limit (TLM-3: eleventh audit blocked)", async () => {
    tierHelpers.countAuditsInWindow.mockResolvedValue(10);
    tierHelpers.hasFreeAuditsLeft.mockReturnValue(false);

    const result = await checkTierLimit(prisma as never, "user-1", NOW);

    expect(result).toEqual({ allowed: false });
    expect(tierHelpers.hasFreeAuditsLeft).toHaveBeenCalledWith(10);
  });

  it("allows a user with no audit rows in the window (count 0 → under limit)", async () => {
    tierHelpers.countAuditsInWindow.mockResolvedValue(0);
    tierHelpers.hasFreeAuditsLeft.mockReturnValue(true);

    const result = await checkTierLimit(prisma as never, "user-2", NOW);

    expect(result).toEqual({ allowed: true });
    expect(tierHelpers.hasFreeAuditsLeft).toHaveBeenCalledWith(0);
  });
});
