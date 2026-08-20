import type Stripe from "stripe";
import type { SubscriptionStatus, Tier } from "@/lib/contracts/billing";

/**
 * Billing subscription service (BLG-5/6, design U2).
 *
 * The Stripe client and the prisma subset are INJECTED dependencies
 * (structural typing — the real PrismaClient satisfies `BillingPrisma`), so
 * the orchestration is unit-testable without a real Stripe SDK or database
 * (design testing strategy: "mocked Stripe SDK + structural prisma"). The
 * Server Actions in `actions.ts` compose these primitives with auth, env and
 * redirect.
 */

/** Structural prisma subset the service touches (matches PrismaClient). */
export type BillingPrisma = {
  subscription: {
    findUnique(args: {
      where: { userId: string };
    }): Promise<{ stripeCustomerId: string } | null>;
    upsert(args: {
      where: { userId: string };
      create: {
        userId: string;
        stripeCustomerId: string;
        plan: Tier;
        status: SubscriptionStatus;
      };
      update: { stripeCustomerId: string };
    }): Promise<unknown>;
  };
};

/**
 * getOrCreateCustomer (BLG-5).
 *
 * 1. Look up the user's Subscription row by userId — when it already stores a
 *    stripeCustomerId, return it (idempotent, no Stripe round-trip).
 * 2. Otherwise create the Stripe customer (email when available) and persist
 *    the id via upsert. The row starts at FREE/INCOMPLETE — plan/status are
 *    synced later by the webhook when checkout completes (U3, BLG-9).
 *
 * The Checkout Session later carries `client_reference_id = userId`, letting
 * `checkout.session.completed` resolve customer→user without a metadata
 * round-trip (design decision A).
 */
export async function getOrCreateCustomer(
  prisma: BillingPrisma,
  stripe: Stripe,
  userId: string,
  email: string | null | undefined,
): Promise<string> {
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing) return existing.stripeCustomerId;

  const customer = await stripe.customers.create(email ? { email } : {});
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customer.id,
      plan: "FREE",
      status: "INCOMPLETE",
    },
    update: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

/** Inputs for `createCheckoutSession` (BLG-5). */
export type CheckoutSessionParams = {
  customerId: string;
  /** Env price id: STRIPE_PRICE_PRO or STRIPE_PRICE_ENTERPRISE. */
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
};

/**
 * createCheckoutSession (BLG-5): one subscription checkout session.
 * `client_reference_id` carries the user id so `checkout.session.completed`
 * can resolve customer→user (design decision A — no metadata round-trip).
 */
export async function createCheckoutSession(
  stripe: Stripe,
  params: CheckoutSessionParams,
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: "subscription",
    client_reference_id: params.userId,
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
}

/** Inputs for `createPortalSession` (BLG-6). */
export type PortalSessionParams = {
  customerId: string;
  returnUrl: string;
};

/** createPortalSession (BLG-6): one billing-portal session for a customer. */
export async function createPortalSession(
  stripe: Stripe,
  params: PortalSessionParams,
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
}
