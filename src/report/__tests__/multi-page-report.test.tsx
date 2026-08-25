import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MultiPageResult } from "@/lib/contracts/audit-result";
import { MultiPageReport } from "@/report/multi-page-report";
import { MULTIPAGE_COPY } from "@/lib/copy";
import { geminiViewFixture } from "@/report/__tests__/view-fixtures";
import type { GeminiView } from "@/report/presenters/types";

/**
 * U6.3 — MultiPageReport (MPA-10/11, design U6). Gemini route-selector +
 * inspector presenter over the REAL `MultiPageResult` light shape.
 * - MPA-10: aggregate hero + per-page route list + inspector render from
 *   persisted data.
 * - MPA-11/MPU-5: per-page rows derive from real `geoScore` + `durationMs` and
 *   omit metrics the engine does not produce (`schemaFound`, `crawlTimeMs`,
 *   `status`).
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

describe("MultiPageReport aggregate hero (MPA-10)", () => {
  it("renders the aggregate score and band from the light aggregate", () => {
    render(<MultiPageReport result={multiPageResult} />);
    expect(screen.getByText("74")).toBeInTheDocument();
    // Fair → "Regular" appears in the hero band and page 1's row.
    expect(screen.getAllByText("Regular").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Bueno")).toBeInTheDocument();
  });
});

describe("MultiPageReport route selector (MPA-10/11)", () => {
  it("renders one selectable row per audited page with real score + duration", () => {
    render(<MultiPageReport result={multiPageResult} />);
    // Each page row shows the path.
    expect(screen.getByText("/blog")).toBeInTheDocument();
    // 68/100 appears in the row AND the default inspector (first page).
    expect(screen.getAllByText("68/100").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("80/100")).toBeInTheDocument();
    // Real durations derived from durationMs.
    expect(screen.getAllByText("0.9 s").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("1.1 s").length).toBeGreaterThanOrEqual(1);
    // One selectable route-row button per page (pressed + unpressed).
    expect(screen.getAllByRole("button")).toHaveLength(
      multiPageResult.pages.length,
    );
  });

  it("does not fabricate schemaFound, crawlTimeMs or status (MPA-11)", () => {
    render(<MultiPageReport result={multiPageResult} />);
    expect(screen.queryByText(/Schema/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ms/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Latencia Crawl/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Falta Schema/)).not.toBeInTheDocument();
  });

  it("marks the first page selected by default", () => {
    render(<MultiPageReport result={multiPageResult} />);
    const first = screen.getAllByRole("button", { pressed: true });
    expect(first).toHaveLength(1);
  });
});

describe("MultiPageReport inspector (MPU-4)", () => {
  it("shows the selected page's detail and updates on selection", () => {
    render(<MultiPageReport result={multiPageResult} />);
    // Default inspector shows the first page's path.
    expect(
      screen.getByRole("region", {
        name: MULTIPAGE_COPY.results.inspectorLabel,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("/blog")).toBeInTheDocument();

    // Selecting the second page updates the inspector.
    fireEvent.click(screen.getAllByRole("button", { pressed: false })[0]);
    expect(screen.getByRole("heading", { name: "/blog" })).toBeInTheDocument();
  });
});

describe("MultiPageReport full mode with pageViews (A3, MPU-7/9)", () => {
  /** Views built through the REAL adapter from the canonical fixture. */
  const pageViews: { url: string; view: GeminiView }[] = [
    { url: "https://example.com/", view: geminiViewFixture },
    {
      url: "https://example.com/blog",
      view: {
        ...geminiViewFixture,
        domain: "example.com",
        totalScore: 80,
        band: "good",
        summary: "example.com — GEO Score 80 (good) en ~3s",
      },
    },
  ];

  it("renders the FULL report of the selected page when pageViews is provided (MPU-7)", () => {
    render(<MultiPageReport result={multiPageResult} pageViews={pageViews} />);

    // Full mode composes the shared report presenters for the selected view.
    expect(
      screen.getByRole("region", { name: "Scorecard por categoría" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Matriz de plataformas de IA" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Hallazgos técnicos" }),
    ).toBeInTheDocument();
    // The fixture view's findings surface (adapter-derived, not light-shape).
    expect(
      screen.getAllByText(/Pasaje altamente citable/).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("switches the full report when navigating the selector (MPU-9)", () => {
    render(<MultiPageReport result={multiPageResult} pageViews={pageViews} />);

    // First page selected by default — fixture view hero (score 68).
    expect(screen.getByText(/GEO Score 68/)).toBeInTheDocument();

    // Select page 2 (blog) → its view (score 80) renders.
    fireEvent.click(screen.getAllByRole("button", { pressed: false })[0]);
    expect(screen.getAllByText("80").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/GEO Score 80/)).toBeInTheDocument();
  });

  it("does NOT enrich the light MultiPageResult shape (MPU-7)", () => {
    render(<MultiPageReport result={multiPageResult} pageViews={pageViews} />);

    // The light shape still carries only url/score/band/duration per page —
    // no full-report fields were injected into result.pages.
    expect(multiPageResult.pages[0]).not.toHaveProperty("findings");
    expect(multiPageResult.pages[0]).not.toHaveProperty("categoryScores");
    expect(multiPageResult.pages[0]).not.toHaveProperty("platforms");
    // The route rows keep deriving from the light shape.
    expect(screen.getByText("80/100")).toBeInTheDocument();
  });
});
