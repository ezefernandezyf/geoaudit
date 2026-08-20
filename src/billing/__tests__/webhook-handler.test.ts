import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import {
  handleStripeEvent,
  type WebhookPrisma,
} from "@/billing/webhook-handler";

/**
 * The tier sync is mocked so this file asserts the WIRING (dispatch +
 * idempotency), not the pure function — it has its own U3.1 suite. The mock
 * must be hoisted: vi.mock factories run above the imports, so a plain
 * `vi.fn()` declared here would be a DIFFERENT function than the one the
 * factory installs (same trap as `rate-limit/__tests__/index.test.ts` and
 * `billing/__tests__/actions.test.ts`).
 */
const { aplicaSubscriptionEventMock } = vi.hoisted(() => ({
  aplicaSubscriptionEventMock: vi.fn(async () => undefined),
}));

vi.mock("@/billing/apply-subscription-event", () => ({
  aplicaSubscriptionEvent: aplicaSubscriptionEventMock,
}));

/**
 * U3.3 — webhook handler (BLG-8/10, design U3).
 *
 * `handleStripeEvent(prisma, stripe, event)` is the exactly-once gate +
 * dispatcher:
 *  - Idempotency (BLG-8): `stripeWebhookEvent.create` first; a P2002 (event
 *    id already recorded) is a replay → `{processed:false}`, zero mutation.
 *  - Dispatch (BLG-10): `checkout.session.completed` resolves userId from
 *    `client_reference_id` and expands the subscription; subscription
 *    events build from `event.data.object`; unhandled types are acked
 *    without mutating anything.
 *  - Each handled type calls `aplicaSubscriptionEvent` inside
 *    `prisma.$transaction` (mocked here — the pure function has its own
 *    U3.1 suite; this file asserts the WIRING).
 */

const createEventMock = vi.fn();
const findSubscriptionMock = vi.fn();
const transactionMock = vi.fn();
const retrieveSessionMock = vi.fn();
const applyMock = aplicaSubscriptionEventMock;

const stripe = {
  checkout: { sessions: { retrieve: retrieveSessionMock } },
} as unknown as Stripe;

const txClient = { subscription: {}, user: {} };

const prisma = {
  stripeWebhookEvent: { create: createEventMock },
  subscription: { findUnique: findSubscriptionMock },
  $transaction: transactionMock,
} as unknown as WebhookPrisma;

function rawEvent(type: string, object: unknown, id = "evt_1"): Stripe.Event {
  return { id, type, data: { object } } as unknown as Stripe.Event;
}

