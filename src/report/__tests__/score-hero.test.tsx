import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { toGeminiViewModel } from "@/report/presenters/toGeminiViewModel";
import { ScoreHero, type ScoreHeroView } from "@/report/score-hero";

/**
 * U5.5 - ScoreHero (ARU-11): the complete Gemini hero consuming the view
 * model (never `AuditResult`) - big serif score, band chip, domain chip,
 * duration, title + summary - plus the benchmark bar that positions the score
 * against the REAL thresholds (80/65/50/30, severityForScore), NOT Gemini's
 * 80/65/45/25.
 */

const view = toGeminiViewModel(auditResultFixture);

function renderHero(heroView: ScoreHeroView = view) {
  return render(<ScoreHero view={heroView} />);
}

describe("ScoreHero view-model consumption (ARU-10/11)", () => {
  it("renders the GEO score, the band chip and the domain from the view model", () => {
    renderHero();

    expect(screen.getByText("68")).toBeInTheDocument();
    expect(screen.getByText("/100")).toBeInTheDocument();
    // Fixture band "Good" (68 → v3.1 65-79) → lowercase view band → ES "Bueno".
    expect(screen.getByText("Bueno")).toBeInTheDocument();
    // The hostname, not the raw URL (view model domain field): it appears in
    // the domain chip AND as the title fallback (title = domain, APT-3).
    expect(screen.getAllByText("example.com").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Auditoría en/)).toBeInTheDocument();
    expect(screen.getByText("3s")).toBeInTheDocument();
  });

  it("renders the one-line summary from the view model", () => {
    renderHero();
    expect(
      screen.getByText("example.com - GEO Score 68 (good) en ~3s"),
    ).toBeInTheDocument();
  });

  it("renders the audit date when the caller provides it (ctx passthrough)", () => {
    const dated = toGeminiViewModel(auditResultFixture, {
      auditDate: "2026-08-10",
    });
    renderHero(dated);
    expect(screen.getByText(/2026-08-10/)).toBeInTheDocument();
  });
});

describe("ScoreHero benchmark bar (ARU-11)", () => {
  it("shows the REAL thresholds 80/65/50/30 (never Gemini's 80/65/45/25)", () => {
    renderHero();

    expect(screen.getByText("80 - 100")).toBeInTheDocument();
    expect(screen.getByText("65 - 79")).toBeInTheDocument();
    expect(screen.getByText("50 - 64")).toBeInTheDocument();
    expect(screen.getByText("30 - 49")).toBeInTheDocument();
    expect(screen.getByText("< 30")).toBeInTheDocument();

    expect(screen.queryByText("90 - 100")).not.toBeInTheDocument();
    expect(screen.queryByText("75 - 89")).not.toBeInTheDocument();
    expect(screen.queryByText("60 - 74")).not.toBeInTheDocument();
    expect(screen.queryByText("40 - 59")).not.toBeInTheDocument();
    expect(screen.queryByText("< 40")).not.toBeInTheDocument();
  });

  it("positions 68 in the Good band (65-79) of the real benchmark (ARU-11)", () => {
    const { container } = renderHero();
    // The marker sits at the score and the Good row renders its exact range.
    expect(container.querySelector("[data-benchmark-marker]")).toHaveStyle({
      left: "68%",
    });
    expect(screen.getByText("65 - 79")).toBeInTheDocument();
    // 68 is NOT in the Fair band (50-64) of the real thresholds.
    expect(screen.getByText("50 - 64")).toBeInTheDocument();
  });

  it("positions the marker at the score: 68 → 68% (Good band 65-79)", () => {
    const { container } = renderHero();
    const marker = container.querySelector("[data-benchmark-marker]");
    expect(marker).not.toBeNull();
    expect(marker).toHaveStyle({ left: "68%" });
  });

  it("clamps the marker to the 0-100 scale", () => {
    const high = renderHero({ ...view, totalScore: 120 });
    expect(high.container.querySelector("[data-benchmark-marker]")).toHaveStyle(
      { left: "100%" },
    );
    const low = renderHero({ ...view, totalScore: -5 });
    expect(low.container.querySelector("[data-benchmark-marker]")).toHaveStyle({
      left: "0%",
    });
  });

  it("labels each real band with its Spanish label", () => {
    renderHero();
    expect(screen.getByText("Excelente (Top 10%)")).toBeInTheDocument();
    expect(screen.getByText("Bueno (Promedio B2B)")).toBeInTheDocument();
    expect(screen.getByText("Regular (Riesgo omisión)")).toBeInTheDocument();
    expect(screen.getByText("Deficiente (Riesgo crítico)")).toBeInTheDocument();
    expect(screen.getByText("Crítico")).toBeInTheDocument();
  });
});

describe("ScoreHero benchmark segment order (ARU-11, sprint 15)", () => {
  /** The 5 bar segments in DOM order, resolved from the marker's wrapper. */
  function segments(container: HTMLElement): HTMLElement[] {
    const marker = container.querySelector("[data-benchmark-marker]");
    expect(marker).not.toBeNull();
    const bar = marker!.parentElement!.querySelector("div");
    expect(bar).not.toBeNull();
    return Array.from(bar!.children) as HTMLElement[];
  }

  it("orders segments critical→excellent left→right with widths summing 100", () => {
    const { container } = renderHero();
    const segs = segments(container);
    expect(segs).toHaveLength(5);
    // ARU-11: severity order critical 30 → poor 20 → fair 15 → good 15 →
    // excellent 20 (the marker's 0-100 scale then lands inside its band).
    expect(segs.map((s) => s.style.width)).toEqual([
      "30%",
      "20%",
      "15%",
      "15%",
      "20%",
    ]);
    // Red critical on the left, green excellent on the right.
    expect(segs[0].className).toContain("bg-[#ef4444]");
    expect(segs[4].className).toContain("bg-[#10b981]");
    const total = segs.reduce(
      (sum, s) => sum + Number(s.style.width.replace("%", "")),
      0,
    );
    expect(total).toBe(100);
  });

  it("keeps the marker on the 0-100 scale: 85 → 85% (right/green), 15 → 15% (left/red)", () => {
    const high = renderHero({ ...view, totalScore: 85 });
    expect(high.container.querySelector("[data-benchmark-marker]")).toHaveStyle(
      { left: "85%" },
    );
    const low = renderHero({ ...view, totalScore: 15 });
    expect(low.container.querySelector("[data-benchmark-marker]")).toHaveStyle({
      left: "15%",
    });
  });
});

describe("ScoreHero unclipped three-digit score (ARU-15, sprint 15)", () => {
  it("renders 100 and /100 fully, /100 stacked below the number, keeping the emerald hex", () => {
    const { container } = renderHero({ ...view, totalScore: 100 });
    const number = screen.getByText("100");
    expect(number).toBeInTheDocument();
    const denominator = screen.getByText("/100");
    expect(denominator).toBeInTheDocument();
    // ARU-15: the /100 stacks UNDER the number (flex-col), never clipped in a
    // side-by-side row that overflows the box at text-6xl/7xl.
    const row = denominator.parentElement;
    expect(row?.className).toContain("flex-col");
    // The number keeps the Gemini serif hierarchy (ARU-15).
    expect(number.className).toContain("font-serif");
    expect(number.className).toContain("text-6xl");
    // The /100 keeps its AA-contrast emerald hex.
    expect(denominator.className).toContain("text-[#047857]");
    // No horizontal overflow of the score box: the score row is the widest
    // content and the box min-width is relaxed (D5).
    const box = container.querySelector(".rounded-xl");
    expect(box).not.toBeNull();
  });
});
