import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScoreBar } from "@/ui/score-bar";

/**
 * U1.8 — ScoreBar primitive (DNF-9): a reusable 0-100 bar whose width equals
 * the score and whose fill color maps to the shared severity band derived from
 * `severityForScore` (the P3 contract, not a duplicated threshold map).
 */
describe("ScoreBar (DNF-9)", () => {
  it("renders the label when provided", () => {
    render(<ScoreBar label="Citabilidad" score={72} />);
    expect(screen.getByText("Citabilidad")).toBeInTheDocument();
  });

  it("renders a progressbar with the score as aria-valuenow", () => {
    render(<ScoreBar score={72} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "72");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("sets the fill width to the score percent", () => {
    const { container } = render(<ScoreBar score={72} />);
    const fill = container.querySelector("[data-score-fill]");
    expect(fill).not.toBeNull();
    expect((fill as HTMLElement).style.width).toBe("72%");
  });

  it("maps the fill color to the Fair band for a 72 score", () => {
    const { container } = render(<ScoreBar score={72} />);
    const fill = container.querySelector("[data-score-fill]");
    // Fair = severityForScore(72) → amber band family
    expect((fill as HTMLElement).className).toContain("bg-amber");
  });

  it("maps the fill color to the Excellent band for a high score", () => {
    const { container } = render(<ScoreBar score={95} />);
    const fill = container.querySelector("[data-score-fill]");
    // Excellent = severityForScore(95) → emerald band family
    expect((fill as HTMLElement).className).toContain("bg-emerald");
  });

  it("clamps the width to 100 for a score above 100", () => {
    const { container } = render(<ScoreBar score={120} />);
    const fill = container.querySelector("[data-score-fill]");
    expect((fill as HTMLElement).style.width).toBe("100%");
  });
});
