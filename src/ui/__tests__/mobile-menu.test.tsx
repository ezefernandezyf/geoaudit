import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileMenu } from "@/ui/mobile-menu";

/**
 * SHL-10 (sprint 17): mobile drawer island. The toggle lives in the navbar's
 * RIGHT container (md:hidden); the drawer + overlay are portaled to
 * document.body so they escape the header's `backdrop-blur-md` containing
 * block (CSS Filter Effects L2) - in-header `fixed` would anchor to the 64px
 * header. A11y contract: Escape closes, overlay click closes, toggle
 * activation toggles; focus moves into the drawer on open and returns to the
 * toggle on close; the closed drawer is `aria-hidden` + `inert` (excluded
 * from role queries, unfocusable).
 *
 * NOTE: because the drawer renders through a portal, `container.querySelector`
 * (the render root) can never see it - all panel queries go through
 * `document`/`screen` (the portal target is document.body).
 *
 * next/link is stubbed as a plain anchor so clicking a drawer link actually
 * fires its onClick (the router context is mocked out in this harness).
 */
const nav = vi.hoisted(() => ({ usePathname: vi.fn(() => "/") }));
vi.mock("next/navigation", () => ({ usePathname: nav.usePathname }));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

const ANON_PROPS = { isAuthenticated: false };
const AUTH_PROPS = {
  isAuthenticated: true,
  displayName: "Martina Test",
  initials: "MT",
  plan: { used: 2, limit: 10 },
};

function renderMenu(props: Partial<Parameters<typeof MobileMenu>[0]> = {}) {
  return render(<MobileMenu {...ANON_PROPS} {...props} />);
}

/** The portaled drawer by id - a child of document.body, never the render root. */
function mobilePanel(): HTMLElement {
  const panel = document.querySelector("#mobile-nav-panel");
  expect(panel).not.toBeNull();
  return panel as HTMLElement;
}

describe("MobileMenu drawer (SHL-10)", () => {
  it("opens the drawer with links and sign-in/sign-up actions for anonymous users", () => {
    renderMenu({ showMultiPage: true });

    // Closed by default: toggle collapsed, no mobile nav exposed.
    const toggle = screen.getByRole("button", { name: "Abrir menú" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "mobile-nav-panel");
    expect(
      screen.queryByRole("navigation", { name: "Navegación móvil" }),
    ).toBeNull();

    fireEvent.click(toggle);

    const panel = mobilePanel();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    // All primary links are reachable in the drawer (Producto + Multi-página).
    expect(
      within(panel).getByRole("link", { name: "Producto" }),
    ).toHaveAttribute("href", "/");
    expect(
      within(panel).getByRole("link", { name: "Multi-página" }),
    ).toHaveAttribute("href", "/multipage");
    // Anonymous actions are present in the drawer (SHL-10).
    expect(
      within(panel).getByRole("link", { name: "Inicie sesión" }),
    ).toHaveAttribute("href", "/login");
    expect(
      within(panel).getByRole("link", { name: "Cree su cuenta" }),
    ).toHaveAttribute("href", "/signup");
  });

  it("exposes the plan pill, user chip and logout to authenticated users in the drawer", () => {
    renderMenu(AUTH_PROPS);

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));

    const panel = mobilePanel();
    expect(within(panel).getByText("Plan Free")).toBeInTheDocument();
    expect(within(panel).getByText(/(2\/10)/)).toBeInTheDocument();
    // User chip: initials + name.
    expect(within(panel).getByText("MT")).toBeInTheDocument();
    expect(within(panel).getByText("Martina Test")).toBeInTheDocument();
    // Logout action is reachable inside the drawer (SHL-10).
    expect(within(panel).getByLabelText("Cierra sesión")).toBeInTheDocument();
    // No login/signup links for an authenticated session.
    expect(
      within(panel).queryByRole("link", { name: "Inicie sesión" }),
    ).toBeNull();
  });

  it("closes the drawer when the toggle is activated again", () => {
    renderMenu({ showMultiPage: true });

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    expect(mobilePanel()).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar menú" }));
    expect(toggleIsExpanded()).toBe(false);
    expect(
      screen.queryByRole("navigation", { name: "Navegación móvil" }),
    ).toBeNull();
  });

  it("closes the drawer when a nav link is activated", () => {
    renderMenu();

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    const panel = mobilePanel();

    fireEvent.click(within(panel).getByRole("link", { name: "Producto" }));
    expect(
      screen.queryByRole("navigation", { name: "Navegación móvil" }),
    ).toBeNull();
  });

  it("starts collapsed with the drawer hidden below md", () => {
    renderMenu({ showMultiPage: true });

    // The toggle is the mobile-only affordance and starts collapsed.
    expect(screen.getByRole("button", { name: "Abrir menú" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(
      screen.queryByRole("navigation", { name: "Navegación móvil" }),
    ).toBeNull();
  });

  it("portals the drawer and overlay to document.body (SHL-10)", () => {
    renderMenu();

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));

    const panel = mobilePanel();
    // Direct children of body - the portal escapes the header (backdrop-blur
    // containing block), never a descendant of the navbar.
    expect(panel.parentElement).toBe(document.body);
    expect(panel.closest("header")).toBeNull();
    const overlay = panel.previousElementSibling;
    expect(overlay).not.toBeNull();
    expect(overlay?.parentElement).toBe(document.body);
  });

  it("keeps the closed drawer aria-hidden and inert (SHL-10)", () => {
    renderMenu();

    // Always mounted (aria-controls never dangles) but hidden from ATs.
    const panel = mobilePanel();
    expect(panel).toHaveAttribute("aria-hidden", "true");
    expect(panel).toHaveAttribute("inert");
    // Excluded from role queries while closed (RTL skips aria-hidden subtrees).
    expect(
      screen.queryByRole("navigation", { name: "Navegación móvil" }),
    ).toBeNull();
  });

  it("closes on Escape and returns focus to the toggle (SHL-10)", () => {
    renderMenu();

    const toggle = screen.getByRole("button", { name: "Abrir menú" });
    fireEvent.click(toggle);
    // Focus moves into the drawer when it opens.
    const panel = mobilePanel();
    expect(panel.contains(document.activeElement)).toBe(true);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(toggle);
  });

  it("closes on overlay click and returns focus to the toggle (SHL-10)", () => {
    renderMenu();

    const toggle = screen.getByRole("button", { name: "Abrir menú" });
    fireEvent.click(toggle);

    const panel = mobilePanel();
    const overlay = panel.previousElementSibling as HTMLElement;
    expect(overlay).not.toBeNull();

    fireEvent.click(overlay);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(toggle);
  });
});

function toggleIsExpanded(): boolean {
  const toggle = screen.getByRole("button", { name: /menú/i });
  return toggle.getAttribute("aria-expanded") === "true";
}
