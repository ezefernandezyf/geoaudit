import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "@/ui/card";

/**
 * U1.T8 — Card primitive (DNF-6): padded surface container with border,
 * rounded corners and optional header / footer slots.
 */
describe("Card (DNF-6)", () => {
  it("renders children in the body", () => {
    render(<Card>Contenido del card</Card>);
    expect(screen.getByText("Contenido del card")).toBeInTheDocument();
  });

  it("renders the header slot", () => {
    render(<Card header={<h2>GEO Score</h2>}>cuerpo</Card>);
    expect(
      screen.getByRole("heading", { name: "GEO Score" }),
    ).toBeInTheDocument();
  });

  it("renders the footer slot", () => {
    render(<Card footer={<button>Ver detalle</button>}>cuerpo</Card>);
    expect(
      screen.getByRole("button", { name: "Ver detalle" }),
    ).toBeInTheDocument();
  });

  it("skips slots that are not provided", () => {
    const { container } = render(<Card>solo cuerpo</Card>);
    expect(container.querySelector("[data-card-header]")).toBeNull();
    expect(container.querySelector("[data-card-footer]")).toBeNull();
  });

  it("applies the surface container classes (padding, border, rounded)", () => {
    const { container } = render(<Card>cuerpo</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border");
    expect(card.className).toContain("rounded-");
    expect(card.className).toContain("p-");
    expect(card.className).toContain("bg-surface");
  });

  it("merges a caller className", () => {
    const { container } = render(<Card className="max-w-md">cuerpo</Card>);
    expect((container.firstChild as HTMLElement).className).toContain(
      "max-w-md",
    );
  });

  describe("noPadding and variant (U1.4, DNF-6)", () => {
    it("removes the body padding when noPadding is set", () => {
      const { container } = render(<Card noPadding>cuerpo</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).not.toContain("p-");
    });

    it("keeps the padding by default", () => {
      const { container } = render(<Card>cuerpo</Card>);
      expect((container.firstChild as HTMLElement).className).toContain("p-");
    });

    it("applies the muted variant classes", () => {
      const { container } = render(<Card variant="muted">cuerpo</Card>);
      expect((container.firstChild as HTMLElement).className).toContain(
        "bg-surface-muted",
      );
    });

    it("applies the highlight variant classes", () => {
      const { container } = render(<Card variant="highlight">cuerpo</Card>);
      expect((container.firstChild as HTMLElement).className).toContain(
        "border-emerald",
      );
    });
  });
});
