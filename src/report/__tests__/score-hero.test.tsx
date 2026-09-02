import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { toGeminiViewModel } from "@/report/presenters/toGeminiViewModel";
import { ScoreHero, type ScoreHeroView } from "@/report/score-hero";

/**
 * U5.5 - ScoreHero (ARU-11): the complete Gemini hero consuming the view
 * model (never `AuditResult`) - big serif score, band chip, domain chip,
 * duration, title + summary - plus the benchmark bar that positions the score
 * against the REAL thresholds (90/75/60/40, severityForScore), NOT Gemini's
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
  it("shows the REAL thresholds 90/75/60/40 (never Gemini's 80/65/45/25)", () => {
    renderHero();

    expect(screen.getByText("90 - 100")).toBeInTheDocument();
    expect(screen.getByText("75 - 89")).toBeInTheDocument();
    expect(screen.getByText("60 - 74")).toBeInTheDocument();
    expect(screen.getByText("40 - 59")).toBeInTheDocument();
    expect(screen.getByText("< 40")).toBeInTheDocument();

    expect(screen.queryByText("80 - 100")).not.toBeInTheDocument();
    expect(screen.queryByText("65 - 79")).not.toBeInTheDocument();
    expect(screen.queryByText("45 - 64")).not.toBeInTheDocument();
    expect(screen.queryByText("< 45")).not.toBeInTheDocument();
  });

  it("positions the marker at the score: 68 → 68% (Fair band 60-74)", () => {
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
