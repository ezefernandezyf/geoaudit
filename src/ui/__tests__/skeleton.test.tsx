import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "@/ui/skeleton";

/**
 * U1.T4 — Skeleton primitive (DNF-4): the only required animation in the app.
 * Must be accessible (role="status" + aria-label) and motion-safe
 * (motion-reduce:animate-none).
 */
describe("Skeleton (DNF-4)", () => {
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

  it("applies the pulse animation classes", () => {
    const { container } = render(<Skeleton />);
    const status = container.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status?.className).toContain("animate-pulse");
    expect(status?.className).toContain("motion-reduce:animate-none");
  });

  it("merges caller className for sizing", () => {
    render(<Skeleton className="h-4 w-full" />);
    const status = screen.getByRole("status");
    expect(status.className).toContain("h-4");
    expect(status.className).toContain("w-full");
  });
});
