import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { AuditReport } from "@/report/audit-report";

/**
 * U3.6 — Shared report component (ADP-4/ADP-5/ADP-7). `<AuditReport result>`
 * renders the full MVP report from a persisted result object — ScoreHero +
 * DomainScorecard + PlatformMatrix + TopFindings + ReportMeta. The platform
 * matrix and mono-formatted code findings are part of the shared component
 * (not duplicated per page), so /report and the detail page match.
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
    // "Plataforma" appears twice: scorecard row + matrix column header.
    expect(screen.getAllByText("Plataforma").length).toBeGreaterThanOrEqual(1);

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

  it("includes the platform matrix in the shared report (ADP-4/ADP-6)", () => {
    render(<AuditReport result={auditResultFixture} />);
    expect(
      screen.getByRole("region", { name: "Matriz de plataformas de IA" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
    // Claude has no perPlatform measurement → "No medido".
    expect(screen.getByText("No medido")).toBeInTheDocument();
  });

  it("renders code findings in monospace (ADP-7)", () => {
    render(<AuditReport result={auditResultFixture} />);

    // Schema issues render as code (mono).
    const schemaIssue = screen.getByText("Organization missing sameAs");
    expect(schemaIssue.className).toContain("font-mono");

    // Suggestion keys render as code (mono).
    const suggestionKey = screen.getByText("define_core_concept");
    expect(suggestionKey.className).toContain("font-mono");
  });
});
