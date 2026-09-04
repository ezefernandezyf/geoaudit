import Link from "next/link";
import type { Session } from "next-auth";
import { Sparkles } from "lucide-react";
import { LogoutButton } from "@/ui/logout-button";
import { Logo } from "@/ui/logo";
import { MobileMenu } from "@/ui/mobile-menu";
import { NavLinks } from "@/ui/nav-links";
import type { NavPlan } from "@/lib/nav-plan";
import { SHELL_COPY } from "@/lib/copy";

type NavbarProps = {
  /** Auth session resolved by the layout via `auth()` (SHL-3). Optional for anon. */
  session?: Session | null;
  /** Usage for the plan pill (SHL-2). Resolved by the layout; optional for anon. */
  plan?: NavPlan | null;
};

/**
 * Navbar (SHL-1/2/3/4, U1.9): global responsive navigation, Gemini verbatim
 * shell (hex directos). Sync server component that receives `session` (and
 * the `plan` pill data) by prop - the layout resolves `auth()`/prisma because
 * an async server component can't be awaited inside RTL tests. The active-route
 * links live in the client `NavLinks` island (usePathname); logout is the
 * existing client `LogoutButton` island.
 *
 * SHL-2: the plan pill is a STATIC "Free" label + usage (used/limit) - no
 * `/pricing` href (route deleted), no tier-dependent label. MPU-6: the
 * multi-page link is exposed to every authenticated user.
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
            // PERF-3: label-content-name-mismatch (WCAG 2.5.3). axe 4.x compara
            // el nombre accesible contra el textContent del link como substring
            // EXACTO (case-insensitive, sin normalizar espacios) - el em dash
            // o un espacio extra rompe el match. El Logo emite solo el
            // wordmark "Relevy" (tagline eliminado, SHL-4), así que el
            // aria-label debe ser EXACTO "Relevy" (y el mark SVG es
            // decorative: su texto no debe filtrarse al textContent del link).
            aria-label="Relevy"
            className="flex items-center text-left transition-colors hover:text-emerald-700"
          >
            <Logo size={32} decorative />
          </Link>

          <NavLinks showMultiPage={Boolean(user)} />
        </div>

        {/* Desktop actions hide below md; the mobile drawer island owns the
            md:hidden toggle on the far right (SHL-10, sprint 17) - the drawer
            + overlay portal to document.body (the header's backdrop-blur-md
            is a containing block for fixed descendants). */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden items-center gap-3 md:flex">
              {plan ? (
                <span
                  className="hidden items-center gap-1.5 rounded-full border border-[#10b981]/20 bg-[#10b981]/10 px-3 py-1 text-xs font-semibold text-[#047857] sm:inline-flex"
                  title={`Plan Free: ${plan.used}/${plan.limit} auditorías usadas`}
                >
                  <Sparkles
                    className="h-3 w-3 text-[#10b981]"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[10px] uppercase tracking-wider">
                    Plan Free
                  </span>
                  <span className="font-mono text-[#0f172a]">
                    ({plan.used}/{plan.limit})
                  </span>
                </span>
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
            <div className="hidden items-center gap-2 md:flex">
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

          <MobileMenu
            showMultiPage={Boolean(user)}
            isAuthenticated={Boolean(user)}
            displayName={user?.name ?? null}
            initials={initials}
            plan={plan}
          />
        </div>
      </div>
    </header>
  );
}
