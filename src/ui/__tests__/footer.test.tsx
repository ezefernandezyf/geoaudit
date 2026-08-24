import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "@/ui/footer";

/**
 * U1.10 — Footer (SHL-4): minimal product info + /pricing link, no invented
 * features or claims.
 */
describe("Footer (SHL-4)", () => {
  it("shows the product name", () => {
    render(<Footer />);
    expect(screen.getByText("GeoAudit")).toBeInTheDocument();
  });

  it("links to /pricing", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Precios" })).toHaveAttribute(
      "href",
      "/pricing",
    );
  });
});
