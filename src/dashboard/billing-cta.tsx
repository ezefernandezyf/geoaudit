import Link from "next/link";
import type { Tier } from "@/lib/contracts/billing";
import { CheckoutButton, type CheckoutAction } from "@/billing/checkout-button";

/**
 * Dashboard billing CTA (DSH-6, PRC-3, design U4).
 *
 * Tier-adaptive: FREE users see an "Upgrade" link to `/pricing`; PRO/Enterprise
 * users see a "Gestionar suscripción" form that triggers the portal Server
 * Action. The action is injected as a prop (a Server Component passes the
 * `"use server"` `portalAction` to the client `CheckoutButton`).
 */
type BillingCtaProps = {
  tier: Tier;
  /** The portal Server Action (portalAction from src/billing/actions). */
  portalAction: CheckoutAction;
};

export function BillingCta({ tier, portalAction }: BillingCtaProps) {
  if (tier === "FREE") {
    return (
      <Link
        href="/pricing"
        className="inline-flex items-center justify-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        Upgrade
      </Link>
    );
  }

  return (
    <CheckoutButton
      action={portalAction}
      plan={tier === "ENTERPRISE" ? "ENTERPRISE" : "PRO"}
      label="Gestionar suscripción"
    />
  );
}
