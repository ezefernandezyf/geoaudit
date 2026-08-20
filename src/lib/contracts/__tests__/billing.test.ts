import { describe, expect, it } from "vitest";
import { Tier } from "@/generated/prisma/enums";
import {
  checkoutPlanSchema,
  subscriptionStatusSchema,
  tierSchema,
} from "@/lib/contracts/billing";

/**
 * U1.3 — billing contracts (BLG-1, design U1).
 *
 * The zod schemas in `src/lib/contracts/billing.ts` are the single source of
 * truth for plan/status values. The parity test asserts the enum values stay
 * in lock-step with the Prisma `Tier` enum (BLG-1: no divergent Plan enum).
 */

describe("tierSchema (BLG-1)", () => {
  it("accepts every Tier value", () => {
    for (const tier of [Tier.FREE, Tier.PRO, Tier.ENTERPRISE]) {
      const result = tierSchema.safeParse(tier);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(tier);
      }
    }
  });

  it("rejects an unknown tier", () => {
    const result = tierSchema.safeParse("PLATINUM");
    expect(result.success).toBe(false);
  });

  it("rejects a lowercase tier (exact enum match)", () => {
    const result = tierSchema.safeParse("pro");
    expect(result.success).toBe(false);
  });

  it("is in value parity with the Prisma Tier enum", () => {
    expect(tierSchema.options).toEqual([Tier.FREE, Tier.PRO, Tier.ENTERPRISE]);
  });
});

describe("subscriptionStatusSchema (BLG-3)", () => {
  it("accepts every Stripe lifecycle status", () => {
    const statuses = [
      "ACTIVE",
      "TRIALING",
      "PAST_DUE",
      "CANCELED",
      "UNPAID",
      "INCOMPLETE",
      "INCOMPLETE_EXPIRED",
    ];
    for (const status of statuses) {
      expect(subscriptionStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it("rejects a status outside the Stripe lifecycle", () => {
    const result = subscriptionStatusSchema.safeParse("EXPIRED");
    expect(result.success).toBe(false);
  });
});

describe("checkoutPlanSchema (BLG-5)", () => {
  it("accepts PRO and ENTERPRISE as checkout plans", () => {
    expect(checkoutPlanSchema.safeParse("PRO").success).toBe(true);
    expect(checkoutPlanSchema.safeParse("ENTERPRISE").success).toBe(true);
  });

  it("rejects FREE as a checkout plan", () => {
    const result = checkoutPlanSchema.safeParse("FREE");
    expect(result.success).toBe(false);
  });
});
