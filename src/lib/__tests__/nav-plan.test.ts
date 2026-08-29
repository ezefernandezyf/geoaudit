import { describe, expect, it, vi } from "vitest";
import { resolveNavPlan, type NavPlanPrisma } from "@/lib/nav-plan";
import { FREE_AUDIT_LIMIT } from "@/lib/audit/tier";

/**
 * U1.9 — resolveNavPlan (SHL-2): the plan pill data resolver. There is a
 * single FREE plan: `used` counts Audit rows in the 30-day window (TLM-2) and
 * `limit` is the FREE constant. No tier, no subscription counter (TLM-7/8
 * removed).
 */
function makePrisma(user: unknown): NavPlanPrisma {
  return {
    user: {
      findUnique: vi.fn(async () => user),
    },
    audit: {
      count: vi.fn(async () => 2),
    },
  } as unknown as NavPlanPrisma;
}

describe("resolveNavPlan (SHL-2)", () => {
  it("returns null when no user row exists", async () => {
    const prisma = makePrisma(null);
    expect(await resolveNavPlan(prisma, "user-1", Date.now())).toBeNull();
  });

  it("returns the FREE limit and the moving-window audit count", async () => {
    const prisma = makePrisma({ id: "user-1" });
    const plan = await resolveNavPlan(prisma, "user-1", Date.now());
    expect(plan).toEqual({ used: 2, limit: FREE_AUDIT_LIMIT });
  });

  it("never consults the tier or subscription (SHL-2, TLM-8 removed)", async () => {
    const prisma = makePrisma({ id: "user-1" });
    await resolveNavPlan(prisma, "user-1", Date.now());

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
    expect(prisma.audit.count).toHaveBeenCalledTimes(1);
  });
});
