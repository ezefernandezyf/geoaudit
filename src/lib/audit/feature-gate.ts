import type { Tier } from "@/lib/contracts/billing";
import { isPaidTier } from "@/lib/audit/tier";

/**
 * PRO feature gate (TLM-9, design D7).
 *
 * SINGLE enforcement point for the three PRO-gated capabilities — multi-page
 * audit (U3), PDF export (U4) and share links (U2): actions, routes and UI all
 * call `requirePaidTier(tier)` instead of inlining `isPaidTier`, so the
 * denial shape (and its upgrade CTA) lives in exactly one place.
 *
 * Discriminated union (D7): `{ allowed: true }` for PRO/ENTERPRISE,
 * `{ allowed: false, cta: "upgrade" }` for FREE. Consumers narrow on
 * `allowed`; the CTA is only present on the denial.
 */

export type FeatureGateDecision =
  { allowed: true } | { allowed: false; cta: "upgrade" };

/** True only for paid tiers; FREE carries the upgrade CTA. */
export function requirePaidTier(tier: Tier): FeatureGateDecision {
  return isPaidTier(tier)
    ? { allowed: true }
    : { allowed: false, cta: "upgrade" };
}
