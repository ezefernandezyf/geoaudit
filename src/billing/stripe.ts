import Stripe from "stripe";

/**
 * Stripe client singleton (BLG-4, design U1).
 *
 * - Lazy: the SDK is only constructed on first call, never at import time.
 * - Env-guarded fail safe: missing/empty STRIPE_SECRET_KEY returns `null`
 *   instead of throwing — billing degrades to an error state, it never
 *   crashes `pnpm dev` (this is the deliberate opposite of src/lib/prisma.ts,
 *   which fails fast at import).
 * - Memoized on globalThis so Next.js dev hot-reload reuses one instance
 *   (prisma lesson).
 * - apiVersion is pinned to the SDK's stable version so a future SDK upgrade
 *   can never silently change the API contract (U1.1 decision).
 */
const g = globalThis as unknown as { stripe?: Stripe };

export const STRIPE_API_VERSION = "2026-07-29.dahlia";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  g.stripe ??= new Stripe(key, { apiVersion: STRIPE_API_VERSION });
  return g.stripe;
}
