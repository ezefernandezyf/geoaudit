"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildLinks } from "@/ui/nav-config";

/**
 * Client island for the navbar's DESKTOP primary links (SHL-1, U1.9):
 * renders Producto → / with the active route highlighted the Gemini way
 * (white pill + border + emerald dot). Client-only because `usePathname`
 * needs the router; the Navbar shell stays a server component.
 *
 * SHL-10 (sprint 17): the mobile hamburger moved OUT of this island into the
 * dedicated `MobileMenu` island (toggle in the navbar's right container,
 * drawer+overlay portaled to document.body). This component is desktop-only
 * (`hidden md:flex`) and renders no toggle/panel of its own. The link list is
 * shared via `nav-config.ts` so desktop and mobile never drift.
 *
 * U6.4 (MPU-6): a multi-page link (→ /multipage) is exposed to every
 * authenticated user - the Navbar resolves `showMultiPage` from the session
 * so anonymous visitors don't see the signed-in entry.
 */
export type NavLinksProps = {
  /** Show the signed-in multi-page link (MPU-6). Resolved by the server Navbar. */
  showMultiPage?: boolean;
};

export function NavLinks({ showMultiPage = false }: NavLinksProps) {
  const pathname = usePathname();
  const links = buildLinks(showMultiPage);

  return (
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
  );
}
