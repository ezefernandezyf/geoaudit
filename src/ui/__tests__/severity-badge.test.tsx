import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SeverityBadge, type GeminiBand } from "@/ui/severity-badge";

/**
 * U1.5 - SeverityBadge (DNF-5 delta): Gemini verbatim - lowercase bands,
 * Spanish labels, hex tinted pill, props score/showDot/size/labelOverride.
 * Capitalized→lowercase normalization lives in the adapter (U5), not here.
 */
const BANDS: GeminiBand[] = ["excellent", "good", "fair", "poor", "critical"];

const EXPECTED_LABELS: Record<GeminiBand, string> = {
  excellent: "Excelente",
  good: "Bueno",
  fair: "Regular",
  poor: "Deficiente",
  critical: "Crítico",
};

describe("SeverityBadge (DNF-5)", () => {
  it.each(BANDS)("maps band %s to its Spanish label", (band) => {
    render(<SeverityBadge band={band} />);
    expect(screen.getByText(EXPECTED_LABELS[band])).toBeInTheDocument();
  });

  it("renders the Gemini hex tinted background per band", () => {
    const { container } = render(<SeverityBadge band="critical" />);
    const chip = container.firstChild as HTMLElement;
    expect(chip.className).toContain("bg-[#ef4444]/10");
    // C14 (A11Y-3): text is red-700 #b91c1c - the darkest-nearest hex that
    // passes WCAG 2.2 AA (4.5:1) on the tinted pill background.
    expect(chip.className).toContain("text-[#b91c1c]");
  });

  it("renders an emerald tint for the excellent band", () => {
    const { container } = render(<SeverityBadge band="excellent" />);
    const chip = container.firstChild as HTMLElement;
    expect(chip.className).toContain("bg-[#10b981]/10");
    // C14 (A11Y-3): text is emerald-700 #047857 - passes AA on the tint.
    expect(chip.className).toContain("text-[#047857]");
  });

  it("renders a pill chip with rounded-full", () => {
    const { container } = render(<SeverityBadge band="critical" />);
    expect((container.firstChild as HTMLElement).className).toContain(
      "rounded-full",
    );
  });

  it("renders the dot by default and hides it with showDot=false", () => {
    const { container, rerender } = render(<SeverityBadge band="good" />);
    expect(
      container.querySelector("[class*='rounded-full'] [class*='bg-[']"),
    ).not.toBeNull();

    rerender(<SeverityBadge band="good" showDot={false} />);
    expect(
      container.querySelector("span[aria-hidden='true']"),
    ).not.toBeInTheDocument();
  });

  it("renders the score in mono when provided", () => {
    render(<SeverityBadge band="good" score={72} />);
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("Bueno")).toBeInTheDocument();
  });

  it("applies the requested size classes", () => {
    const { container, rerender } = render(
      <SeverityBadge band="good" size="sm" />,
    );
    expect((container.firstChild as HTMLElement).className).toContain(
      "text-[11px]",
    );

    rerender(<SeverityBadge band="good" size="lg" />);
    expect((container.firstChild as HTMLElement).className).toContain(
      "text-sm",
    );
  });

  it("honors labelOverride", () => {
    render(<SeverityBadge band="good" labelOverride="Sólido" />);
    expect(screen.getByText("Sólido")).toBeInTheDocument();
    expect(screen.queryByText("Bueno")).not.toBeInTheDocument();
  });
});
