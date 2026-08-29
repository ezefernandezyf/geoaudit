import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Navbar } from "@/ui/navbar";
import { LogoutButton } from "@/ui/logout-button";

/**
 * U1.9 — Navbar (SHL-1..4): sync server component receiving session + plan by
 * prop. Anonymous → "Inicie sesión"/"Cree su cuenta" (SHL-6, neutral shell
 * copy from copy.ts); authenticated → plan pill + user chip + logout; active
 * route via the client NavLinks island (usePathname mocked here).
 */
const nav = vi.hoisted(() => ({ usePathname: vi.fn(() => "/") }));
vi.mock("next/navigation", () => ({ usePathname: nav.usePathname }));

const PRO_SESSION = {
  user: { name: "Martina Test", email: "m@example.com" },
  expires: "2099-01-01T00:00:00.000Z",
};

describe("Navbar (SHL-2/3/4)", () => {
  it("links the logo to home", () => {
    render(<Navbar />);
    const logo = screen.getByLabelText("GeoAudit AI Visibility Audit");
    expect(logo).toHaveAttribute("href", "/");
  });

  it("shows the new logo and wordmark", () => {
    render(<Navbar />);
    // The SVG mark is decorative inside the brand link (the link owns the
    // accessible name, WU-4) — assert the visible wordmark + tagline.
    expect(screen.getByText("GeoAudit")).toBeInTheDocument();
    expect(screen.getByText("AI Visibility Audit")).toBeInTheDocument();
  });

  it("links Producto to /", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Producto" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("shows login/signup links to anonymous visitors (SHL-6, neutral)", () => {
    render(<Navbar session={null} />);
    expect(screen.getByRole("link", { name: "Inicie sesión" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(
      screen.getByRole("link", { name: "Cree su cuenta" }),
    ).toHaveAttribute("href", "/signup");
  });

  it("shows the static Free pill with usage for an authenticated user (SHL-2)", () => {
    render(<Navbar session={PRO_SESSION} plan={{ used: 2, limit: 10 }} />);
    // The pill is a static label, not a link — there is no /pricing href
    // (route deleted) and no tier-dependent label.
    expect(screen.getByText("Plan Free")).toBeInTheDocument();
    expect(screen.getByText(/\(2\/10\)/)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Plan Free/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Plan Pro/ })).toBeNull();
  });

  it("renders no plan pill for an authenticated user without plan data", () => {
    render(<Navbar session={PRO_SESSION} plan={null} />);
    expect(screen.queryByText("Plan Free")).not.toBeInTheDocument();
  });

  it("shows avatar initials + logout and hides login links to authenticated users (SHL-3)", () => {
    render(<Navbar session={PRO_SESSION} plan={null} />);
    expect(screen.queryByRole("link", { name: "Inicie sesión" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Cree su cuenta" })).toBeNull();
    expect(screen.getByText("MT")).toBeInTheDocument(); // avatar initials
    expect(screen.getByLabelText("Cierra sesión")).toBeInTheDocument();
  });

  it("highlights the active route link (SHL-1)", () => {
    nav.usePathname.mockReturnValue("/");
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Producto" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    nav.usePathname.mockReturnValue("/");
  });
});

describe("Navbar multi-page link (MPU-6)", () => {
  it("exposes the multi-page trigger link to any authenticated user", () => {
    render(<Navbar session={PRO_SESSION} plan={{ used: 2, limit: 10 }} />);
    expect(screen.getByRole("link", { name: "Multi-página" })).toHaveAttribute(
      "href",
      "/multipage",
    );
  });

  it("exposes the multi-page link even without plan data", () => {
    render(<Navbar session={PRO_SESSION} plan={null} />);
    expect(screen.getByRole("link", { name: "Multi-página" })).toHaveAttribute(
      "href",
      "/multipage",
    );
  });

  it("hides the multi-page link for anonymous visitors", () => {
    render(<Navbar session={null} />);
    expect(
      screen.queryByRole("link", { name: "Multi-página" }),
    ).not.toBeInTheDocument();
  });
});

describe("LogoutButton (SHL-3)", () => {
  it("renders a logout action labeled Cierra sesión", () => {
    render(<LogoutButton />);
    expect(screen.getByLabelText("Cierra sesión")).toBeInTheDocument();
  });
});
