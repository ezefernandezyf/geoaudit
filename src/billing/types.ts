import type { SubscriptionStatus, Tier } from "@/lib/contracts/billing";

/**
 * Billing domain types (BLG-9, design U1/U3).
 *
 * `NormalizedSubscriptionEvent` is the stripped-down subscription shape the
 * webhook builds from a Stripe event before handing it to the tier sync
 * (`aplicaSubscriptionEvent`, U3). `resolveTier` is the pure priceId→Tier
 * mapping (BLG-9).
 */

export type NormalizedSubscriptionEvent = {
  customerId: string;
  subscriptionId: string;
  status: SubscriptionStatus;
  priceId: string | null;
  /** Stripe epoch seconds; null when the period is unknown/ended. */
  currentPeriodEnd: number | null;
};

/** Env price ids the mapping resolves against (BLG-5). */
export type PriceEnv = {
  pricePro: string | null;
  priceEnterprise: string | null;
};

/**
 * BLG-9 tier resolution:
 * - ACTIVE/TRIALING → PRO/ENTERPRISE by price id; unknown price falls back to
 *   FREE (never grants a paid tier for an unrecognized price).
 * - Any other status (CANCELED, UNPAID, INCOMPLETE_EXPIRED, PAST_DUE,
 *   INCOMPLETE) → FREE: the user is not entitled to a paid tier.
 */
export function resolveTier(
  status: SubscriptionStatus,
  priceId: string | null,
  env: PriceEnv,
): Tier {
  if (status === "ACTIVE" || status === "TRIALING") {
    if (priceId === env.pricePro) return "PRO";
    if (priceId === env.priceEnterprise) return "ENTERPRISE";
  }
  return "FREE";
}
