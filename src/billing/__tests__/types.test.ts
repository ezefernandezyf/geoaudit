import { describe, expect, it } from "vitest";
import { resolveTier, type NormalizedSubscriptionEvent } from "@/billing/types";
import type { SubscriptionStatus, Tier } from "@/lib/contracts/billing";

/**
 * U1.7 — billing types (BLG-9, design U1).
 *
 * `resolveTier` is the pure priceId→Tier mapping the webhook tier sync will
 * use (U3.2). BLG-9: ACTIVE/TRIALING map to PRO/ENTERPRISE by price id,
 * canceled/expired statuses map to FREE, unknown price maps to FREE.
 */

const ENV = { pricePro: "price_pro", priceEnterprise: "price_ent" };

/** Typed helper so the tests compile against the real NormalizedSubscriptionEvent shape. */
function event(overrides: {
  status: SubscriptionStatus;
  priceId?: string | null;
}): NormalizedSubscriptionEvent {
  return {
    customerId: "cus_123",
    subscriptionId: "sub_123",
    status: overrides.status,
    priceId: overrides.priceId ?? null,
    currentPeriodEnd: null,
  };
}

describe("resolveTier (BLG-9)", () => {
  it("maps ACTIVE + PRO price to PRO", () => {
    expect(resolveTier("ACTIVE", "price_pro", ENV)).toBe<Tier>("PRO");
  });

  it("maps ACTIVE + ENTERPRISE price to ENTERPRISE", () => {
    expect(resolveTier("ACTIVE", "price_ent", ENV)).toBe<Tier>("ENTERPRISE");
  });

  it("maps TRIALING + PRO price to PRO", () => {
    expect(resolveTier("TRIALING", "price_pro", ENV)).toBe<Tier>("PRO");
  });

  it("maps ACTIVE + unknown price to FREE", () => {
    expect(resolveTier("ACTIVE", "price_unknown", ENV)).toBe<Tier>("FREE");
    expect(resolveTier("ACTIVE", null, ENV)).toBe<Tier>("FREE");
  });

  it("maps CANCELED to FREE regardless of price", () => {
    expect(resolveTier("CANCELED", "price_pro", ENV)).toBe<Tier>("FREE");
  });

  it("maps UNPAID and INCOMPLETE_EXPIRED to FREE", () => {
    expect(resolveTier("UNPAID", "price_ent", ENV)).toBe<Tier>("FREE");
    expect(resolveTier("INCOMPLETE_EXPIRED", "price_pro", ENV)).toBe<Tier>(
      "FREE",
    );
  });

  it("maps non-active statuses to FREE (PAST_DUE, INCOMPLETE)", () => {
    expect(resolveTier("PAST_DUE", "price_pro", ENV)).toBe<Tier>("FREE");
    expect(resolveTier("INCOMPLETE", "price_ent", ENV)).toBe<Tier>("FREE");
  });
});

describe("NormalizedSubscriptionEvent", () => {
  it("carries the webhook fields the tier sync needs", () => {
    const normalized = event({ status: "ACTIVE", priceId: "price_pro" });

    expect(normalized.customerId).toBe("cus_123");
    expect(normalized.subscriptionId).toBe("sub_123");
    expect(normalized.status).toBe("ACTIVE");
    expect(normalized.priceId).toBe("price_pro");
    expect(normalized.currentPeriodEnd).toBeNull();
  });
});
