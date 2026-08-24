import type { ReactNode } from "react";
import { Check, Sparkles } from "lucide-react";
import type { Tier } from "@/lib/contracts/billing";
import { Card } from "@/ui/card";

/**
 * Presentational plan card catalog (PRC-1/2/5, design U4).
 *
 * `PricingCards` renders the exact monthly plan set (Free $0·3/30d, Pro
 * $9/mes·10/mes, Enterprise $49/mes·50/mes) with a per-plan CTA. It is PURE
 * presentation: the `cta` node per plan is supplied by the server page (which
 * adapts it to auth state + tier per PRC-3) so this component carries no
 * auth/billing logic.
 *
 * Monthly-only (PRC-5): the catalog is monthly by design — no annual/monthly
 * toggle and no discounted annual price are ever rendered. The `featured`
 * flag highlights a plan with an emerald border, a "Recomendado" badge and a
 * subtle lift; `features` render as a checkmark list.
 */
export type PricingPlan = {
  id: Tier;
  name: string;
  price: string;
  limit: string;
  /** Optional feature bullets rendered with a checkmark (PRC-1). */
  features?: string[];
  /** Highlights the plan with an emerald border + "Recomendado" badge. */
  featured?: boolean;
  /** CTA node supplied by the server page (CheckoutButton / portal / sign-in). */
  cta: ReactNode;
};

export function PricingCards({ plans }: { plans: PricingPlan[] }) {
  return (
    <div className="grid w-full max-w-5xl items-stretch gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <PricingCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}

function PricingCard({ plan }: { plan: PricingPlan }) {
  const { name, price, limit, features = [], featured = false, cta } = plan;
  return (
    <Card
      className={`relative flex flex-col gap-6 ${featured ? "border-2 border-emerald shadow-md md:-translate-y-2" : ""}`}
    >
      {featured ? (
        <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-emerald px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Recomendado
        </span>
      ) : null}

      <div className="flex flex-col gap-2">
        <h3 className="font-display text-2xl tracking-tight text-navy">
          {name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-4xl leading-none tracking-tight text-navy">
            {price}
          </span>
        </div>
        <span className="inline-block w-fit rounded-md border border-border bg-surface-muted px-2.5 py-1 font-mono text-xs font-semibold text-text-primary">
          {limit}
        </span>
      </div>

      {features.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-2.5 w-2.5" aria-hidden="true" />
              </span>
              <span className="text-text-primary">{feature}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto">{cta}</div>
    </Card>
  );
}
