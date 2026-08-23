import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { AuditReport } from "@/report/audit-report";

/**
 * U1 — Extracted shared report component (ADP-4/ADP-5). `<AuditReport
 * result>` renders the full MVP report from a persisted result object —
 * ScoreHero + DomainScorecard + TopFindings + ReportMeta. This is the markup
 * the AuditRunner used to own privately; the extraction moves it verbatim so
 * `/report` and the detail page render from ONE source of truth.
 */
describe("AuditReport (ADP-4)", () => {
  it("renders the report sections from a result object", () => {
    render(<AuditReport result={auditResultFixture} />);

    // ScoreHero: score + URL + band chip.
    expect(screen.getByText("68")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/")).toBeInTheDocument();
    expect(screen.getByText("Regular")).toBeInTheDocument();

    // DomainScorecard rows.
    expect(screen.getByText("Acceso de bots")).toBeInTheDocument();
    expect(screen.getByText("Citabilidad")).toBeInTheDocument();
    expect(screen.getByText("E-E-A-T")).toBeInTheDocument();
    expect(screen.getByText("Datos estructurados")).toBeInTheDocument();
    expect(screen.getByText("Plataforma")).toBeInTheDocument();

    // TopFindings: blocked bot + schema issue.
    expect(screen.getByText("OAI-SearchBot")).toBeInTheDocument();
    expect(screen.getByText("Organization missing sameAs")).toBeInTheDocument();
  });

  it("exposes the aria label of the report section", () => {
    render(<AuditReport result={auditResultFixture} />);
    expect(
      screen.getByRole("region", { name: "Reporte de auditoría" }),
    ).toBeInTheDocument();
  });
});
