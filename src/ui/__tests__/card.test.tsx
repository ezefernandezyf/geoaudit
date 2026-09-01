import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "@/ui/card";

/**
 * U1.3 - Card primitive (DNF-6 delta): Gemini verbatim - padded surface
 * container with rounded corners. Variants default/muted/highlight use hex
 * directos; NO header/footer slots (Gemini has none, DNF-9); `noPadding`
 * removes the p-6 padding.
 */
describe("Card (DNF-6)", () => {
  it("renders children in the body", () => {
    render(<Card>Contenido del card</Card>);
    expect(screen.getByText("Contenido del card")).toBeInTheDocument();
  });

  it("applies the Gemini default container classes (hex, not tokens)", () => {
    const { container } = render(<Card>cuerpo</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("bg-white");
    expect(card.className).toContain("border-[#e2e8f0]");
    expect(card.className).toContain("rounded-xl");
    expect(card.className).toContain("p-6");
  });

  it("merges a caller className", () => {
    const { container } = render(<Card className="max-w-md">cuerpo</Card>);
    expect((container.firstChild as HTMLElement).className).toContain(
      "max-w-md",
    );
  });

  describe("noPadding and variant", () => {
    it("removes the body padding when noPadding is set", () => {
      const { container } = render(<Card noPadding>cuerpo</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).not.toContain("p-6");
    });

    it("keeps the padding by default", () => {
      const { container } = render(<Card>cuerpo</Card>);
      expect((container.firstChild as HTMLElement).className).toContain("p-6");
    });

    it("applies the muted variant classes (hex)", () => {
      const { container } = render(<Card variant="muted">cuerpo</Card>);
      expect((container.firstChild as HTMLElement).className).toContain(
        "bg-[#f8fafc]",
      );
    });

    it("applies the highlight variant classes (hex)", () => {
      const { container } = render(<Card variant="highlight">cuerpo</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain("border-2");
      expect(card.className).toContain("border-[#10b981]");
    });
  });
});
