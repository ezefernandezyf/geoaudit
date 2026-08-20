"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/billing/stripe";
import { checkoutPlanSchema } from "@/lib/contracts/billing";
import {
  createCheckoutSession,
  createPortalSession,
  getOrCreateCustomer,
} from "@/billing/subscription-service";

/**
 * Checkout/Portal Server Actions (BLG-5/6, PRC-4, design U2).
 *
 * Contract: both actions return a `BillingActionState` — `{ error: null }`
 * on success is never actually returned, because success throws NEXT_REDIRECT
 * (Next's `redirect()`) — failures return `{ error }` for `useActionState`.
 * This mirrors `src/lib/audit/actions.ts` (AuditFormState) and satisfies
 * PRC-4: error states are surfaced inline; success IS the redirect.
 */

/** State returned to the form: `{ error: null }` on success (redirect fires). */
export type BillingActionState = { error: string | null };

/** Paths the Stripe flows resolve against the request origin. */
const SUCCESS_PATH = "/dashboard?checkout=success";
const CANCEL_PATH = "/pricing?checkout=cancelled";
const RETURN_PATH = "/dashboard";

/**
 * Base URL for success/cancel/return URLs (design open question, decided in
 * U2): request ORIGIN wins — rebuilt from the standard proxy headers
 * (`host` + `x-forwarded-proto`, the shape Vercel/Next send). Server Actions
 * receive no Request object (only prevState + formData), so `request.url` is
 * unavailable; headers are the Next-idiomatic substitute. Fallback chain:
 * NEXTAUTH_URL → NEXT_PUBLIC_APP_URL → localhost (dev).
 */
async function resolveBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
    return `${proto}://${host}`;
  }
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

/**
 * Checkout Server Action (BLG-5, PRC-4).
 *
 * auth → plan validation → stripe config gate (BLG-4) → price id from env →
 * get-or-create customer → subscription checkout session → redirect.
 * Only success redirects; every failure returns `{ error }`.
 */
export async function checkoutAction(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "auth" };

  const plan = checkoutPlanSchema.safeParse(formData.get("plan"));
  if (!plan.success) return { error: "invalid-plan" };

  const stripe = getStripe();
  if (!stripe) return { error: "config" }; // BLG-4: fail safe, never crash

  const priceId =
    plan.data === "PRO"
      ? process.env.STRIPE_PRICE_PRO
      : process.env.STRIPE_PRICE_ENTERPRISE;
  if (!priceId) return { error: "config" };

  const baseUrl = await resolveBaseUrl();
  const customerId = await getOrCreateCustomer(
    prisma,
    stripe,
    session.user.id,
    session.user.email,
  );
  const checkout = await createCheckoutSession(stripe, {
    customerId,
    priceId,
    userId: session.user.id,
    successUrl: `${baseUrl}${SUCCESS_PATH}`,
    cancelUrl: `${baseUrl}${CANCEL_PATH}`,
  });

  redirect(checkout.url!);
}

/**
 * Billing Portal Server Action (BLG-6, PRC-4).
 *
 * auth → subscription lookup (the session carries only user.id — tier lives
 * in the DB, design decision) → paid-plan + stripeCustomerId gate →
 * portal session → redirect. Only success redirects; failures return
 * `{ error }` (PRC-4).
 */
export async function portalAction(
  _prev: BillingActionState,
  _formData: FormData,
): Promise<BillingActionState> {
  void _formData; // useActionState payload — the portal flow needs no form data
  const session = await auth();
  if (!session?.user?.id) return { error: "auth" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  });
  const subscription = user?.subscription;
  const hasPaidPlan =
    subscription?.plan === "PRO" || subscription?.plan === "ENTERPRISE";
  if (!subscription?.stripeCustomerId || !hasPaidPlan) {
    return { error: "no-subscription" };
  }

  const stripe = getStripe();
  if (!stripe) return { error: "config" }; // BLG-4: fail safe, never crash

  const baseUrl = await resolveBaseUrl();
  const portal = await createPortalSession(stripe, {
    customerId: subscription.stripeCustomerId,
    returnUrl: `${baseUrl}${RETURN_PATH}`,
  });

  redirect(portal.url!);
}
