import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "@/ui/logo";

/**
 * SHL-4 (sprint 11 rebrand) - Logo: user-generated Relevy mark (two stylized
 * quote paths, navy + emerald, no tile) with the "Relevy" wordmark in
 * Instrument Serif. Full variant renders the wordmark; mark-only (favicon /
 * compact) renders just the SVG. The "AI Visibility Audit" tagline is gone
 * (brief §3: no tagline).
 */
describe("Logo (SHL-4)", () => {
  it("renders the mark with an accessible label", () => {
    render(<Logo />);
    expect(screen.getByRole("img", { name: "Relevy" })).toBeInTheDocument();
  });

  it("renders the Relevy wordmark by default", () => {
    render(<Logo />);
    expect(screen.getByText("Relevy")).toBeInTheDocument();
  });

  it("does not render the AI Visibility Audit tagline (brief §3)", () => {
    render(<Logo />);
    expect(screen.queryByText("AI Visibility Audit")).not.toBeInTheDocument();
  });

  it("omits the wordmark in mark-only variant", () => {
    render(<Logo showWordmark={false} />);
    expect(screen.queryByText("Relevy")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Relevy" })).toBeInTheDocument();
  });

  it("applies an explicit size", () => {
    const { container } = render(<Logo size={48} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "48");
    expect(svg).toHaveAttribute("height", "48");
  });

  it("keeps the quote mark minimal for small sizes (A7): two quote paths, no tile", () => {
    const { container } = render(<Logo showWordmark={false} />);
    const svg = container.querySelector("svg");
    // The user mark is two quote paths without a navy tile: no <rect>.
    expect(svg?.querySelector("rect")).toBeNull();
    expect(svg?.querySelector("circle")).toBeNull();
    const paths = svg?.querySelectorAll("path");
    expect(paths).toHaveLength(2);
    // Quote 1 is navy via native fill attribute (functional contract of the
    // user's mark; direct fill so the mark stays visible on the always-white
    // navbar regardless of system dark mode - no Tailwind arbitrary class).
    expect(paths?.[0].getAttribute("fill")).toBe("#0f172a");
    // Quote 2 is the emerald accent.
    expect(paths?.[1].getAttribute("fill")).toBe("#10b981");
  });
});
