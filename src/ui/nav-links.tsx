"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Sparkles, X } from "lucide-react";
import { LogoutButton } from "@/ui/logout-button";
import { SHELL_COPY } from "@/lib/copy";

/**
 * Client island for the navbar's primary links (SHL-1, U1.9): renders
 * Producto → / with the active route highlighted the Gemini way (white pill +
 * border + emerald dot). Client-only because `usePathname` needs the router;
 * the Navbar shell stays a server component.
 *
 * U6.4 (MPU-6): a multi-page link (→ /multipage) is exposed to every
 * authenticated user - the Navbar resolves `showMultiPage` from the session
 * so anonymous visitors don't see the signed-in entry.
 *
 * SHL-10 (sprint 15): the mobile hamburger menu lives HERE, inside the client
 * island. Below `md` a plain button (lucide Menu/X) toggles a panel with ALL
 * primary links + the session-appropriate actions (sign-in/sign-up for anon;
 * plan pill + user chip + logout for authenticated). The session state is
 * serializable (D3): `isAuthenticated`/`displayName`/`initials`/`plan` are
 * resolved by the server Navbar and passed by prop - the panel closes on
 * navigation so the route change never leaves a stale open menu.
 */
const LINKS = [
  { href: "/", label: "Producto", match: (path: string) => path === "/" },
] as const;

const MULTI_PAGE_LINK = {
  href: "/multipage",
  label: "Multi-página",
  match: (path: string) => path.startsWith("/multipage"),
} as const;

export type NavLinksProps = {
  /** Show the signed-in multi-page link (MPU-6). Resolved by the server Navbar. */
  showMultiPage?: boolean;
  /** Serialized session flag (D3, SHL-10) - resolved by the server Navbar. */
  isAuthenticated?: boolean;
  /** User display name for the mobile user chip (D3). */
  displayName?: string | null;
  /** Avatar initials for the mobile user chip (D3). */
  initials?: string;
  /** Free-plan usage for the mobile plan pill (D3, SHL-2). */
  plan?: { used: number; limit: number } | null;
};

export function NavLinks({
  showMultiPage = false,
  isAuthenticated = false,
  displayName = null,
  initials = "?",
  plan = null,
}: NavLinksProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = showMultiPage ? [...LINKS, MULTI_PAGE_LINK] : LINKS;
  const close = () => setOpen(false);

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="hidden items-center gap-1.5 text-sm font-sans md:flex"
      >
        {links.map((link) => {
          const active = link.match(pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-white border border-[#cbd5e1] text-[#0f172a] shadow-xs"
                  : "border border-transparent text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              }`}
            >
              <span
                aria-hidden="true"
                className={`mr-2 h-1.5 w-1.5 rounded-full ${
                  active ? "bg-[#10b981]" : "border border-[#cbd5e1]"
                }`}
              />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* SHL-10: mobile hamburger toggle - visible below md only. Plain button
          (no Button/IconButton primitive for icon-only actions, D3). The panel
          is always mounted so aria-controls never dangles; it is hidden when
          closed. */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        className="inline-flex items-center justify-center rounded-md p-2 text-[#0f172a] transition-colors hover:bg-[#f1f5f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 md:hidden"
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      {/* SHL-10: mobile panel - ALL primary links + session actions. Absolute
          under the sticky header (top-16 = h-16 row). Closes on navigate. */}
      <div
        id="mobile-nav-panel"
        hidden={!open}
        className="absolute inset-x-0 top-16 z-50 border-b border-[#e2e8f0] bg-white px-4 pb-6 pt-3 shadow-sm md:hidden"
      >
        {open ? (
          <>
            <nav aria-label="Navegación móvil" className="flex flex-col gap-1">
              {links.map((link) => {
                const active = link.match(pathname);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-[#f1f5f9] text-[#0f172a]"
                        : "text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rounded-full ${
                        active ? "bg-[#10b981]" : "border border-[#cbd5e1]"
                      }`}
                    />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 flex flex-col gap-2 border-t border-[#e2e8f0] pt-3">
              {isAuthenticated ? (
                <>
                  {plan ? (
                    <span
                      className="flex items-center gap-1.5 rounded-full border border-[#10b981]/20 bg-[#10b981]/10 px-3 py-1 text-xs font-semibold text-[#047857]"
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
                    onClick={close}
                    title={`Sesión iniciada como ${displayName ?? ""}`}
                    className="flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white p-1 pl-2 pr-3 transition-colors hover:bg-[#f8fafc]"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#cbd5e1] text-[10px] font-bold text-[#0f172a]">
                      {initials}
                    </span>
                    <span className="text-[11px] font-bold leading-tight text-[#0f172a]">
                      {displayName}
                    </span>
                  </Link>

                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={close}
                    className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-[#0f172a] transition-colors hover:bg-[#f1f5f9]"
                  >
                    {SHELL_COPY.nav.login}
                  </Link>
                  <Link
                    href="/signup"
                    onClick={close}
                    className="inline-flex items-center justify-center rounded-md bg-[#0f172a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e293b]"
                  >
                    {SHELL_COPY.nav.signup}
                  </Link>
                </>
              )}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
