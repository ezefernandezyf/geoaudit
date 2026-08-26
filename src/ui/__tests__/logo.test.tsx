import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "@/ui/logo";

/**
 * U1.8 — Logo (DNF-12): SVG inline mark (serif G + emerald wave + globe) with
 * the "GeoAudit" wordmark. Full variant renders the wordmark; mark-only
 * (favicon / compact) renders just the SVG.
 */
describe("Logo (DNF-12)", () => {
  it("renders the mark with an accessible label", () => {
    render(<Logo />);
    expect(screen.getByRole("img", { name: "GeoAudit" })).toBeInTheDocument();
  });

  it("renders the GeoAudit wordmark by default", () => {
    render(<Logo />);
    expect(screen.getByText("GeoAudit")).toBeInTheDocument();
  });

  it("renders the AI Visibility Audit tagline by default", () => {
    render(<Logo />);
    expect(screen.getByText("AI Visibility Audit")).toBeInTheDocument();
  });

  it("omits the wordmark in mark-only variant", () => {
    render(<Logo showWordmark={false} />);
    expect(screen.queryByText("GeoAudit")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "GeoAudit" })).toBeInTheDocument();
  });

  it("applies an explicit size", () => {
    const { container } = render(<Logo size={48} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "48");
    expect(svg).toHaveAttribute("height", "48");
  });

  it("keeps the mark minimal for small sizes (A7): navy tile + emerald serif G", () => {
    const { container } = render(<Logo showWordmark={false} />);
    const svg = container.querySelector("svg");
    expect(svg?.querySelector("rect")).toHaveAttribute("fill", "#0f172a");
    // The G is a vector PATH (not <text>): text nodes leak into a parent
    // link's textContent and break axe label-content-name-mismatch (WU-4).
    const g = svg?.querySelector("path");
    expect(g).not.toBeNull();
    expect(g).toHaveAttribute("fill", "#10b981");
    // The fine wave path and globe were removed for 16x16/32x32 readability.
    expect(svg?.querySelectorAll("path").length).toBe(1);
    expect(svg?.querySelector("circle")).toBeNull();
  });
});
