import type Stripe from "stripe";
import { getStripe } from "@/billing/stripe";
import { handleStripeEvent } from "@/billing/webhook-handler";
import { prisma } from "@/lib/prisma";

/**
 * Stripe webhook route (BLG-7/8/10, design U3).
 *
 * Signature gate FIRST (BLG-7): the raw body is read before ANY parse and
 * verified with `stripe.webhooks.constructEvent` + `STRIPE_WEBHOOK_SECRET` —
 * no claim in the body is ever trusted before verification. Missing config
 * (secret or Stripe client) and invalid signatures are rejected with 400
 * before any side effect.
 *
 * Requires the Node.js runtime because signature verification needs raw
 * crypto (webhooks are invalid under the Edge runtime), and `force-dynamic`
 * keeps the route out of static optimization.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text(); // raw body — MUST be read before any parse (BLG-7)
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !signature || !secret) {
    return new Response("Not configured", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  // Idempotent dispatch (BLG-8/10); the route acks 200 for replays too.
  await handleStripeEvent(prisma, stripe, event);
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
