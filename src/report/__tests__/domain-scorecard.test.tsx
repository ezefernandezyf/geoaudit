import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { toGeminiViewModel } from "@/report/presenters/toGeminiViewModel";
import { DomainScorecard } from "@/report/domain-scorecard";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import {
  degradedViewFixture,
  geminiViewFixture,
  unsupportedViewFixture,
} from "@/report/__tests__/view-fixtures";

/**
 * U5.6 - DomainScorecard (ARU-10): pure presenter of the view model. Gemini
 * "Scorecard por Categoría" section rendering the five `categoryScores` via
 * the shared ScoreBar (color by REAL lowercase band). The adapter owns the
 * rowScore derivation; the component never reads `AuditResult`.
 */

/** The ScoreBar fill IS the progressbar element (data-score-fill + width). */
function fillOf(value: number): HTMLElement {
  const bars = screen.getAllByRole("progressbar");
  const bar = bars.find(
    (b) => b.getAttribute("aria-valuenow") === String(value),
  );
  if (!bar) throw new Error(`no ScoreBar with aria-valuenow ${value}`);
  return bar as HTMLElement;
}

describe("DomainScorecard valid audit (ARU-10)", () => {
  it("renders the five category rows with their scores via ScoreBar", () => {
    render(<DomainScorecard view={geminiViewFixture} />);

    expect(screen.getByText("Acceso de bots")).toBeInTheDocument();
    expect(screen.getByText("Citabilidad")).toBeInTheDocument();
    expect(screen.getByText("E-E-A-T")).toBeInTheDocument();
    expect(screen.getByText("Datos estructurados")).toBeInTheDocument();
    expect(screen.getByText("Plataforma")).toBeInTheDocument();

    // crawlers 71 · citability 62 · content 65 · schema proxy 90 · platform aio 70
    expect(screen.getByText("71")).toBeInTheDocument();
    expect(screen.getByText("62")).toBeInTheDocument();
    expect(screen.getByText("65")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("70")).toBeInTheDocument();
  });

  it("renders five ScoreBar progressbars with the correct aria-valuenow", () => {
    render(<DomainScorecard view={geminiViewFixture} />);
    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(5);
    const values = bars.map((b) => Number(b.getAttribute("aria-valuenow")));
    expect(values).toEqual([71, 62, 65, 90, 70]);
  });

  it("sizes each ScoreBar fill to its category score", () => {
    render(<DomainScorecard view={geminiViewFixture} />);
    expect(fillOf(62)).toHaveAttribute("data-score-fill");
    expect(fillOf(62)).toHaveStyle({ width: "62%" });
    expect(fillOf(90)).toHaveStyle({ width: "90%" });
  });

  it("shows the Gemini section header with the 5-categories chip", () => {
    render(<DomainScorecard view={geminiViewFixture} />);
    expect(screen.getByText("Scorecard por Categoría")).toBeInTheDocument();
    expect(screen.getByText("5 categorías analizadas")).toBeInTheDocument();
  });
});

describe("DomainScorecard degraded engine (ARU-10 honesty)", () => {
  it("scores the failed engine honestly as 0 (critical band), not a fake number", () => {
    render(<DomainScorecard view={degradedViewFixture} />);

    // Citability engine failed (RAO-12): the adapter maps rowScore → 0.
    expect(fillOf(0)).toHaveStyle({ width: "0%" });

    // The remaining engines still score.
    expect(screen.getByText("71")).toBeInTheDocument();
  });

  it("keeps only the crawler row scorable on a non-HTML page (RAO-13)", () => {
    render(<DomainScorecard view={unsupportedViewFixture} />);

    const bars = screen.getAllByRole("progressbar");
    const values = bars.map((b) => Number(b.getAttribute("aria-valuenow")));
    // crawler 71, the four unsupported engines score 0.
    expect(values).toEqual([71, 0, 0, 0, 0]);
    expect(screen.getByText("71")).toBeInTheDocument();
  });
});

describe("DomainScorecard score derivation via the adapter", () => {
  it("scores schema 0 when no structured data is detected", () => {
    const noSchema = {
      ...auditResultFixture,
      schema: {
        detected: [],
        issues: [],
        generated: null,
        businessType: "hybrid" as const,
      },
    };
    render(<DomainScorecard view={toGeminiViewModel(noSchema)} />);
    expect(fillOf(0)).toHaveStyle({ width: "0%" });
  });

  it("renders the real lowercase status band through the ScoreBar color", () => {
    render(<DomainScorecard view={geminiViewFixture} />);
    // Score 90 (schema) → "excellent" → emerald fill; score 62 → "fair" → amber.
    expect(fillOf(90).className).toContain("bg-[#10b981]");
    expect(fillOf(62).className).toContain("bg-[#f59e0b]");
  });
});
