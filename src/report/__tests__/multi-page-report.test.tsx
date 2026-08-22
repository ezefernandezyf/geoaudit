import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MultiPageResult } from "@/lib/contracts/audit-result";
import { MultiPageReport } from "@/report/multi-page-report";

/**
 * U3 — multi-page report (D3). `<MultiPageReport result>` renders the
 * aggregate hero (ScoreHero over the light aggregate) plus one row per
 * audited page: url + score + severity band + duration. Pure SSR Server
 * Component — consumes the D3 master light shape (`multiPageResultSchema`)
 * persisted on the master Audit row; the detail page renders it for
 * multi-page audits.
 */

const multiPageResult: MultiPageResult = {
  aggregate: {
    url: "https://example.com/",
    geoScore: 74,
    severityBand: "Fair",
    durationMs: 2400,
  },
  pages: [
    {
      url: "https://example.com/",
      geoScore: 68,
      severityBand: "Fair",
      durationMs: 900,
    },
    {
      url: "https://example.com/blog",
      geoScore: 80,
      severityBand: "Good",
      durationMs: 1100,
    },
  ],
};

describe("MultiPageReport (D3)", () => {
  it("renders the aggregate hero from the light aggregate", () => {
    render(<MultiPageReport result={multiPageResult} />);

    expect(screen.getByText("74")).toBeInTheDocument();
    // "Regular" (Fair) appears twice: the hero band and page 1's band.
    expect(screen.getAllByText("Regular")).toHaveLength(2);
    // The site URL appears twice: in the hero (aggregate) and in its page row.
    expect(screen.getAllByText("https://example.com/")).toHaveLength(2);
  });

  it("renders one row per audited page with url, score and band", () => {
    render(<MultiPageReport result={multiPageResult} />);

    expect(screen.getByText("https://example.com/blog")).toBeInTheDocument();
    expect(screen.getByText("68")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("Bueno")).toBeInTheDocument();
  });

  it("exposes the report section aria label", () => {
    render(<MultiPageReport result={multiPageResult} />);
    expect(
      screen.getByRole("region", {
        name: "Reporte de auditoría multi-página",
      }),
    ).toBeInTheDocument();
  });
});
