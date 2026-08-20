import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import {
  createCheckoutSession,
  createPortalSession,
  getOrCreateCustomer,
  type BillingPrisma,
} from "@/billing/subscription-service";

/**
 * U2.1 — subscription service (BLG-5/6, design U2).
 *
 * The service receives the Stripe client and the prisma subset as INJECTED
 * dependencies (structural typing — the real PrismaClient satisfies
 * `BillingPrisma`), so the orchestration is tested with zero module mocks:
 * a fake Stripe object and a fake prisma object. This mirrors the design
 * testing strategy: "mocked Stripe SDK + structural prisma".
 *
 * Assertions are behavioral: what the service CALLS Stripe/prisma with
 * (BLG-5: `client_reference_id=userId`, env price id, line_items) and what it
 * RETURNS (the session objects the actions redirect to).
 */

const customersCreateMock = vi.fn();
const checkoutSessionsCreateMock = vi.fn();
const portalSessionsCreateMock = vi.fn();

const stripe = {
  customers: { create: customersCreateMock },
  checkout: { sessions: { create: checkoutSessionsCreateMock } },
  billingPortal: { sessions: { create: portalSessionsCreateMock } },
} as unknown as Stripe;

const findUniqueMock = vi.fn();
const upsertMock = vi.fn();

const prisma = {
  subscription: { findUnique: findUniqueMock, upsert: upsertMock },
} as unknown as BillingPrisma;

beforeEach(() => {
  customersCreateMock.mockReset();
  checkoutSessionsCreateMock.mockReset();
  portalSessionsCreateMock.mockReset();
  findUniqueMock.mockReset();
  upsertMock.mockReset();
});

describe("getOrCreateCustomer (BLG-5)", () => {
  it("returns the stored stripeCustomerId without touching Stripe (idempotent)", async () => {
    findUniqueMock.mockResolvedValue({ stripeCustomerId: "cus_existing" });

    const customerId = await getOrCreateCustomer(
      prisma,
      stripe,
      "user-1",
      "ana@example.com",
    );

    expect(customerId).toBe("cus_existing");
    expect(customersCreateMock).not.toHaveBeenCalled();
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("creates a Stripe customer with the user's email and persists the id", async () => {
    findUniqueMock.mockResolvedValue(null);
    customersCreateMock.mockResolvedValue({ id: "cus_new" });

    const customerId = await getOrCreateCustomer(
      prisma,
      stripe,
      "user-1",
      "ana@example.com",
    );

    expect(customerId).toBe("cus_new");
    expect(customersCreateMock).toHaveBeenCalledWith({
      email: "ana@example.com",
    });
    expect(upsertMock).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      create: {
        userId: "user-1",
        stripeCustomerId: "cus_new",
        plan: "FREE",
        status: "INCOMPLETE",
      },
      update: { stripeCustomerId: "cus_new" },
    });
  });

  it("creates a customer without email when the user has none (triangulation)", async () => {
    findUniqueMock.mockResolvedValue(null);
    customersCreateMock.mockResolvedValue({ id: "cus_noemail" });

    const customerId = await getOrCreateCustomer(
      prisma,
      stripe,
      "user-2",
      null,
    );

    expect(customerId).toBe("cus_noemail");
    expect(customersCreateMock).toHaveBeenCalledWith({});
  });
});

describe("createCheckoutSession (BLG-5)", () => {
  it("creates a subscription session with price, client_reference_id and urls", async () => {
    checkoutSessionsCreateMock.mockResolvedValue({
      id: "cs_1",
      url: "https://checkout.stripe.com/c/pay/cs_1",
    });

    const session = await createCheckoutSession(stripe, {
      customerId: "cus_1",
      priceId: "price_pro",
      userId: "user-1",
      successUrl: "https://app.example.com/dashboard?checkout=success",
      cancelUrl: "https://app.example.com/pricing?checkout=cancelled",
    });

    expect(checkoutSessionsCreateMock).toHaveBeenCalledWith({
      customer: "cus_1",
      mode: "subscription",
      client_reference_id: "user-1",
      line_items: [{ price: "price_pro", quantity: 1 }],
      success_url: "https://app.example.com/dashboard?checkout=success",
      cancel_url: "https://app.example.com/pricing?checkout=cancelled",
    });
    expect(session.url).toBe("https://checkout.stripe.com/c/pay/cs_1");
  });

  it("passes the enterprise price id and its own urls (triangulation)", async () => {
    checkoutSessionsCreateMock.mockResolvedValue({
      id: "cs_2",
      url: "https://checkout.stripe.com/c/pay/cs_2",
    });

    const session = await createCheckoutSession(stripe, {
      customerId: "cus_2",
      priceId: "price_ent",
      userId: "user-2",
      successUrl: "https://app.example.com/dashboard?checkout=ok",
      cancelUrl: "https://app.example.com/pricing?checkout=cancel",
    });

    expect(checkoutSessionsCreateMock).toHaveBeenCalledWith({
      customer: "cus_2",
      mode: "subscription",
      client_reference_id: "user-2",
      line_items: [{ price: "price_ent", quantity: 1 }],
      success_url: "https://app.example.com/dashboard?checkout=ok",
      cancel_url: "https://app.example.com/pricing?checkout=cancel",
    });
    expect(session.url).toBe("https://checkout.stripe.com/c/pay/cs_2");
  });
});

describe("createPortalSession (BLG-6)", () => {
  it("creates a portal session for the customer with the return url", async () => {
    portalSessionsCreateMock.mockResolvedValue({
      id: "bps_1",
      url: "https://billing.stripe.com/session/bps_1",
    });

    const session = await createPortalSession(stripe, {
      customerId: "cus_1",
      returnUrl: "https://app.example.com/dashboard",
    });

    expect(portalSessionsCreateMock).toHaveBeenCalledWith({
      customer: "cus_1",
      return_url: "https://app.example.com/dashboard",
    });
    expect(session.url).toBe("https://billing.stripe.com/session/bps_1");
  });

  it("uses the provided return url (triangulation)", async () => {
    portalSessionsCreateMock.mockResolvedValue({
      id: "bps_2",
      url: "https://billing.stripe.com/session/bps_2",
    });

    const session = await createPortalSession(stripe, {
      customerId: "cus_2",
      returnUrl: "https://app.example.com/account/billing",
    });

    expect(portalSessionsCreateMock).toHaveBeenCalledWith({
      customer: "cus_2",
      return_url: "https://app.example.com/account/billing",
    });
    expect(session.url).toBe("https://billing.stripe.com/session/bps_2");
  });
});
