import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { DomainScorecard } from "@/report/domain-scorecard";
import {
  degradedCitabilityResult,
  emptySchema,
  unsupportedPageResult,
} from "@/report/__tests__/variants";

/**
 * U4.T3 — DomainScorecard (ARU-7/ARU-8): five domain rows with scores and
 * mini-bars; a degraded engine (RAO-12/RAO-13) renders an honest "No
 * disponible" chip instead of a fake score.
 */
describe("DomainScorecard valid audit (ARU-8)", () => {
  it("renders the five domain rows with their scores", () => {
    render(<DomainScorecard result={auditResultFixture} />);

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

    expect(screen.queryByText("No disponible")).not.toBeInTheDocument();
  });

  it("sizes each mini-bar to its domain score", () => {
    render(<DomainScorecard result={auditResultFixture} />);
    const citabilityBar = screen
      .getByText("Citabilidad")
      .closest("li")!
      .querySelector("[data-testid='row-bar']") as HTMLElement;
    expect(citabilityBar).toHaveStyle({ width: "62%" });
  });

  it("colors the crawler bar by the Fair band of its score", () => {
    render(<DomainScorecard result={auditResultFixture} />);
    const crawlerBar = screen
      .getByText("Acceso de bots")
      .closest("li")!
      .querySelector("[data-testid='row-bar']") as HTMLElement;
    expect(crawlerBar.className).toContain("bg-amber-");
  });
});

describe("DomainScorecard degraded engine (ARU-7)", () => {
  it("shows a No disponible chip for the failed engine and scores for the rest", () => {
    render(<DomainScorecard result={degradedCitabilityResult} />);

    const citabilityRow = screen.getByText("Citabilidad").closest("li")!;
    expect(citabilityRow).toHaveTextContent("No disponible");
    expect(citabilityRow).not.toHaveTextContent("62");

    expect(screen.queryAllByText("No disponible")).toHaveLength(1);
    expect(screen.getByText("71")).toBeInTheDocument();
  });

  it("shows the chip when the crawler engine fails", () => {
    const crawlerDegraded = {
      ...auditResultFixture,
      crawlers: { compositeScore: 0, perBot: {} },
      meta: { ...auditResultFixture.meta, errors: ["crawler: boom"] },
    };
    render(<DomainScorecard result={crawlerDegraded} />);

    const crawlerRow = screen.getByText("Acceso de bots").closest("li")!;
    expect(crawlerRow).toHaveTextContent("No disponible");
    expect(screen.queryAllByText("No disponible")).toHaveLength(1);
  });

  it("keeps only the crawler row scorable on a non-HTML page (RAO-13)", () => {
    render(<DomainScorecard result={unsupportedPageResult} />);

    expect(screen.getAllByText("No disponible")).toHaveLength(4);
    expect(screen.getByText("71")).toBeInTheDocument();
  });
});

describe("DomainScorecard score derivation", () => {
  it("scores schema 0 when no structured data is detected", () => {
    const noSchema = {
      ...auditResultFixture,
      schema: emptySchema,
    };
    render(<DomainScorecard result={noSchema} />);

    const schemaRow = screen.getByText("Datos estructurados").closest("li")!;
    expect(schemaRow).toHaveTextContent("0");
    const bar = schemaRow.querySelector(
      "[data-testid='row-bar']",
    ) as HTMLElement;
    expect(bar).toHaveStyle({ width: "0%" });
  });

  it("falls back to the first platform entry with a score when aio is absent", () => {
    const noAio = {
      ...auditResultFixture,
      platform: {
        ...auditResultFixture.platform,
        perPlatform: { chatgpt: { score: 55, criteria: [] } },
      },
    };
    render(<DomainScorecard result={noAio} />);

    const platformRow = screen.getByText("Plataforma").closest("li")!;
    expect(platformRow).toHaveTextContent("55");
  });
});
