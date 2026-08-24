import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Navbar } from "@/ui/navbar";
import { LogoutButton } from "@/ui/logout-button";

/**
 * U1.10 — Navbar (SHL-2/3): links to home and /pricing, adapts to auth state.
 * Anonymous → login/signup links; authenticated → avatar + logout.
 */
describe("Navbar (SHL-2/3)", () => {
  it("links the logo to home", () => {
    render(<Navbar />);
    const logo = screen.getByLabelText("GeoAudit Inicio");
    expect(logo).toHaveAttribute("href", "/");
  });

  it("links Precios to /pricing", () => {
    render(<Navbar />);
    const pricing = screen.getByRole("link", { name: "Precios" });
    expect(pricing).toHaveAttribute("href", "/pricing");
  });

  it("shows login/signup links to anonymous visitors", () => {
    render(<Navbar session={null} />);
    expect(
      screen.getByRole("link", { name: "Iniciar sesión" }),
    ).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Crear cuenta" })).toHaveAttribute(
      "href",
      "/signup",
    );
  });

  it("shows avatar + logout and hides login links to authenticated users", () => {
    render(
      <Navbar
        session={{
          user: { name: "Martina Test", email: "m@example.com" },
          expires: "2099-01-01T00:00:00.000Z",
        }}
      />,
    );
    expect(screen.queryByRole("link", { name: "Iniciar sesión" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Crear cuenta" })).toBeNull();
    expect(screen.getByText("M")).toBeInTheDocument(); // avatar initial
    expect(screen.getByLabelText("Cerrar sesión")).toBeInTheDocument();
  });
});

describe("LogoutButton (SHL-3)", () => {
  it("renders a logout action labeled Cerrar sesión", () => {
    render(<LogoutButton />);
    expect(screen.getByLabelText("Cerrar sesión")).toBeInTheDocument();
  });
});
