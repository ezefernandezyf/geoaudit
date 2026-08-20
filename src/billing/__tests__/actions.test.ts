import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Session } from "next-auth";
import { checkoutAction, portalAction } from "@/billing/actions";
import { auth } from "@/lib/auth";
import { getStripe } from "@/billing/stripe";
import {
  createCheckoutSession,
  createPortalSession,
  getOrCreateCustomer,
} from "@/billing/subscription-service";
import type { BillingActionState } from "@/billing/actions";

/**
 * U2.3 — checkout/portal Server Actions (BLG-4/5/6, PRC-4, design U2).
 *
 * Boundary modules are mocked (auth, stripe singleton, prisma, the
 * subscription service, next/headers); the action wiring under test stays
 * REAL: auth→plan validation→config gate→priceId from env→customer→session,
 * and the redirect is the REAL next/navigation `redirect`, which throws a
 * NEXT_REDIRECT error whose digest carries the target (same pattern as
 * `src/lib/audit/__tests__/actions.test.ts`). The subscription service
 * itself is covered by its own U2.1 test file — here it is mocked so the
 * action test asserts the WIRING (argument passing), not the Stripe calls.
 */

/**
 * NextAuth v5 exports `auth` overloaded (middleware + `() => Session | null`);
 * vi.mocked() resolves the middleware overload, so the mock is cast to the
 * session-returning call shape the action actually uses.
 */
const authMock = auth as unknown as Mock<() => Promise<Session | null>>;

const getStripeMock = vi.mocked(getStripe);
const getOrCreateCustomerMock = vi.mocked(getOrCreateCustomer);
const createCheckoutSessionMock = vi.mocked(createCheckoutSession);
const createPortalSessionMock = vi.mocked(createPortalSession);

/**
 * Hoisted mock shared between the test body and the vi.mock factory —
 * vi.mock is hoisted above imports, so a plain `vi.fn()` declared here would
 * be a DIFFERENT function than the one the factory installs (same trap as
 * `rate-limit/__tests__/index.test.ts`). The factory references this one.
 * The generic types the resolved value so `mockResolvedValue` accepts the
 * portal user shapes the action reads (`user.subscription`).
 */
type PortalUser = {
  id: string;
  tier: string;
  subscription: {
    stripeCustomerId: string;
    plan: string;
    status: string;
  } | null;
};

const { findUserMock } = vi.hoisted(() => ({
  findUserMock: vi.fn<() => Promise<PortalUser | null>>(),
}));

vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));
vi.mock("@/billing/stripe", () => ({ getStripe: vi.fn(() => null) }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: findUserMock } },
}));
vi.mock("@/billing/subscription-service", () => ({
  getOrCreateCustomer: vi.fn(async () => "cus_mock"),
  createCheckoutSession: vi.fn(async () => ({
    id: "cs_mock",
    url: "https://checkout.stripe.com/c/pay/cs_mock",
  })),
  createPortalSession: vi.fn(async () => ({
    id: "bps_mock",
    url: "https://billing.stripe.com/session/bps_mock",
  })),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(
    async () =>
      new Headers({ host: "app.example.com", "x-forwarded-proto": "https" }),
  ),
}));

const session = (): Session => ({
  user: { id: "user-1", name: "Ana", email: "ana@example.com" },
  expires: new Date("2026-08-19T00:00:00.000Z").toISOString(),
});

const fd = (plan: string): FormData => {
  const formData = new FormData();
  formData.set("plan", plan);
  return formData;
};

async function expectRedirect(
  action: (
    prev: BillingActionState,
    formData: FormData,
  ) => Promise<BillingActionState>,
  formData: FormData,
  expectedTarget: string,
): Promise<void> {
  try {
    await action({ error: null }, formData);
    expect.unreachable("action should have redirected");
  } catch (err) {
    const digest = (err as { digest?: string }).digest ?? "";
    expect(digest).toContain("NEXT_REDIRECT");
    expect(digest).toContain(expectedTarget);
  }
}

beforeEach(() => {
  authMock.mockReset();
  getStripeMock.mockReset();
  findUserMock.mockReset();
  getOrCreateCustomerMock.mockReset();
  createCheckoutSessionMock.mockReset();
  createPortalSessionMock.mockReset();
  findUserMock.mockResolvedValue(null);
  vi.stubEnv("STRIPE_PRICE_PRO", "price_pro_1");
  vi.stubEnv("STRIPE_PRICE_ENTERPRISE", "price_ent_1");
});

