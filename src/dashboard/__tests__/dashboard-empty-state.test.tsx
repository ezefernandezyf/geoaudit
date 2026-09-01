import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardEmptyState } from "@/dashboard/dashboard-empty-state";
import { DASHBOARD_COPY } from "@/lib/copy";

/**
 * DSH-4 (WU-4): the empty state MUST render the neutral copy from
 * `DASHBOARD_COPY.empty` - not hardcoded voseo strings. The regression this
 * guards is a coverage gap: the old test asserted the CONSTANT (copy.test.ts)
 * while the COMPONENT bypassed it with inline voseo ("Aún no hiciste…",
 * "Ejecutá…", "Hacer mi primera…"). These tests assert the rendered component.
 */
const VOSEO_FORMS = /Aún no hiciste|Ejecutá|Hacer mi primera|tenés|podés|hacé/i;

describe("DashboardEmptyState (DSH-4)", () => {
  it("renders the empty-state heading from DASHBOARD_COPY.empty", () => {
    render(<DashboardEmptyState />);
    expect(
      screen.getByRole("heading", { name: DASHBOARD_COPY.empty.title }),
    ).toBeInTheDocument();
  });

  it("renders the empty-state body from DASHBOARD_COPY.empty", () => {
    render(<DashboardEmptyState />);
    expect(screen.getByText(DASHBOARD_COPY.empty.body)).toBeInTheDocument();
  });

  it("offers the DASHBOARD_COPY.empty CTA linking to the audit form", () => {
    render(<DashboardEmptyState />);
    const cta = screen.getByRole("link", {
      name: DASHBOARD_COPY.empty.cta,
    });
    expect(cta).toHaveAttribute("href", "/report");
  });

  it("renders no voseo forms in the visible text (DSH-4 neutral copy)", () => {
    const { container } = render(<DashboardEmptyState />);
    expect(container.textContent).not.toMatch(VOSEO_FORMS);
  });
});
