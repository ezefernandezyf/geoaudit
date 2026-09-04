/**
 * Shared helpers for the per-page accessibility tests (C14, A11Y-2/4/5).
 * Kept outside `*.test.*` so vitest does not pick it up as a suite.
 */

/** Focusable selector (A11Y-5 focus order): links, enabled form controls and
 * any explicit tabindex - in DOM order, which is the tab order. */
const FOCUSABLE_SELECTOR =
  "a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]";

/** Interactive elements in document (tab) order within `root`.
 * Subtrees that are `inert` or `aria-hidden` are excluded: in a real browser
 * inert elements are removed from the tab order, and aria-hidden content is
 * not exposed to ATs (SHL-10 closed mobile drawer is both). */
export function focusableElements(root: ParentNode): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => !el.closest("[inert], [aria-hidden='true']"));
}

/**
 * Asserts the logical focus order contract shared by every page shell:
 * the first tab stop is the brand link, the last is the footer "Contacto"
 * link (LND-12 added the mailto contact after Privacidad), and no element
 * uses a positive tabindex (the axe `tabindex` rule is also covered by the
 * shell axe scan).
 */
export function assertLogicalFocusOrder(focusable: HTMLElement[]): void {
  if (focusable.length <= 5) {
    throw new Error(
      `expected more than 5 focusable elements, got ${focusable.length}`,
    );
  }
  if (focusable[0].getAttribute("aria-label") !== "Relevy") {
    throw new Error(
      `expected first tab stop to be the brand link, got ${focusable[0].outerHTML}`,
    );
  }
  if (!focusable[focusable.length - 1].textContent?.includes("Contacto")) {
    throw new Error(
      `expected last tab stop to be the footer Contacto link, got ${focusable[focusable.length - 1].outerHTML}`,
    );
  }
  for (const el of focusable) {
    const tabIndex = el.getAttribute("tabindex");
    if (tabIndex !== null && Number(tabIndex) > 0) {
      throw new Error(`positive tabindex=${tabIndex} found on ${el.outerHTML}`);
    }
  }
}
