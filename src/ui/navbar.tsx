import Link from "next/link";
import type { Session } from "next-auth";
import { Sparkles } from "lucide-react";
import { LogoutButton } from "@/ui/logout-button";
import { Logo } from "@/ui/logo";
import { NavLinks } from "@/ui/nav-links";
import { isPaidTier } from "@/lib/audit/tier";
import type { NavPlan } from "@/lib/nav-plan";
import { SHELL_COPY } from "@/lib/copy";

type NavbarProps = {
  /** Auth session resolved by the layout via `auth()` (SHL-3). Optional for anon. */
  session?: Session | null;
  /** Plan + usage resolved by the layout for the plan pill (SHL-2). */
  plan?: NavPlan | null;
};

const TIER_LABEL: Record<NavPlan["tier"], string> = {
  FREE: "Free",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

/**
 * Navbar (SHL-1/2/3/4, U1.9): global responsive navigation, Gemini verbatim
 * shell (hex directos). Sync server component that receives `session` (and
 * the `plan` pill data) by prop — the layout resolves `auth()`/prisma because
 * an async server component can't be awaited inside RTL tests. The active-route
 * links live in the client `NavLinks` island (usePathname); logout is the
 * existing client `LogoutButton` island.
 */
export function Navbar({ session, plan }: NavbarProps) {
  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join("")
    : "?";

  return (
    <header className="sticky top-0 z-40 border-b border-[#e2e8f0] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            aria-label="GeoAudit Inicio"
            className="flex items-center text-left transition-colors hover:text-emerald-700"
          >
            <Logo size={32} />
          </Link>

          <NavLinks showMultiPage={isPaidTier(plan?.tier ?? "FREE")} />
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {plan ? (
                <Link
                  href="/pricing"
                  className="hidden items-center gap-1.5 rounded-full border border-[#10b981]/20 bg-[#10b981]/10 px-3 py-1 text-xs font-semibold text-[#10b981] transition-colors hover:bg-[#10b981]/20 sm:inline-flex"
                  title={`Plan ${TIER_LABEL[plan.tier]}: ${plan.used}/${plan.limit} auditorías usadas`}
                >
                  <Sparkles
                    className="h-3 w-3 text-[#10b981]"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[10px] uppercase tracking-wider">
                    Plan {TIER_LABEL[plan.tier]}
                  </span>
                  <span className="font-mono text-[#0f172a]">
                    ({plan.used}/{plan.limit})
                  </span>
                </Link>
              ) : null}

              <Link
                href="/dashboard"
                title={`Sesión iniciada como ${user.name ?? user.email ?? ""}`}
                className="flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white p-1 pl-2 pr-3 shadow-xs transition-colors hover:bg-[#f8fafc]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#cbd5e1] text-[10px] font-bold text-[#0f172a]">
                  {initials}
                </span>
                <span className="hidden text-[11px] font-bold leading-tight text-[#0f172a] md:block">
                  {user.name?.split(" ")[0] ?? user.email}
                </span>
              </Link>

              <LogoutButton />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-[#0f172a] transition-colors hover:bg-[#f1f5f9]"
              >
                {SHELL_COPY.nav.login}
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-md bg-[#0f172a] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1e293b]"
              >
                {SHELL_COPY.nav.signup}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
