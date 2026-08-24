import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "@/ui/footer";

/**
 * U1.10 — Footer (SHL-5, LGL-5): logo, links (Precios, Inicio, Dashboard for
 * authed, Términos, Privacidad) and copyright. Dashboard is gated on session
 * (D6: the anonymous shell has no /dashboard entry).
 */
describe("Footer (SHL-5)", () => {
  it("shows the product logo", () => {
    render(<Footer />);
    expect(screen.getByRole("img", { name: "GeoAudit" })).toBeInTheDocument();
  });

  it("links Precios, Inicio, Términos and Privacidad", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Precios" })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Términos" })).toHaveAttribute(
      "href",
      "/terms",
    );
    expect(screen.getByRole("link", { name: "Privacidad" })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });

  it("does not link /dashboard for anonymous visitors (D6)", () => {
    render(<Footer session={null} />);
    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument();
  });

  it("links Dashboard for authenticated visitors", () => {
    render(
      <Footer
        session={{
          user: { name: "Martina", email: "m@example.com" },
          expires: "2099-01-01T00:00:00.000Z",
        }}
      />,
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  it("shows the copyright", () => {
    render(<Footer />);
    expect(
      screen.getByText(`© ${new Date().getFullYear()} GeoAudit`),
    ).toBeInTheDocument();
  });
});
