import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkoutAction, portalAction } from "@/billing/actions";
import { CheckoutButton, type CheckoutAction } from "@/billing/checkout-button";
import { PricingCards, type PricingPlan } from "@/billing/pricing-cards";
import { PRICING_COPY } from "@/lib/copy";
import { buildOgMetadata } from "@/lib/og";
import type { Tier } from "@/lib/contracts/billing";

/**
 * Pricing page (PRC-1/2/3/5/6/7, design U3).
 *
 * Public route — the middleware only guards /dashboard/*. Server component:
 * `auth()` resolves the visitor's tier (from the DB — the session carries only
 * `user.id`, design decision) and renders the monthly-only plan catalog with a
 * CTA adapted to auth state (PRC-3): anonymous → sign-in; FREE → checkout
 * ("Mejorar"); paid → portal ("Gestionar suscripción", slot Free card) or
 * "Plan activo" on the current plan; a paid user upgrading to Enterprise gets
 * the real checkout CTA. No annual toggle / discounted price (PRC-5).
 *
 * Header + FAQ are driven by `PRICING_COPY` (copy.ts source-of-truth): the
 * Gemini verbatim intro (PRC-5) and the billing FAQ (PRC-7). Styles are hex
 * directos — no semantic token classes (DNF-9).
 *
 * `PricingCards` is presentational; this page supplies each card's CTA node
 * and real feature list.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * PRC-8 (sprint 8, C16): pricing OpenGraph/Twitter metadata via the shared
 * helper — reuses the page title/description and the shared 1200×630 og.png.
 */
export const metadata = buildOgMetadata({
  title: "Planes y precios",
  description:
    "Desde 3 auditorías gratuitas hasta planes profesionales con monitoreo continuo, auditorías multi-página y reportes PDF compartibles.",
  path: "/pricing",
});

function currentPlanCta(): React.ReactNode {
  return (
    <p className="text-center text-sm font-medium text-[#475569]">
      Plan activo
    </p>
  );
}

function signInCta(label = "Iniciar sesión"): React.ReactNode {
  return (
    <Link
      href="/login"
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#0f172a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e293b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-2"
    >
      {label}
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
      features: [
        "3 auditorías por 30 días",
        "GEO Score completo 0-100",
        "Reporte de visibilidad en IA",
      ],
      cta:
        tier === null
          ? signInCta("Empezar")
          : tier === "FREE"
            ? currentPlanCta()
            : paidPlanCta(portalAction),
    },
    {
      id: "PRO",
      name: "Pro",
      price: "$9/mes",
      limit: "10 / mes",
      features: [
        "10 auditorías por mes",
        "Auditoría multi-página",
        "Exportar reporte a PDF",
        "Links de compartición",
      ],
      featured: true,
      cta:
        tier === null ? (
          signInCta()
        ) : tier === "FREE" ? (
          <CheckoutButton action={checkoutAction} plan="PRO" label="Mejorar" />
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
      features: [
        "50 auditorías por mes",
        "Todo lo incluido en Pro",
        "Volumen para equipos y agencias",
      ],
      cta:
        tier === null ? (
          signInCta()
        ) : tier === "FREE" || tier === "PRO" ? (
          <CheckoutButton
            action={checkoutAction}
            plan="ENTERPRISE"
            label="Mejorar"
          />
        ) : (
          currentPlanCta()
        ),
    },
  ];

  return (
    <main className="min-h-dvh bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-12 px-6 py-20">
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#64748b]">
            {PRICING_COPY.header.eyebrow}
          </span>
          <h1 className="font-serif text-4xl font-normal tracking-tight text-[#0f172a] sm:text-5xl">
            {PRICING_COPY.header.title}
          </h1>
          <p className="max-w-xl font-sans text-base text-[#475569]">
            {PRICING_COPY.header.subtitle}
          </p>
        </header>
        <PricingCards plans={plans} />
        <section className="w-full max-w-4xl" aria-labelledby="faq-heading">
          <h2
            id="faq-heading"
            className="text-center font-serif text-3xl font-normal text-[#0f172a]"
          >
            {PRICING_COPY.faq.title}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6 sm:p-8 md:grid-cols-2">
            {PRICING_COPY.faq.items.map((item) => (
              <div key={item.q} className="font-sans text-xs">
                <p className="mb-1 font-semibold text-[#0f172a]">{item.q}</p>
                <p className="leading-relaxed text-[#475569]">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
