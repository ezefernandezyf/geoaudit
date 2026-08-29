import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { countAuditsInWindow, FREE_AUDIT_LIMIT } from "@/lib/audit/tier";
import { PROFILE_COPY } from "@/lib/copy";

/**
 * Profile page (PRF-1..6, design U4).
 *
 * Authenticated account surface (PRF-1: middleware + redirect gate). Reads the
 * real `User` row (PRF-2) and shows audit usage against the single FREE limit
 * (PRF-4): `Audit` rows in the 30-day moving window, limit `FREE_AUDIT_LIMIT`.
 *
 * Sprint 10 (PRF-3/5): there is ONE plan — the pill is always "Free" (no tier
 * lookup) and subscription management is REMOVED with the billing capability —
 * no portal action, no upgrade CTA. Support entry (PRF-6) via email (the
 * /pricing link was removed with the route, WU-1).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  });
  const name = user?.name ?? session.user.name ?? null;
  const email = user?.email ?? session.user.email ?? null;

  // PRF-4 usage: the same 30-day window as the audit gate (TLM-2).
  const used = await countAuditsInWindow(prisma, session.user.id, Date.now());
  const limit = FREE_AUDIT_LIMIT;
  const pct = Math.min(100, Math.round((used / limit) * 100));

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

        {/* Identity card — PRF-2/3: name, email, plan pill + usage bar (PRF-4). */}
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
              free
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
        </section>
      </div>
    </main>
  );
}
