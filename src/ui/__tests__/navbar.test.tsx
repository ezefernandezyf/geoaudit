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
    const logo = screen.getByLabelText("GeoAudit — AI Visibility Audit");
    expect(logo).toHaveAttribute("href", "/");
  });

  it("shows the new logo and wordmark", () => {
    render(<Navbar />);
    expect(screen.getByRole("img", { name: "GeoAudit" })).toBeInTheDocument();
    expect(screen.getByText("GeoAudit")).toBeInTheDocument();
  });

  it("links Producto to / and Precios to /pricing", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Producto" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Precios" })).toHaveAttribute(
      "href",
      "/pricing",
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

  it("shows the plan pill with usage for an authenticated PRO user (SHL-2)", () => {
    render(
      <Navbar
        session={PRO_SESSION}
        plan={{ tier: "PRO", used: 2, limit: 10 }}
      />,
    );
    const pill = screen.getByRole("link", { name: /Plan Pro/ });
    expect(pill).toHaveAttribute("href", "/pricing");
    expect(screen.getByText(/\(2\/10\)/)).toBeInTheDocument();
  });

  it("renders no plan pill for an authenticated user without plan data", () => {
    render(<Navbar session={PRO_SESSION} plan={null} />);
    expect(
      screen.queryByRole("link", { name: /Plan Pro/ }),
    ).not.toBeInTheDocument();
  });

  it("shows avatar initials + logout and hides login links to authenticated users (SHL-3)", () => {
    render(<Navbar session={PRO_SESSION} plan={null} />);
    expect(screen.queryByRole("link", { name: "Inicie sesión" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Cree su cuenta" })).toBeNull();
    expect(screen.getByText("MT")).toBeInTheDocument(); // avatar initials
    expect(screen.getByLabelText("Cierra sesión")).toBeInTheDocument();
  });

  it("highlights the active route link (SHL-1)", () => {
    nav.usePathname.mockReturnValue("/pricing");
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Precios" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Producto" })).not.toHaveAttribute(
      "aria-current",
    );
    nav.usePathname.mockReturnValue("/");
  });
});

describe("Navbar multi-page link (MPU-6)", () => {
  it("exposes the multi-page trigger link to paid users", () => {
    render(
      <Navbar
        session={PRO_SESSION}
        plan={{ tier: "PRO", used: 2, limit: 10 }}
      />,
    );
    expect(screen.getByRole("link", { name: "Multi-página" })).toHaveAttribute(
      "href",
      "/multipage",
    );
  });

  it("hides the multi-page link for FREE users", () => {
    render(
      <Navbar
        session={PRO_SESSION}
        plan={{ tier: "FREE", used: 1, limit: 3 }}
      />,
    );
    expect(
      screen.queryByRole("link", { name: "Multi-página" }),
    ).not.toBeInTheDocument();
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
