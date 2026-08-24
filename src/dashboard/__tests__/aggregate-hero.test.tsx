import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AggregateHero } from "@/dashboard/aggregate-hero";

/**
 * U3.8 — Aggregate hero (DSH-8): summarizes the most recent GEO score and its
 * severity band. Values arrive as props from the persisted Audit rows (the
 * page reads `audits[0]` — never a recomputation). Pure presentation.
 */
describe("AggregateHero (DSH-8)", () => {
  it("renders the latest GEO score and its Spanish band label", () => {
    render(<AggregateHero latestScore={87} latestBand="Excellent" />);

    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByText("Excelente")).toBeInTheDocument();
  });

  it("renders a different score and band (triangulation)", () => {
    render(<AggregateHero latestScore={41} latestBand="Fair" />);

    expect(screen.getByText("41")).toBeInTheDocument();
    expect(screen.getByText("Regular")).toBeInTheDocument();
    expect(screen.queryByText("87")).not.toBeInTheDocument();
  });

  it("labels the hero as the most recent GEO Score", () => {
    render(<AggregateHero latestScore={62} latestBand="Good" />);
    expect(screen.getByText("GEO Score más reciente")).toBeInTheDocument();
  });
});
