import type { ReactNode } from "react";
import type { Tier } from "@/lib/contracts/billing";
import { Card } from "@/ui/card";

/**
 * Presentational plan card catalog (PRC-1/2, design U4).
 *
 * `PricingCards` renders the exact plan set (Free $0·3/30d, Pro $9/mes·10/mes,
 * Enterprise $49/mes·50/mes) with a per-plan CTA. It is PURE presentation: the
 * `cta` node per plan is supplied by the server page (which adapts it to auth
 * state + tier per PRC-3) so this component carries no auth/billing logic.
 */
export type PricingPlan = {
  id: Tier;
  name: string;
  price: string;
  limit: string;
  /** CTA node supplied by the server page (CheckoutButton / portal / sign-in). */
  cta: ReactNode;
};

export function PricingCards({ plans }: { plans: PricingPlan[] }) {
  return (
    <div className="grid w-full max-w-4xl gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <Card key={plan.id} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-display text-2xl tracking-tight text-navy">
              {plan.name}
            </h3>
            <p className="font-mono text-3xl tracking-tight text-navy">
              {plan.price}
            </p>
          </div>
          <p className="text-sm text-text-secondary">{plan.limit}</p>
          <div className="mt-auto">{plan.cta}</div>
        </Card>
      ))}
    </div>
  );
}
