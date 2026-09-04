import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NavLinks } from "@/ui/nav-links";

/**
 * SHL-10 (sprint 17): NavLinks is the DESKTOP-only island - it renders the
 * primary links with the active-route highlight and renders NO mobile
 * toggle/panel (those moved to the `MobileMenu` island in mobile-menu.test.tsx).
 *
 * next/link is stubbed as a plain anchor (the router context is mocked out in
 * this harness).
 */
const nav = vi.hoisted(() => ({ usePathname: vi.fn(() => "/") }));
vi.mock("next/navigation", () => ({ usePathname: nav.usePathname }));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("NavLinks desktop nav (SHL-10)", () => {
  it("renders the desktop nav links with the active route highlighted", () => {
    render(<NavLinks />);

    const desktop = screen.getByRole("navigation", {
      name: "Navegación principal",
    });
    expect(
      within(desktop).getByRole("link", { name: "Producto" }),
    ).toHaveAttribute("href", "/");
    expect(
      within(desktop).getByRole("link", { name: "Producto" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("exposes the multi-page link only when showMultiPage is set", () => {
    const { rerender } = render(<NavLinks />);
    expect(
      screen.queryByRole("link", { name: "Multi-página" }),
    ).not.toBeInTheDocument();

    rerender(<NavLinks showMultiPage />);
    const desktop = screen.getByRole("navigation", {
      name: "Navegación principal",
    });
    expect(
      within(desktop).getByRole("link", { name: "Multi-página" }),
    ).toHaveAttribute("href", "/multipage");
  });

  it("renders no mobile toggle (desktop-only island)", () => {
    render(<NavLinks showMultiPage />);
    expect(screen.queryByRole("button", { name: /menú/i })).toBeNull();
  });
});
