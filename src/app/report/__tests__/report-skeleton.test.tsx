import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReportSkeleton } from "@/app/report/report-skeleton";

/**
 * U3.T2 — Report loading skeleton (ARU-3): a single `role="status"` live
 * region announcing "Cargando reporte" plus the helper text about the wait.
 * The pulse animation itself is a visual concern (covered by the U3.T4 smoke)
 * — jsdom cannot compute styles, so only semantic outcomes are asserted here.
 */
describe("ReportSkeleton (ARU-3)", () => {
  it("renders exactly one status region labelled 'Cargando reporte'", () => {
    render(<ReportSkeleton />);
    const status = screen.getByRole("status", { name: "Cargando reporte" });
    expect(status).toBeInTheDocument();
    // One live region only — composing the Skeleton primitive would nest N.
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("renders the wait helper text", () => {
    render(<ReportSkeleton />);
    expect(
      screen.getByText("Puede tardar hasta 60 segundos."),
    ).toBeInTheDocument();
  });
});
