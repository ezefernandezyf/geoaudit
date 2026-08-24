import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportSkeleton } from "@/app/report/report-skeleton";

/**
 * U3.7 — Report loading skeleton (ARU-3): a single `role="status"` live
 * region announcing "Cargando reporte" plus the live StageStepper (ARU-10)
 * and the honest wait hint. The stepper is a client timer component but the
 * labels render immediately, so they are asserted without advancing time.
 */

afterEach(() => vi.useRealTimers());

describe("ReportSkeleton (ARU-3)", () => {
  it("renders exactly one status region labelled 'Cargando reporte'", () => {
    vi.useFakeTimers();
    render(<ReportSkeleton />);
    const status = screen.getByRole("status", { name: "Cargando reporte" });
    expect(status).toBeInTheDocument();
    // One live region only — composing the Skeleton primitive would nest N.
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("renders the wait helper text", () => {
    vi.useFakeTimers();
    render(<ReportSkeleton />);
    expect(
      screen.getByText("Puede tardar hasta 60 segundos."),
    ).toBeInTheDocument();
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
});
