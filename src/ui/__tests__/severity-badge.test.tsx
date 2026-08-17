import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { severityBandSchema } from "@/lib/contracts/audit-result";
import { SeverityBadge } from "@/ui/severity-badge";

/**
 * U1.T5 — SeverityBadge primitive (DNF-5): maps each of the 5 shared
 * SeverityBand values to a color-coded chip with its Spanish label.
 */
const BANDS = severityBandSchema.options;

const EXPECTED_LABELS: Record<(typeof BANDS)[number], string> = {
  Excellent: "Excelente",
  Good: "Bueno",
  Fair: "Regular",
  Poor: "Deficiente",
  Critical: "Crítico",
};

describe("SeverityBadge (DNF-5)", () => {
  it.each(BANDS)("maps band %s to its Spanish label", (band) => {
    render(<SeverityBadge band={band} />);
    expect(screen.getByText(EXPECTED_LABELS[band])).toBeInTheDocument();
  });

  it.each<[(typeof BANDS)[number], string]>([
    ["Excellent", "bg-green-"],
    ["Good", "bg-emerald-"],
    ["Fair", "bg-amber-"],
    ["Poor", "bg-orange-"],
    ["Critical", "bg-red-"],
  ])("renders band %s with a %s background", (band, bgPrefix) => {
    const { container } = render(<SeverityBadge band={band} />);
    const chip = container.firstChild as HTMLElement;
    expect(chip.className).toContain(bgPrefix);
  });

  it("renders a pill chip with accessible text", () => {
    const { container } = render(<SeverityBadge band="Critical" />);
    const chip = container.firstChild as HTMLElement;
    expect(chip.className).toContain("rounded-full");
    expect(chip.textContent).toBe("Crítico");
  });
});
