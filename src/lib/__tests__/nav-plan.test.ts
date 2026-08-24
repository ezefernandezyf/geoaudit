import { describe, expect, it, vi } from "vitest";
import { resolveNavPlan, type NavPlanPrisma } from "@/lib/nav-plan";

/**
 * U1.9 — resolveNavPlan (SHL-2): the plan pill data resolver. FREE users are
 * measured by Audit rows in the 30-day window (TLM-2); paid tiers by the
 * Subscription-backed counter resolved against currentPeriodEnd (TLM-7/8).
 */
const paidUser = {
  id: "user-1",
  tier: "PRO",
  subscription: {
    plan: "PRO",
    auditsUsed: 4,
    auditsResetAt: new Date("2026-08-01T00:00:00.000Z"),
    currentPeriodEnd: new Date("2026-08-31T00:00:00.000Z"),
  },
} as const;

const freeUser = {
  id: "user-1",
  tier: "FREE",
  subscription: null,
} as const;

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

  it("returns the FREE tier limit and the moving-window audit count", async () => {
    const prisma = makePrisma(freeUser);
    const plan = await resolveNavPlan(prisma, "user-1", Date.now());
    expect(plan).toEqual({ tier: "FREE", used: 2, limit: 3 });
  });

  it("returns the paid tier limit and the subscription counter", async () => {
    const prisma = makePrisma(paidUser);
    const plan = await resolveNavPlan(prisma, "user-1", Date.now());
    expect(plan).toEqual({ tier: "PRO", used: 4, limit: 10 });
  });

  it("treats a missing subscription as zero usage for paid tiers", async () => {
    const prisma = makePrisma({
      id: "user-1",
      tier: "PRO",
      subscription: null,
    });
    const plan = await resolveNavPlan(prisma, "user-1", Date.now());
    expect(plan).toEqual({ tier: "PRO", used: 0, limit: 10 });
  });

  it("resets the paid counter lazily once currentPeriodEnd passes", async () => {
    const user = {
      id: "user-1",
      tier: "PRO",
      subscription: {
        plan: "PRO",
        auditsUsed: 9,
        auditsResetAt: new Date("2026-08-01T00:00:00.000Z"),
        currentPeriodEnd: new Date("2026-07-31T00:00:00.000Z"), // past
      },
    };
    const prisma = makePrisma(user);
    const plan = await resolveNavPlan(prisma, "user-1", Date.now());
    expect(plan).toEqual({ tier: "PRO", used: 0, limit: 10 });
  });
});
