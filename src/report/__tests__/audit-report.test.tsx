import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { AuditReport } from "@/report/audit-report";

/**
 * U5.8 - AuditReport (ARU-10): consumes `toGeminiViewModel(result, ctx)` at
 * the boundary and renders the full Gemini report - ScoreHero (real
 * benchmark) + DomainScorecard + PlatformMatrix + TopFindings + ReportMeta -
 * so every child is a pure presenter of the view model.
 */
describe("AuditReport (ARU-10)", () => {
  it("renders the report sections from a result through the adapter", () => {
    render(<AuditReport result={auditResultFixture} />);

    // ScoreHero: score + band chip + hostname domain. "Regular" appears in the
    // hero AND the two bottom-passage finding badges (same real band).
    expect(screen.getByText("68")).toBeInTheDocument();
    expect(screen.getAllByText("example.com").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Regular").length).toBeGreaterThanOrEqual(1);

    // Benchmark with the REAL thresholds (ARU-11).
    expect(screen.getByText("80 - 100")).toBeInTheDocument();
    expect(screen.getByText("50 - 64")).toBeInTheDocument();

    // DomainScorecard rows (view-model categoryScores). The names also appear
    // as findings category chips → assert presence, not uniqueness.
    expect(screen.getAllByText("Acceso de bots").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getAllByText("Citabilidad").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("E-E-A-T")).toBeInTheDocument();
    expect(
      screen.getAllByText("Datos estructurados").length,
    ).toBeGreaterThanOrEqual(1);

    // TopFindings: blocked bot + schema issue (derived, real engine data).
    expect(screen.getByText("Bots de IA bloqueados")).toBeInTheDocument();
    expect(
      screen.getByText("Datos estructurados: faltan estas propiedades"),
    ).toBeInTheDocument();
  });

  it("exposes the aria label of the report section", () => {
    render(<AuditReport result={auditResultFixture} />);
    expect(
      screen.getByRole("region", { name: "Reporte de auditoría" }),
    ).toBeInTheDocument();
  });

  it("includes the six-platform matrix with Claude 'No medido' (ARU-12)", () => {
    render(<AuditReport result={auditResultFixture} />);
    expect(
      screen.getByRole("region", { name: "Matriz de plataformas de IA" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
    expect(screen.getByText("Claude")).toBeInTheDocument();
    // Claude has no perPlatform measurement → "No medido"; on this legacy
    // fixture the brand row in the DomainScorecard is "No medido" too (APT-11).
    expect(screen.getAllByText("No medido").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the real generated JSON-LD code snippet (ADP-6)", () => {
    render(<AuditReport result={auditResultFixture} />);
    // schema.generated exists in the fixture → the REAL snippet, not invented.
    expect(screen.getByText(/"@type": "Organization"/)).toBeInTheDocument();
    // The snippet is a real JSON string (not a placeholder like "const x = 1").
    expect(screen.queryByText(/const x = 1/)).not.toBeInTheDocument();
  });

  it("passes the caller context through to the view model (APT-9)", () => {
    render(
      <AuditReport
        result={auditResultFixture}
        ctx={{ auditDate: "2026-08-10", shareToken: "tok-1" }}
      />,
    );
    // The persisted date surfaces in the hero + the meta strip.
    expect(screen.getAllByText(/2026-08-10/).length).toBeGreaterThanOrEqual(1);
  });
});

describe("AuditReport PDF export entry (PDF-10, sprint 15)", () => {
  it("renders an 'Exportar PDF' link to /api/report/{id}/pdf when the audit persisted", () => {
    render(
      <AuditReport
        result={auditResultFixture}
        ctx={{ exportPdfHref: "/api/report/123/pdf" }}
      />,
    );
    const exportLink = screen.getByRole("link", { name: "Exportar PDF" });
    expect(exportLink).toHaveAttribute("href", "/api/report/123/pdf");
  });

  it("renders no export entry when persistence failed (no id) - no dead link", () => {
    render(<AuditReport result={auditResultFixture} ctx={{}} />);
    expect(screen.queryByRole("link", { name: "Exportar PDF" })).toBeNull();
    expect(screen.queryByRole("link", { name: /crear cuenta/i })).toBeNull();
  });

  it("shows PDF account-benefit copy with a signup CTA instead of the export for anonymous users", () => {
    render(
      <AuditReport result={auditResultFixture} ctx={{ exportAnonCta: true }} />,
    );
    // No export entry - anonymous has no persisted id to link.
    expect(screen.queryByRole("link", { name: "Exportar PDF" })).toBeNull();
    // Marketing gate: PDF account-benefit copy with a signup CTA.
    const cta = screen.getByRole("link", { name: /crear cuenta/i });
    expect(cta).toHaveAttribute("href", "/signup");
  });
});
