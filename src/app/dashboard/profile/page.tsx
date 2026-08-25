import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { portalAction } from "@/billing/actions";
import { CheckoutButton } from "@/billing/checkout-button";
import {
  countAuditsInWindow,
  getTierLimit,
  isPaidTier,
  resolvePaidCounter,
} from "@/lib/audit/tier";
import { PROFILE_COPY } from "@/lib/copy";
import type { Tier } from "@/lib/contracts/billing";

/**
 * Profile page (PRF-1..6, design U4).
 *
 * Authenticated account surface (PRF-1: middleware + redirect gate). Reads the
 * real `User` + `Subscription` rows (PRF-2/3) and shows audit usage against
 * the tier limit (PRF-4): FREE counts `Audit` rows in the 30-day moving
 * window; PRO/ENTERPRISE use the Subscription-backed paid counter (lazy
 * period-end reset via `resolvePaidCounter`, same logic as `checkTierLimit`).
 *
 * Subscription management (PRF-5): paid users get the portal action
 * ("Gestionar suscripción"); FREE users get an upgrade CTA to `/pricing`.
 * Support entry (PRF-6) via email + pricing links. Read-only — no new billing
 * logic; the portal reuses the existing Server Action.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Lowercase plan pill label, Gemini style (matches runner-bar/nav). */
const TIER_LABEL: Record<Tier, string> = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise",
};

function initialsFor(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  const source = name ?? email ?? "?";
  return source
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  });
  const tier: Tier = user?.tier ?? "FREE";
  const name = user?.name ?? session.user.name ?? null;
  const email = user?.email ?? session.user.email ?? null;

  // PRF-4 usage: same counter-selection as the audit gate (TLM-8).
  let used = 0;
  if (isPaidTier(tier)) {
    const sub = user?.subscription;
    const resolved = resolvePaidCounter(
      Date.now(),
      sub?.auditsUsed ?? 0,
      sub?.auditsResetAt ?? null,
      sub?.currentPeriodEnd ?? null,
    );
    used = resolved.used;
  } else {
    used = await countAuditsInWindow(
      prisma as never,
      session.user.id,
      Date.now(),
    );
  }
  const limit = getTierLimit(tier);
  const pct = limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));

  const isPaid = isPaidTier(tier);

  return (
    <main className="min-h-dvh bg-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6">
        <header className="flex flex-col gap-3">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-[#64748b]">
            {PROFILE_COPY.eyebrow}
          </span>
          <h1 className="font-serif text-4xl font-normal tracking-tight text-[#0f172a]">
            {PROFILE_COPY.title}
          </h1>
          <p className="font-sans text-base text-[#475569]">
            {PROFILE_COPY.subtitle}
          </p>
        </header>

        {/* Identity card — PRF-2/3: name, email, tier pill + usage bar (PRF-4). */}
        <section
          aria-label="Datos de la cuenta"
          className="rounded-xl border border-[#e2e8f0] bg-white p-6"
        >
          <div className="flex items-center gap-4">
            <div
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0f172a] font-serif text-lg text-white"
            >
              {initialsFor(name, email)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-sans text-lg font-semibold text-[#0f172a]">
                {name ?? "Usuario"}
              </p>
              <p className="truncate font-sans text-sm text-[#475569]">
                {email ?? ""}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <span className="font-sans text-xs uppercase tracking-wider text-[#64748b]">
              {PROFILE_COPY.identity.tierLabel}
            </span>
            <span className="rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-2.5 py-0.5 font-mono text-xs text-[#047857]">
              {TIER_LABEL[tier]}
            </span>
          </div>

          <div className="mt-6">
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-sm font-medium text-[#0f172a]">
                {PROFILE_COPY.identity.usageTitle}
              </span>
              <span className="font-mono text-sm text-[#0f172a]">
                {used} / {limit}
              </span>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#f1f5f9]"
              role="progressbar"
              aria-valuenow={used}
              aria-valuemin={0}
              aria-valuemax={limit}
              aria-label={`${used} de ${limit} auditorías usadas`}
            >
              <div
                className="h-full rounded-full bg-[#10b981]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 font-sans text-xs text-[#64748b]">
              {PROFILE_COPY.identity.usageCaption}
            </p>
          </div>
        </section>

        {/* Subscription management — PRF-5. */}
        <section
          aria-label="Suscripción"
          className="rounded-xl border border-[#e2e8f0] bg-white p-6"
        >
          {isPaid ? (
            <>
              <p className="font-sans text-sm leading-relaxed text-[#475569]">
                {PROFILE_COPY.manage.portalBlurb}
              </p>
              <div className="mt-4">
                <CheckoutButton
                  action={portalAction}
                  plan={tier === "ENTERPRISE" ? "ENTERPRISE" : "PRO"}
                  label={PROFILE_COPY.manage.portalCta}
                />
              </div>
            </>
          ) : (
            <>
              <p className="font-sans text-sm leading-relaxed text-[#475569]">
                {PROFILE_COPY.manage.upgradeBlurb}
              </p>
              <Link
                href={PROFILE_COPY.support.pricingHref}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-[#0f172a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e293b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-2"
              >
                {PROFILE_COPY.manage.upgradeCta}
              </Link>
            </>
          )}
        </section>

        {/* Support entry — PRF-6. */}
        <section
          aria-label="Soporte"
          className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-6"
        >
          <h2 className="font-serif text-xl font-normal text-[#0f172a]">
            {PROFILE_COPY.support.title}
          </h2>
          <p className="mt-1 font-sans text-sm leading-relaxed text-[#475569]">
            {PROFILE_COPY.support.blurb}
          </p>
          <a
            href={`mailto:${PROFILE_COPY.support.email}`}
            className="mt-3 inline-flex items-center gap-2 font-mono text-sm text-[#0f172a] underline decoration-[#10b981] underline-offset-4 transition-colors hover:text-[#047857]"
          >
            {PROFILE_COPY.support.email}
          </a>
          <div className="mt-4">
            <Link
              href={PROFILE_COPY.support.pricingHref}
              className="font-sans text-sm font-medium text-[#047857] transition-colors hover:text-[#065f46]"
            >
              {PROFILE_COPY.support.pricingLink}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
