import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NavLinks } from "@/ui/nav-links";

/**
 * SHL-10 (sprint 15): mobile hamburger menu. NavLinks (client island) owns a
 * `useState(open)` toggle: below `md` a plain button (lucide Menu/X) opens a
 * panel with ALL primary links + the session-appropriate actions; the desktop
 * nav (`hidden md:flex`) renders unchanged. The Navbar shell stays a sync
 * server component - session state arrives as serializable props (D3).
 *
 * next/link is stubbed as a plain anchor so clicking a panel link actually
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

function renderLinks(props: Partial<Parameters<typeof NavLinks>[0]> = {}) {
  return render(<NavLinks {...ANON_PROPS} {...props} />);
}

/** The whole mobile panel (links + actions) by its id - the actions div is a
 * sibling of the inner nav landmark, so `within(nav)` would miss them. */
function mobilePanel(container: HTMLElement): HTMLElement {
  const panel = container.querySelector("#mobile-nav-panel");
  expect(panel).not.toBeNull();
  return panel as HTMLElement;
}

describe("NavLinks mobile hamburger (SHL-10)", () => {
  it("opens the panel with links and sign-in/sign-up actions for anonymous users", () => {
    const { container } = renderLinks({ showMultiPage: true });

    // Closed by default: no mobile panel, toggle collapsed.
    const toggle = screen.getByRole("button", { name: "Abrir menú" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "mobile-nav-panel");
    expect(
      screen.queryByRole("navigation", { name: "Navegación móvil" }),
    ).toBeNull();

    fireEvent.click(toggle);

    const panel = mobilePanel(container);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    // All primary links are reachable in the panel (Producto + Multi-página).
    expect(
      within(panel).getByRole("link", { name: "Producto" }),
    ).toHaveAttribute("href", "/");
    expect(
      within(panel).getByRole("link", { name: "Multi-página" }),
    ).toHaveAttribute("href", "/multipage");
    // Anonymous actions are present in the panel (SHL-10).
    expect(
      within(panel).getByRole("link", { name: "Inicie sesión" }),
    ).toHaveAttribute("href", "/login");
    expect(
      within(panel).getByRole("link", { name: "Cree su cuenta" }),
    ).toHaveAttribute("href", "/signup");
  });

  it("exposes the plan pill, user chip and logout to authenticated users in the panel", () => {
    const { container } = renderLinks(AUTH_PROPS);

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));

    const panel = mobilePanel(container);
    expect(within(panel).getByText("Plan Free")).toBeInTheDocument();
    expect(within(panel).getByText(/(2\/10)/)).toBeInTheDocument();
    // User chip: initials + name.
    expect(within(panel).getByText("MT")).toBeInTheDocument();
    expect(within(panel).getByText("Martina Test")).toBeInTheDocument();
    // Logout action is reachable inside the panel (SHL-10).
    expect(within(panel).getByLabelText("Cierra sesión")).toBeInTheDocument();
    // No login/signup links for an authenticated session.
    expect(
      within(panel).queryByRole("link", { name: "Inicie sesión" }),
    ).toBeNull();
  });

  it("closes the panel when the toggle is activated again", () => {
    const { container } = renderLinks({ showMultiPage: true });

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    expect(mobilePanel(container)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar menú" }));
    expect(toggleIsExpanded()).toBe(false);
    expect(
      screen.queryByRole("navigation", { name: "Navegación móvil" }),
    ).toBeNull();
  });

  it("closes the panel when a nav link is activated", () => {
    const { container } = renderLinks();

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    const panel = mobilePanel(container);

    fireEvent.click(within(panel).getByRole("link", { name: "Producto" }));
    expect(
      screen.queryByRole("navigation", { name: "Navegación móvil" }),
    ).toBeNull();
  });

  it("keeps the desktop nav unchanged and the panel closed above md", () => {
    renderLinks({ showMultiPage: true });

    // The desktop nav still renders the links with the active route highlight.
    const desktop = screen.getByRole("navigation", {
      name: "Navegación principal",
    });
    expect(
      within(desktop).getByRole("link", { name: "Producto" }),
    ).toHaveAttribute("href", "/");
    expect(
      within(desktop).getByRole("link", { name: "Producto" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(desktop).getByRole("link", { name: "Multi-página" }),
    ).toHaveAttribute("href", "/multipage");
    // The toggle is the only mobile-only affordance and starts collapsed.
    expect(screen.getByRole("button", { name: "Abrir menú" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(
      screen.queryByRole("navigation", { name: "Navegación móvil" }),
    ).toBeNull();
  });
});

function toggleIsExpanded(): boolean {
  const toggle = screen.getByRole("button", { name: /menú/i });
  return toggle.getAttribute("aria-expanded") === "true";
}
