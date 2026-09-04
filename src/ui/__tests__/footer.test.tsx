import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "@/ui/footer";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/brand";

/**
 * U1.10 - Footer (SHL-5, LGL-5): logo, links (Inicio, Dashboard for
 * authed, Términos, Privacidad) and copyright. Dashboard is gated on session
 * (D6: the anonymous shell has no /dashboard entry). The /pricing link was
 * removed with the pricing page (WU-1/2).
 */
describe("Footer (SHL-5)", () => {
  it("shows the product logo", () => {
    render(<Footer />);
    expect(screen.getByRole("img", { name: "Relevy" })).toBeInTheDocument();
  });

  it("links Inicio, Términos and Privacidad", () => {
    render(<Footer />);
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
    expect(
      screen.queryByRole("link", { name: "Precios" }),
    ).not.toBeInTheDocument();
  });

  // LND-12 (sprint 9): the E-E-A-T trustworthiness engine awards contact info
  // (mailto/tel/contact/address) +5 - the footer surfaces the support mailto.
  it("links contact info via mailto (LND-12)", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Contacto" })).toHaveAttribute(
      "href",
      `mailto:${SUPPORT_EMAIL}`,
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
      screen.getByText(`© ${new Date().getFullYear()} ${BRAND_NAME}`),
    ).toBeInTheDocument();
  });

  // SHL-11 (sprint 16): the global footer renders the author byline - a
  // paragraph with the engine's AUTHOR_SELECTOR class (.byline) showing the
  // real founder name and role from the shared constants. The class is a
  // functional contract for the expertise engine over the full DOM
  // (AUTHOR_SELECTOR = '.byline, [rel="author"], .author, author'), not a
  // styling detail: without it the +5 byline bonus is never detected.
  it("renders the author byline with the .byline class (SHL-11)", () => {
    render(<Footer />);
    const byline = screen.getByText(/Fundador de Relevy/).closest("p.byline");
    expect(byline).not.toBeNull();
    expect(byline?.textContent).toContain("Ezequiel Alejandro Fernandez");
  });
});
