import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportSkeleton } from "@/app/report/report-skeleton";

/**
 * U5.11 — Report loading skeleton (ARU-3 + ARU-10, design U5): Gemini
 * LiveReportPage scanning card — spinner + "Auditoría en Progreso" + serif
 * "Analizando <url>" + the animated StageStepper (progress bar + numbered
 * circles) + the AuditReportSkeleton preview. NO simulation: stages pace on
 * the honest timer only; the real report arrives via the Suspense stream.
 * The single `role="status"` live region is the nested AuditReportSkeleton.
 */

afterEach(() => vi.useRealTimers());

describe("ReportSkeleton (ARU-3 + U5.11)", () => {
  it("announces the pending report through the outer AuditReportSkeleton region", () => {
    vi.useFakeTimers();
    render(<ReportSkeleton />);
    // The shell's single OUTER announcement is the AuditReportSkeleton region
    // (U1.7 convention: each Skeleton block carries its own status role).
    expect(
      screen.getByRole("status", { name: "Cargando auditoría GEO..." }),
    ).toBeInTheDocument();
  });

  it("renders the Gemini scanning header: spinner, eyebrow and analyzing title", () => {
    vi.useFakeTimers();
    render(<ReportSkeleton url="https://ejemplo.com" />);

    expect(screen.getByText("Auditoría en Progreso")).toBeInTheDocument();
    expect(screen.getByText("Analizando")).toBeInTheDocument();
    expect(screen.getByText("https://ejemplo.com")).toBeInTheDocument();
    expect(
      screen.getByText(
        "El motor GEO está ejecutando inspecciones en tiempo real. Duración estimada: 15-30s.",
      ),
    ).toBeInTheDocument();
  });

  it("falls back to 'el sitio' when no url is available (loading.tsx path)", () => {
    vi.useFakeTimers();
    render(<ReportSkeleton />);
    expect(screen.getByText("el sitio")).toBeInTheDocument();
  });

  it("renders the live stage stepper with its six stages (ARU-10)", () => {
    vi.useFakeTimers();
    render(<ReportSkeleton />);
    expect(
      screen.getByRole("list", { name: "Progreso de la auditoría" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Conectando y resolviendo DNS"),
    ).toBeInTheDocument();
    expect(screen.getByText("Inspeccionando robots.txt")).toBeInTheDocument();
    expect(screen.getByText("Evaluando citabilidad")).toBeInTheDocument();
    expect(
      screen.getByText("Analizando E-E-A-T del contenido"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Validando datos estructurados"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Computando readiness de plataformas"),
    ).toBeInTheDocument();
  });

  it("renders the progress bar and the skeleton preview label", () => {
    vi.useFakeTimers();
    render(<ReportSkeleton />);
    expect(
      screen.getByRole("progressbar", { name: "Progreso de la auditoría" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Preparando Scorecard...")).toBeInTheDocument();
  });
});
