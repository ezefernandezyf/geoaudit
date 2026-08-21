import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkoutAction, portalAction } from "@/billing/actions";
import { CheckoutButton, type CheckoutAction } from "@/billing/checkout-button";
import { PricingCards, type PricingPlan } from "@/billing/pricing-cards";
import type { Tier } from "@/lib/contracts/billing";

/**
 * Pricing page (PRC-1/2/3, design U4).
 *
 * Public route — the middleware only guards /dashboard/*. Server component:
 * `auth()` resolves the visitor's tier (from the DB — the session carries only
 * `user.id`, design decision) and renders the plan catalog with a CTA adapted
 * to auth state (PRC-3): anonymous → sign-in; FREE → checkout ("Mejorar");
 * PRO/Enterprise → portal ("Gestionar suscripción").
 *
 * `PricingCards` is presentational; this page supplies each card's CTA node.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function currentPlanCta(): React.ReactNode {
  return (
    <p className="text-center text-sm font-medium text-text-secondary">
      Plan actual
    </p>
  );
}

function signInCta(): React.ReactNode {
  return (
    <Link
      href="/login"
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
    >
      Iniciar sesión
    </Link>
  );
}

function paidPlanCta(action: CheckoutAction): React.ReactNode {
  return (
    <CheckoutButton
      action={action}
      plan="ENTERPRISE"
      label="Gestionar suscripción"
    />
  );
}

export default async function PricingPage() {
  const session = await auth();
  let tier: Tier | null = null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tier: true },
    });
    tier = user?.tier ?? "FREE";
  }

  const plans: PricingPlan[] = [
    {
      id: "FREE",
      name: "Free",
      price: "$0",
      limit: "3 / 30 días",
      cta:
        tier === null
          ? signInCta()
          : tier === "FREE"
            ? currentPlanCta()
            : paidPlanCta(portalAction),
    },
    {
      id: "PRO",
      name: "Pro",
      price: "$9/mes",
      limit: "10 / mes",
      cta:
        tier === null ? (
          signInCta()
        ) : tier === "FREE" ? (
          <CheckoutButton action={checkoutAction} plan="PRO" />
        ) : tier === "PRO" ? (
          currentPlanCta()
        ) : (
          paidPlanCta(portalAction)
        ),
    },
    {
      id: "ENTERPRISE",
      name: "Enterprise",
      price: "$49/mes",
      limit: "50 / mes",
      cta:
        tier === null ? (
          signInCta()
        ) : tier === "FREE" ? (
          <CheckoutButton
            action={checkoutAction}
            plan="ENTERPRISE"
            label="Mejorar"
          />
        ) : tier === "ENTERPRISE" ? (
          currentPlanCta()
        ) : (
          paidPlanCta(portalAction)
        ),
    },
  ];

  return (
    <main className="min-h-dvh bg-surface">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-6 py-20">
        <header className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-display text-4xl tracking-tight text-navy">
            Planes y precios
          </h1>
          <p className="max-w-lg text-text-secondary">
            Auditorías GEO y reportes de visibilidad en IA para cada etapa.
          </p>
        </header>
        <PricingCards plans={plans} />
      </div>
    </main>
  );
}
