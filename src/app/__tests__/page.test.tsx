import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Page from "@/app/page";

/**
 * U2.T4 — Landing page (ADF-1/ADF-8): hero with the URL form, no /dashboard.
 */
describe("landing page (ADF-1/ADF-8)", () => {
  it("renders the GeoAudit heading", () => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "GeoAudit",
    );
  });

  it("renders the URL input with an explicit accessible label (ADF-1)", () => {
    render(<Page />);
    const input = screen.getByLabelText("URL del sitio");
    expect(input).toHaveAttribute("type", "url");
  });

  it("exposes no link to /dashboard (ADF-8)", () => {
    render(<Page />);
    const links = screen.queryAllByRole("link");
    expect(links).toHaveLength(0);
  });
});
