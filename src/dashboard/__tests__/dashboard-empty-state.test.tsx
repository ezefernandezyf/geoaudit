import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardEmptyState } from "@/dashboard/dashboard-empty-state";

/**
 * U4 — Dashboard empty state (DSH-4). Honest copy for a user with zero audits
 * plus a single call-to-action that leads to the audit form (/report).
 */
describe("DashboardEmptyState (DSH-4)", () => {
  it("renders the empty-state heading and copy", () => {
    render(<DashboardEmptyState />);
    expect(
      screen.getByRole("heading", { name: "Aún no hiciste auditorías" }),
    ).toBeInTheDocument();
  });

  it("offers a call-to-action to run the first audit", () => {
    render(<DashboardEmptyState />);
    const cta = screen.getByRole("link", {
      name: "Hacer mi primera auditoría",
    });
    expect(cta).toHaveAttribute("href", "/report");
  });
});