beforeEach(() => {
  createEventMock.mockReset();
  findSubscriptionMock.mockReset();
  transactionMock.mockReset();
  retrieveSessionMock.mockReset();
  applyMock.mockReset();
  transactionMock.mockImplementation(
    async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => fn(txClient),
  );
  vi.stubEnv("STRIPE_PRICE_PRO", "price_pro");
  vi.stubEnv("STRIPE_PRICE_ENTERPRISE", "price_ent");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("handleStripeEvent (BLG-8 idempotency)", () => {
  it("records the event id first, then dispatches checkout.session.completed", async () => {
    createEventMock.mockResolvedValue({ id: "evt_1" });
    retrieveSessionMock.mockResolvedValue({
      id: "cs_1",
      client_reference_id: "user-1",
      subscription: {
        id: "sub_123",
        customer: "cus_1",
        status: "active",
        items: {
          data: [
            {
              price: { id: "price_pro" },
              current_period_end: 1_800_000_000,
            },
          ],
        },
      },
    });

    const result = await handleStripeEvent(
      prisma,
      stripe,
      rawEvent("checkout.session.completed", {
        id: "cs_1",
        client_reference_id: "user-1",
      }),
    );

    expect(result).toEqual({ processed: true });
    expect(createEventMock).toHaveBeenCalledWith({
      data: { id: "evt_1", type: "checkout.session.completed" },
    });
    expect(retrieveSessionMock).toHaveBeenCalledWith("cs_1", {
      expand: ["subscription"],
    });
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(applyMock).toHaveBeenCalledWith(
      txClient,
      {
        userId: "user-1",
        customerId: "cus_1",
        subscriptionId: "sub_123",
        status: "ACTIVE",
        priceId: "price_pro",
        currentPeriodEnd: 1_800_000_000,
      },
      { pricePro: "price_pro", priceEnterprise: "price_ent" },
    );
  });

  it("returns {processed:false} and mutates NOTHING on a duplicate event id (P2002)", async () => {
    createEventMock.mockRejectedValue(
      Object.assign(new Error("Unique constraint failed"), { code: "P2002" }),
    );

    const result = await handleStripeEvent(
      prisma,
      stripe,
      rawEvent("checkout.session.completed", { id: "cs_1" }),
    );

    expect(result).toEqual({ processed: false });
    expect(retrieveSessionMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
    expect(applyMock).not.toHaveBeenCalled();
  });
});

describe("handleStripeEvent (BLG-10 dispatch)", () => {
  it("dispatches customer.subscription.updated from event.data.object", async () => {
    createEventMock.mockResolvedValue({ id: "evt_2" });
    findSubscriptionMock.mockResolvedValue({ userId: "user-9" });

    const result = await handleStripeEvent(
      prisma,
      stripe,
      rawEvent(
        "customer.subscription.updated",
        {
          id: "sub_9",
          customer: "cus_9",
          status: "past_due",
          items: {
            data: [
              {
                price: { id: "price_ent" },
                current_period_end: 1_800_000_000,
              },
            ],
          },
        },
        "evt_2",
      ),
    );

    expect(result).toEqual({ processed: true });
    expect(findSubscriptionMock).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_9" },
    });
    expect(applyMock).toHaveBeenCalledWith(
      txClient,
      {
        userId: "user-9",
        customerId: "cus_9",
        subscriptionId: "sub_9",
        status: "PAST_DUE",
        priceId: "price_ent",
        currentPeriodEnd: 1_800_000_000,
      },
      { pricePro: "price_pro", priceEnterprise: "price_ent" },
    );
  });

  it("dispatches customer.subscription.deleted as a FREE downgrade", async () => {
    createEventMock.mockResolvedValue({ id: "evt_3" });
    findSubscriptionMock.mockResolvedValue({ userId: "user-3" });

    const result = await handleStripeEvent(
      prisma,
      stripe,
      rawEvent(
        "customer.subscription.deleted",
        {
          id: "sub_3",
          customer: "cus_3",
          status: "canceled",
          items: { data: [{ price: { id: "price_pro" } }] },
        },
        "evt_3",
      ),
    );

    expect(result).toEqual({ processed: true });
    expect(applyMock).toHaveBeenCalledWith(
      txClient,
      {
        userId: "user-3",
        customerId: "cus_3",
        subscriptionId: "sub_3",
        status: "CANCELED",
        priceId: "price_pro",
        currentPeriodEnd: null,
      },
      { pricePro: "price_pro", priceEnterprise: "price_ent" },
    );
  });

  it("acks unhandled event types without mutating anything", async () => {
    createEventMock.mockResolvedValue({ id: "evt_4" });

    const result = await handleStripeEvent(
      prisma,
      stripe,
      rawEvent("invoice.payment_succeeded", { id: "in_1" }, "evt_4"),
    );

    expect(result).toEqual({ processed: false });
    expect(findSubscriptionMock).not.toHaveBeenCalled();
    expect(retrieveSessionMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("skips checkout.session.completed without a client_reference_id", async () => {
    createEventMock.mockResolvedValue({ id: "evt_5" });

    const result = await handleStripeEvent(
      prisma,
      stripe,
      rawEvent("checkout.session.completed", { id: "cs_orphan" }, "evt_5"),
    );

    expect(result).toEqual({ processed: false });
    expect(retrieveSessionMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("skips subscription events whose customer has no Subscription row", async () => {
    createEventMock.mockResolvedValue({ id: "evt_6" });
    findSubscriptionMock.mockResolvedValue(null);

    const result = await handleStripeEvent(
      prisma,
      stripe,
      rawEvent(
        "customer.subscription.updated",
        {
          id: "sub_x",
          customer: "cus_unknown",
          status: "active",
          items: {
            data: [
              {
                price: { id: "price_pro" },
                current_period_end: 1_800_000_000,
              },
            ],
          },
        },
        "evt_6",
      ),
    );

    expect(result).toEqual({ processed: false });
    expect(transactionMock).not.toHaveBeenCalled();
  });
});
