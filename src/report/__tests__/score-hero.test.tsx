import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { ScoreHero } from "@/report/score-hero";

/**
 * U4.T2 — ScoreHero (ARU-8): big GEO Score colored by its severity band,
 * the band chip (SeverityBadge), the normalized URL and the audit duration.
 */
describe("ScoreHero (ARU-8)", () => {
  it("renders the GEO score, the normalized URL and the duration", () => {
    render(<ScoreHero summary={auditResultFixture.summary} />);

    expect(screen.getByText("68")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/")).toBeInTheDocument();
    expect(screen.getByText("Duración: 3.2 s")).toBeInTheDocument();
  });

  it("renders the severity band chip with its Spanish label", () => {
    render(<ScoreHero summary={auditResultFixture.summary} />);
    // Fixture band "Fair" → ES label "Regular".
    expect(screen.getByText("Regular")).toBeInTheDocument();
  });

  it("colors the score number by its severity band", () => {
    render(<ScoreHero summary={auditResultFixture.summary} />);
    const score = screen.getByText("68");
    expect(score.className).toContain("text-amber-");
  });

  it("uses a different band color and label for an Excellent score", () => {
    render(
      <ScoreHero
        summary={{
          ...auditResultFixture.summary,
          geoScore: 92,
          severityBand: "Excellent",
        }}
      />,
    );
    expect(screen.getByText("92")).toBeInTheDocument();
    expect(screen.getByText("Excelente")).toBeInTheDocument();
    expect(screen.getByText("92").className).toContain("text-green-");
  });
});
