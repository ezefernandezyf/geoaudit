import type { ReactNode } from "react";
import { Check, Sparkles } from "lucide-react";
import type { Tier } from "@/lib/contracts/billing";

/**
 * Presentational plan card catalog (PRC-1/2/5/6, design U3).
 *
 * `PricingCards` renders the exact monthly plan set (Free $0·3/30d, Pro
 * $9/mes·10/mes, Enterprise $49/mes·50/mes) with a per-plan CTA. It is PURE
 * presentation: the `cta` node per plan is supplied by the server page (which
 * adapts it to auth state + tier per PRC-3) so this component carries no
 * auth/billing logic.
 *
 * Gemini verbatim (reference PricingPage.tsx): hex directos (no semantic
 * tokens, DNF-9), card `rounded-2xl`, description line, price block with
 * border-b separator, "Incluye:" feature label, check circles emerald.
 *
 * Monthly-only (PRC-5): the catalog is monthly by design — no annual/monthly
 * toggle and no discounted annual price are ever rendered (D2). The `featured`
 * flag highlights a plan Gemini-style (PRC-6): emerald border
 * `border-[#10b981]`, "Recomendado" badge `bg-[#10b981]` and `lg:-translate-y-2`
 * lift; `features` render as a checkmark list.
 */
export type PricingPlan = {
  id: Tier;
  name: string;
  price: string;
  limit: string;
  /** One-line plan description under the name (Gemini composition). */
  description?: string;
  /** Optional feature bullets rendered with a checkmark (PRC-1). */
  features?: string[];
  /** Highlights the plan with an emerald border + "Recomendado" badge (PRC-6). */
  featured?: boolean;
  /** CTA node supplied by the server page (CheckoutButton / portal / sign-in). */
  cta: ReactNode;
};

export function PricingCards({ plans }: { plans: PricingPlan[] }) {
  return (
    <div className="grid w-full grid-cols-1 gap-8 items-stretch lg:grid-cols-3">
      {plans.map((plan) => (
        <PricingCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}

function PricingCard({ plan }: { plan: PricingPlan }) {
  const {
    name,
    price,
    limit,
    description,
    features = [],
    featured = false,
    cta,
  } = plan;
  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl bg-white transition-all duration-200 ${
        featured
          ? "border-2 border-[#10b981] p-7 shadow-md sm:p-8 lg:-translate-y-2"
          : "border border-[#e2e8f0] p-6 hover:border-[#cbd5e1] sm:p-7"
      }`}
    >
      {featured ? (
        <div className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#10b981] px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-white shadow-xs">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          <span>Recomendado</span>
        </div>
      ) : null}

      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-serif text-2xl font-normal text-[#0f172a]">
            {name}
          </h3>
        </div>

        {description ? (
          <p className="mb-6 min-h-[36px] font-sans text-xs text-[#64748b]">
            {description}
          </p>
        ) : null}

        <div className="mb-6 border-b border-[#e2e8f0] pb-6">
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-4xl font-normal leading-none text-[#0f172a] sm:text-5xl">
              {price}
            </span>
          </div>
          <div className="mt-2 inline-block rounded border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 font-mono text-xs font-semibold text-[#0f172a]">
            {limit}
          </div>
        </div>

        <div className="mb-8 space-y-3">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
            Incluye:
          </p>
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-2.5 text-xs">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <Check className="h-2.5 w-2.5" aria-hidden="true" />
              </span>
              <span className="text-[#0f172a]">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div>{cta}</div>
    </div>
  );
}
