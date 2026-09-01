import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuditReportSkeleton, Skeleton } from "@/ui/skeleton";

/**
 * U1.7 - Skeleton primitive (DNF-11): Gemini verbatim - slate-300 blocks with
 * `animate-pulse-subtle` (globals.css keyframes + reduced-motion), shape
 * variants, explicit width/height, accessible role="status". Plus the
 * `AuditReportSkeleton` composed placeholder.
 */
describe("Skeleton (DNF-11)", () => {
  it("renders with role=status for screen readers", () => {
    render(<Skeleton />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("defaults aria-label to Cargando…", () => {
    render(<Skeleton />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Cargando…",
    );
  });

  it("accepts a custom aria-label", () => {
    render(<Skeleton label="Generando reporte…" />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Generando reporte…",
    );
  });

  it("applies the Gemini pulse + slate classes (hex)", () => {
    const { container } = render(<Skeleton />);
    const status = container.querySelector('[role="status"]');
    expect(status?.className).toContain("bg-[#e2e8f0]");
    expect(status?.className).toContain("animate-pulse-subtle");
  });

  it("applies shape variants", () => {
    const { rerender } = render(<Skeleton variant="circular" />);
    expect(screen.getByRole("status").className).toContain("rounded-full");

    rerender(<Skeleton variant="text" />);
    expect(screen.getByRole("status").className).toContain("h-4");

    rerender(<Skeleton variant="rectangular" />);
    expect(screen.getByRole("status").className).toContain("rounded-lg");
  });

  it("applies explicit width/height as inline styles", () => {
    render(<Skeleton width="50%" height={40} />);
    const status = screen.getByRole("status");
    expect(status).toHaveStyle({ width: "50%", height: "40px" });
  });

  it("merges caller className for sizing", () => {
    render(<Skeleton className="h-4 w-full" />);
    const status = screen.getByRole("status");
    expect(status.className).toContain("h-4");
    expect(status.className).toContain("w-full");
  });
});

describe("AuditReportSkeleton (U1.7)", () => {
  it("exposes a single outer live region labelled Cargando auditoría GEO...", () => {
    render(<AuditReportSkeleton />);
    const outer = screen.getByRole("status", {
      name: "Cargando auditoría GEO...",
    });
    expect(outer).toBeInTheDocument();
  });

  it("composes multiple pulse blocks", () => {
    const { container } = render(<AuditReportSkeleton />);
    expect(
      container.querySelectorAll("[class*='animate-pulse-subtle']").length,
    ).toBeGreaterThan(5);
  });
});
