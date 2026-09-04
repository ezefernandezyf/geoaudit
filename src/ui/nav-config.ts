/**
 * Shared primary nav link definitions (SHL-10, sprint 17): single source for
 * the desktop `NavLinks` island and the mobile `MobileMenu` drawer, so the
 * two surfaces can never drift apart. Extracted from the old client island
 * (where the mobile panel duplicated the desktop link list).
 */

/** Product link - the landing/audit entry, active only on the root route. */
export const LINKS = [
  { href: "/", label: "Producto", match: (path: string) => path === "/" },
] as const;

/** Multi-page audit link - signed-in users only (MPU-6). */
export const MULTI_PAGE_LINK = {
  href: "/multipage",
  label: "Multi-página",
  match: (path: string) => path.startsWith("/multipage"),
} as const;

/**
 * Resolves the link list for the session: authenticated users get the
 * multi-page entry appended; anonymous visitors keep just Producto.
 */
export const buildLinks = (showMultiPage: boolean) =>
  showMultiPage ? [...LINKS, MULTI_PAGE_LINK] : LINKS;