describe("checkoutAction (BLG-5, PRC-4)", () => {
  it("returns an auth error and creates nothing without a session", async () => {
    authMock.mockResolvedValue(null);

    const state = await checkoutAction({ error: null }, fd("PRO"));

    expect(state).toEqual({ error: "auth" });
    expect(getOrCreateCustomerMock).not.toHaveBeenCalled();
    expect(createCheckoutSessionMock).not.toHaveBeenCalled();
  });

  it("returns invalid-plan for a non-checkout plan (FREE)", async () => {
    authMock.mockResolvedValue(session());

    const state = await checkoutAction({ error: null }, fd("FREE"));

    expect(state).toEqual({ error: "invalid-plan" });
    expect(getOrCreateCustomerMock).not.toHaveBeenCalled();
  });

  it("returns invalid-plan when the plan field is missing (triangulation)", async () => {
    authMock.mockResolvedValue(session());

    const state = await checkoutAction({ error: null }, new FormData());

    expect(state).toEqual({ error: "invalid-plan" });
    expect(getOrCreateCustomerMock).not.toHaveBeenCalled();
  });

  it("returns a config error when STRIPE_SECRET_KEY is missing (BLG-4)", async () => {
    authMock.mockResolvedValue(session());
    getStripeMock.mockReturnValue(null);

    const state = await checkoutAction({ error: null }, fd("PRO"));

    expect(state).toEqual({ error: "config" });
    expect(getOrCreateCustomerMock).not.toHaveBeenCalled();
  });

  it("redirects to the checkout url for PRO with the pro price id", async () => {
    authMock.mockResolvedValue(session());
    getStripeMock.mockReturnValue({} as ReturnType<typeof getStripe>);
    getOrCreateCustomerMock.mockResolvedValue("cus_1");

    await expectRedirect(
      checkoutAction,
      fd("PRO"),
      "https://checkout.stripe.com/c/pay/cs_mock",
    );

    expect(getOrCreateCustomerMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      "user-1",
      "ana@example.com",
    );
    expect(createCheckoutSessionMock).toHaveBeenCalledWith(expect.anything(), {
      customerId: "cus_1",
      priceId: "price_pro_1",
      userId: "user-1",
      successUrl: "https://app.example.com/dashboard?checkout=success",
      cancelUrl: "https://app.example.com/pricing?checkout=cancelled",
    });
  });

  it("redirects for ENTERPRISE with the enterprise price id (triangulation)", async () => {
    authMock.mockResolvedValue(session());
    getStripeMock.mockReturnValue({} as ReturnType<typeof getStripe>);
    getOrCreateCustomerMock.mockResolvedValue("cus_2");

    await expectRedirect(
      checkoutAction,
      fd("ENTERPRISE"),
      "https://checkout.stripe.com/c/pay/cs_mock",
    );

    expect(createCheckoutSessionMock).toHaveBeenCalledWith(expect.anything(), {
      customerId: "cus_2",
      priceId: "price_ent_1",
      userId: "user-1",
      successUrl: "https://app.example.com/dashboard?checkout=success",
      cancelUrl: "https://app.example.com/pricing?checkout=cancelled",
    });
  });
});

describe("portalAction (BLG-6, PRC-4)", () => {
  it("returns an auth error without a session", async () => {
    authMock.mockResolvedValue(null);

    const state = await portalAction({ error: null }, new FormData());

    expect(state).toEqual({ error: "auth" });
    expect(createPortalSessionMock).not.toHaveBeenCalled();
  });

  it("returns no-subscription for a user without a subscription row", async () => {
    authMock.mockResolvedValue(session());
    findUserMock.mockResolvedValue({
      id: "user-1",
      tier: "FREE",
      subscription: null,
    });

    const state = await portalAction({ error: null }, new FormData());

    expect(state).toEqual({ error: "no-subscription" });
    expect(createPortalSessionMock).not.toHaveBeenCalled();
  });

  it("returns no-subscription when the subscription has no paid plan (FREE)", async () => {
    authMock.mockResolvedValue(session());
    findUserMock.mockResolvedValue({
      id: "user-1",
      tier: "FREE",
      subscription: {
        stripeCustomerId: "cus_1",
        plan: "FREE",
        status: "INCOMPLETE",
      },
    });

    const state = await portalAction({ error: null }, new FormData());

    expect(state).toEqual({ error: "no-subscription" });
    expect(createPortalSessionMock).not.toHaveBeenCalled();
  });

  it("returns a config error when STRIPE_SECRET_KEY is missing (BLG-4)", async () => {
    authMock.mockResolvedValue(session());
    findUserMock.mockResolvedValue({
      id: "user-1",
      tier: "PRO",
      subscription: {
        stripeCustomerId: "cus_1",
        plan: "PRO",
        status: "ACTIVE",
      },
    });
    getStripeMock.mockReturnValue(null);

    const state = await portalAction({ error: null }, new FormData());

    expect(state).toEqual({ error: "config" });
    expect(createPortalSessionMock).not.toHaveBeenCalled();
  });

  it("redirects to the portal url for a PRO user", async () => {
    authMock.mockResolvedValue(session());
    findUserMock.mockResolvedValue({
      id: "user-1",
      tier: "PRO",
      subscription: {
        stripeCustomerId: "cus_1",
        plan: "PRO",
        status: "ACTIVE",
      },
    });
    getStripeMock.mockReturnValue({} as ReturnType<typeof getStripe>);

    await expectRedirect(
      portalAction,
      new FormData(),
      "https://billing.stripe.com/session/bps_mock",
    );

    expect(createPortalSessionMock).toHaveBeenCalledWith(expect.anything(), {
      customerId: "cus_1",
      returnUrl: "https://app.example.com/dashboard",
    });
  });

  it("redirects for an ENTERPRISE user with their customer id (triangulation)", async () => {
    authMock.mockResolvedValue(session());
    findUserMock.mockResolvedValue({
      id: "user-1",
      tier: "ENTERPRISE",
      subscription: {
        stripeCustomerId: "cus_ent",
        plan: "ENTERPRISE",
        status: "ACTIVE",
      },
    });
    getStripeMock.mockReturnValue({} as ReturnType<typeof getStripe>);

    await expectRedirect(
      portalAction,
      new FormData(),
      "https://billing.stripe.com/session/bps_mock",
    );

    expect(createPortalSessionMock).toHaveBeenCalledWith(expect.anything(), {
      customerId: "cus_ent",
      returnUrl: "https://app.example.com/dashboard",
    });
  });
});
