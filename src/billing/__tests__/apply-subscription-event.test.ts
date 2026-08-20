import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  aplicaSubscriptionEvent,
  type SubscriptionSyncEvent,
  type SubscriptionTxClient,
} from "@/billing/apply-subscription-event";
import type { SubscriptionStatus, Tier } from "@/lib/contracts/billing";

/**
 * U3.1 — aplicaSubscriptionEvent tier sync (BLG-9, TLM-7, design U3).
 *
 * Pure function over a structural tx client (`SubscriptionTxClient`):
 * resolves the tier from status+price (BLG-9), upserts the `Subscription`
 * row by `stripeCustomerId` and syncs the denormalized `User.tier` ONLY when
 * it changed (TLM-7). Zero module mocks — the tx client is a fake object and
 * every assertion checks the exact upsert/update args the design specifies
 * ("assert exact upsert/update args", design testing strategy).
 */

const ENV = { pricePro: "price_pro", priceEnterprise: "price_ent" };

const upsertMock = vi.fn();
const findUserMock = vi.fn();
const updateUserMock = vi.fn();

const tx = {
  subscription: { upsert: upsertMock },
  user: { findUnique: findUserMock, update: updateUserMock },
} as unknown as SubscriptionTxClient;

/** Typed helper so tests compile against the real SubscriptionSyncEvent shape. */
function syncEvent(overrides: {
  status: SubscriptionStatus;
  priceId?: string | null;
  userId?: string;
  customerId?: string;
  currentPeriodEnd?: number | null;
}): SubscriptionSyncEvent {
  return {
    userId: overrides.userId ?? "user-1",
    customerId: overrides.customerId ?? "cus_123",
    subscriptionId: "sub_123",
    status: overrides.status,
    priceId: overrides.priceId ?? null,
    currentPeriodEnd: overrides.currentPeriodEnd ?? null,
  };
}

beforeEach(() => {
  upsertMock.mockReset();
  findUserMock.mockReset();
  updateUserMock.mockReset();
});

describe("aplicaSubscriptionEvent (BLG-9)", () => {
  it("upserts the Subscription and upgrades User.tier to PRO for ACTIVE + pro price", async () => {
    findUserMock.mockResolvedValue({ tier: "FREE" });

    await aplicaSubscriptionEvent(
      tx,
      syncEvent({ status: "ACTIVE", priceId: "price_pro" }),
      ENV,
    );

    expect(upsertMock).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_123" },
      create: {
        userId: "user-1",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        plan: "PRO",
        status: "ACTIVE",
        currentPeriodEnd: null,
      },
      update: {
        stripeSubscriptionId: "sub_123",
        plan: "PRO",
        status: "ACTIVE",
        currentPeriodEnd: null,
      },
    });
    expect(updateUserMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { tier: "PRO" },
    });
  });

  it("maps ACTIVE + enterprise price to ENTERPRISE", async () => {
    findUserMock.mockResolvedValue({ tier: "FREE" });

    await aplicaSubscriptionEvent(
      tx,
      syncEvent({ status: "ACTIVE", priceId: "price_ent" }),
      ENV,
    );

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ plan: "ENTERPRISE" as Tier }),
        update: expect.objectContaining({ plan: "ENTERPRISE" as Tier }),
      }),
    );
    expect(updateUserMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { tier: "ENTERPRISE" },
    });
  });

  it("maps TRIALING + pro price to PRO (triangulation)", async () => {
    findUserMock.mockResolvedValue({ tier: "FREE" });

    await aplicaSubscriptionEvent(
      tx,
      syncEvent({ status: "TRIALING", priceId: "price_pro" }),
      ENV,
    );

    expect(updateUserMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { tier: "PRO" },
    });
  });

  it("downgrades to FREE when the subscription is CANCELED", async () => {
    findUserMock.mockResolvedValue({ tier: "PRO" });

    await aplicaSubscriptionEvent(
      tx,
      syncEvent({ status: "CANCELED", priceId: "price_pro" }),
      ENV,
    );

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          plan: "FREE" as Tier,
          status: "CANCELED",
        }),
        update: expect.objectContaining({
          plan: "FREE" as Tier,
          status: "CANCELED",
        }),
      }),
    );
    expect(updateUserMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { tier: "FREE" },
    });
  });

  it("maps UNPAID to FREE", async () => {
    findUserMock.mockResolvedValue({ tier: "ENTERPRISE" });

    await aplicaSubscriptionEvent(
      tx,
      syncEvent({ status: "UNPAID", priceId: "price_ent" }),
      ENV,
    );

    expect(updateUserMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { tier: "FREE" },
    });
  });

  it("maps INCOMPLETE_EXPIRED to FREE", async () => {
    findUserMock.mockResolvedValue({ tier: "ENTERPRISE" });

    await aplicaSubscriptionEvent(
      tx,
      syncEvent({ status: "INCOMPLETE_EXPIRED", priceId: "price_pro" }),
      ENV,
    );

    expect(updateUserMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { tier: "FREE" },
    });
  });

  it("never grants a paid tier for an unknown price (ACTIVE → FREE)", async () => {
    findUserMock.mockResolvedValue({ tier: "PRO" });

    await aplicaSubscriptionEvent(
      tx,
      syncEvent({ status: "ACTIVE", priceId: "price_unknown" }),
      ENV,
    );

    expect(updateUserMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { tier: "FREE" },
    });
  });

  it("does NOT update User.tier when it already matches (TLM-7)", async () => {
    findUserMock.mockResolvedValue({ tier: "PRO" });

    await aplicaSubscriptionEvent(
      tx,
      syncEvent({ status: "ACTIVE", priceId: "price_pro" }),
      ENV,
    );

    expect(upsertMock).toHaveBeenCalled();
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("converts Stripe epoch seconds to a Date for currentPeriodEnd", async () => {
    findUserMock.mockResolvedValue({ tier: "FREE" });

    await aplicaSubscriptionEvent(
      tx,
      syncEvent({
        status: "ACTIVE",
        priceId: "price_pro",
        currentPeriodEnd: 1_800_000_000,
      }),
      ENV,
    );

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          currentPeriodEnd: new Date(1_800_000_000 * 1000),
        }),
        update: expect.objectContaining({
          currentPeriodEnd: new Date(1_800_000_000 * 1000),
        }),
      }),
    );
  });

  it("upserts by stripeCustomerId regardless of the user id (BLG-2 unique)", async () => {
    findUserMock.mockResolvedValue({ tier: "FREE" });

    await aplicaSubscriptionEvent(
      tx,
      syncEvent({
        status: "ACTIVE",
        priceId: "price_pro",
        customerId: "cus_999",
      }),
      ENV,
    );

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeCustomerId: "cus_999" },
      }),
    );
  });
});
