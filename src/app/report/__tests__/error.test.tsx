import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReportError from "@/app/report/error";

/**
 * U3.T3 — Error boundary (ARU-4): catches unexpected errors with a friendly
 * message and a "Reintentar" button wired to Next's `reset()`.
 */
describe("ReportError (ARU-4)", () => {
  it("renders a friendly message with role=alert", () => {
    render(<ReportError error={new Error("boom")} reset={() => {}} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No pudimos generar el reporte",
    );
  });

  it("renders a Reintentar button that calls reset()", () => {
    const reset = vi.fn();
    render(<ReportError error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
