"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, Sparkles, X } from "lucide-react";
import { LogoutButton } from "@/ui/logout-button";
import { SHELL_COPY } from "@/lib/copy";
import { buildLinks } from "@/ui/nav-config";

/**
 * Client island for the mobile navigation (SHL-10, sprint 17): hamburger
 * toggle (md:hidden, rendered by the Navbar in its RIGHT container) + a
 * right-side drawer with the overlay, portaled to `document.body`. The
 * header's `backdrop-blur-md` creates a containing block for `fixed`
 * descendants (CSS Filter Effects L2), so an in-header drawer would anchor to
 * the 64px header instead of the viewport - the portal escapes it.
 *
 * A11y contract (SHL-10): the drawer closes on Escape, on overlay click and
 * on toggle activation; focus moves into the drawer when it opens and returns
 * to the toggle when it closes. The drawer is ALWAYS mounted (so
 * `aria-controls` never dangles) and carries `aria-hidden` + `inert` +
 * `pointer-events-none` while closed - unfocusable and excluded from role
 * queries. Non-modal by design (no focus trap, no page inert - locked scope).
 *
 * The session state arrives as serializable props resolved by the server
 * Navbar (D3): `isAuthenticated`/`displayName`/`initials`/`plan`. Drawer
 * links close on navigation so the route change never leaves a stale menu.
 */
export type MobileMenuProps = {
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

export function MobileMenu({
  showMultiPage = false,
  isAuthenticated = false,
  displayName = null,
  initials = "?",
  plan = null,
}: MobileMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // HYD-1 (sprint 17 hotfix): `createPortal(document.body, ...)` cannot run
  // during SSR - `document` is undefined server-side, which crashed the whole
  // shell with HTTP 500 (every page renders the Navbar). The portal only
  // mounts after hydration, so SSR renders the toggle alone and the drawer
  // appears on the client.
  const [mounted, setMounted] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const links = buildLinks(showMultiPage);
  const close = () => setOpen(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // A11y contract (SHL-10): focus moves into the drawer on open; Escape
  // closes from anywhere; focus returns to the toggle on any close path
  // (toggle, nav link, overlay, Escape). The `wasOpen` ref keeps the initial
  // mount from stealing focus.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      panelRef.current?.focus();
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setOpen(false);
        }
      };
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      toggleRef.current?.focus();
    }
  }, [open]);

  return (
    <>
      {/* SHL-10: mobile hamburger toggle - visible below md only. Plain button
          (no Button/IconButton primitive for icon-only actions, D3). The panel
          is always mounted via the portal so aria-controls never dangles. */}
      <button
        ref={toggleRef}
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

      {/* HYD-1: the drawer+overlay portal mounts ONLY after hydration (mounted).
          During SSR (mounted=false) the portal is skipped - no `document`
          access, no 500. The toggle stays visible in both passes. */}
      {mounted
        ? createPortal(
            <>
              <div
                aria-hidden="true"
                onClick={close}
                className={`fixed inset-0 z-50 bg-[#0f172a]/40 transition-opacity duration-250 ease-out motion-reduce:transition-none ${
                  open ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              />
              <div
                ref={panelRef}
                id="mobile-nav-panel"
                tabIndex={-1}
                inert={!open}
                aria-hidden={open ? undefined : true}
                className={`fixed inset-y-0 right-0 top-0 z-50 h-dvh w-80 max-w-[85vw] overflow-y-auto border-l border-[#e2e8f0] bg-white px-4 pb-6 pt-3 shadow-sm transition-transform duration-250 ease-out motion-reduce:transition-none ${
                  open ? "translate-x-0" : "translate-x-full"
                }`}
              >
                <nav
                  aria-label="Navegación móvil"
                  className="flex flex-col gap-1"
                >
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
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
