import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { POST } from "@/app/api/webhooks/stripe/route";
import { getStripe } from "@/billing/stripe";
import { prisma } from "@/lib/prisma";

/**
 * U3.5 — webhook route (BLG-7/8, design U3).
 *
 * The route is the signature gate: `runtime: nodejs` + raw `req.text()` body
 * verified with `stripe.webhooks.constructEvent` + `STRIPE_WEBHOOK_SECRET`
 * BEFORE anything else runs (BLG-7: never trust the body). Invalid/missing
 * signature or missing config → 400 with ZERO side effects; a verified
 * event is handed to `handleStripeEvent` (mocked here — its own U3.3 suite
 * covers dispatch/idempotency) and acked 200.
 */

const { constructEventMock, handleStripeEventMock } = vi.hoisted(() => ({
  constructEventMock: vi.fn(),
  handleStripeEventMock: vi.fn(async () => ({ processed: true })),
}));

vi.mock("@/billing/stripe", () => ({
  getStripe: vi.fn(() => null),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { stripeWebhookEvent: { create: vi.fn() } },
}));
vi.mock("@/billing/webhook-handler", () => ({
  handleStripeEvent: handleStripeEventMock,
}));

const stripe = {
  webhooks: { constructEvent: constructEventMock },
} as unknown as Stripe;

const getStripeMock = vi.mocked(getStripe);
const prismaMock = vi.mocked(prisma);
const stripeWebhookCreateMock = vi.mocked(prismaMock.stripeWebhookEvent.create);

const verifiedEvent = {
  id: "evt_1",
  type: "checkout.session.completed",
} as Stripe.Event;

function post(
  body = '{"id":"evt_1"}',
  signature?: string | null,
): Promise<Response> {
  const headers = new Headers();
  // `null` means "no header at all" — Headers would stringify null to "null".
  if (signature !== null) {
    headers.set("stripe-signature", signature ?? "t=1,v1=sig");
  }
  return POST(
    new Request("https://app.example.com/api/webhooks/stripe", {
      method: "POST",
      body,
      headers,
    }),
  );
}

beforeEach(() => {
  constructEventMock.mockReset();
  handleStripeEventMock.mockReset();
  stripeWebhookCreateMock.mockReset();
  getStripeMock.mockReturnValue(stripe);
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/webhooks/stripe (BLG-7 signature)", () => {
  it("rejects a tampered body with 400 and processes nothing", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("Signature verification failed");
    });

    const res = await post();

    expect(res.status).toBe(400);
    expect(handleStripeEventMock).not.toHaveBeenCalled();
    expect(stripeWebhookCreateMock).not.toHaveBeenCalled();
  });

  it("rejects with 400 when the webhook secret is not configured", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");

    const res = await post();

    expect(res.status).toBe(400);
    expect(constructEventMock).not.toHaveBeenCalled();
    expect(handleStripeEventMock).not.toHaveBeenCalled();
  });

  it("rejects with 400 when the Stripe client is unavailable", async () => {
    getStripeMock.mockReturnValue(null);

    const res = await post();

    expect(res.status).toBe(400);
    expect(constructEventMock).not.toHaveBeenCalled();
    expect(handleStripeEventMock).not.toHaveBeenCalled();
  });

  it("rejects with 400 when the signature header is missing", async () => {
    const res = await post('{"id":"evt_1"}', null);

    expect(res.status).toBe(400);
    expect(constructEventMock).not.toHaveBeenCalled();
    expect(handleStripeEventMock).not.toHaveBeenCalled();
  });

  it("verifies the raw body and dispatches the verified event with 200", async () => {
    constructEventMock.mockReturnValue(verifiedEvent);

    const res = await post();

    expect(res.status).toBe(200);
    expect(constructEventMock).toHaveBeenCalledWith(
      '{"id":"evt_1"}',
      "t=1,v1=sig",
      "whsec_test",
    );
    expect(handleStripeEventMock).toHaveBeenCalledWith(
      prismaMock,
      stripe,
      verifiedEvent,
    );
  });
});
