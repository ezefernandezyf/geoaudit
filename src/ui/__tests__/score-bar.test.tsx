import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScoreBar, type ScoreCategory } from "@/ui/score-bar";

/**
 * U1.6 — ScoreBar (DNF-9): receives a Gemini-style `category`; the fill color
 * derives from `category.status` (the real band), never the numeric
 * getBarColor. Progressbar semantics + `data-score-fill` width are preserved.
 */
const category = (overrides: Partial<ScoreCategory> = {}): ScoreCategory => ({
  id: "citability",
  name: "Citabilidad",
  score: 72,
  maxScore: 100,
  status: "fair",
  ...overrides,
});

describe("ScoreBar (DNF-9)", () => {
  it("renders the category name", () => {
    render(<ScoreBar category={category()} />);
    expect(screen.getByText("Citabilidad")).toBeInTheDocument();
  });

  it("renders a progressbar with the score as aria-valuenow", () => {
    render(<ScoreBar category={category({ score: 72, maxScore: 100 })} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "72");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("gives the progressbar an accessible name (A11Y-6, PERF-3)", () => {
    render(<ScoreBar category={category({ score: 72, maxScore: 100 })} />);
    expect(
      screen.getByRole("progressbar", { name: "Score 72/100" }),
    ).toBeInTheDocument();
  });

  it("renders the /100 label with the AA contrast hex (PERF-3)", () => {
    render(<ScoreBar category={category()} />);
    expect(screen.getByText("/100")).toHaveClass("text-[#64748b]");
  });

  it("sets the fill width to the score percent", () => {
    const { container } = render(<ScoreBar category={category()} />);
    const fill = container.querySelector("[data-score-fill]");
    expect(fill).not.toBeNull();
    expect((fill as HTMLElement).style.width).toBe("72%");
  });

  it("derives the fill color from the fair status (amber, hex)", () => {
    const { container } = render(
      <ScoreBar category={category({ status: "fair" })} />,
    );
    const fill = container.querySelector("[data-score-fill]");
    expect((fill as HTMLElement).className).toContain("bg-[#f59e0b]");
  });

  it("derives the fill color from the critical status (red, hex)", () => {
    const { container } = render(
      <ScoreBar category={category({ status: "critical" })} />,
    );
    const fill = container.querySelector("[data-score-fill]");
    expect((fill as HTMLElement).className).toContain("bg-[#ef4444]");
  });

  it("derives the fill color from the excellent status (emerald, hex)", () => {
    const { container } = render(
      <ScoreBar category={category({ status: "excellent" })} />,
    );
    const fill = container.querySelector("[data-score-fill]");
    expect((fill as HTMLElement).className).toContain("bg-[#10b981]");
  });

  it("clamps the width to 100 for a score above maxScore", () => {
    const { container } = render(
      <ScoreBar category={category({ score: 120 })} />,
    );
    const fill = container.querySelector("[data-score-fill]");
    expect((fill as HTMLElement).style.width).toBe("100%");
  });

  it("omits the name row when category has no name", () => {
    render(<ScoreBar category={category({ name: undefined })} />);
    expect(screen.queryByText("Citabilidad")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  describe("interactive mode", () => {
    it("calls onClick when isInteractive and clicked", () => {
      const onClick = vi.fn();
      render(
        <ScoreBar category={category()} onClick={onClick} isInteractive />,
      );
      fireEvent.click(screen.getByText("Citabilidad").closest("div")!);
      expect(onClick).toHaveBeenCalled();
    });

    it("does not call onClick when not interactive", () => {
      const onClick = vi.fn();
      render(<ScoreBar category={category()} onClick={onClick} />);
      fireEvent.click(screen.getByText("Citabilidad").closest("div")!);
      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
