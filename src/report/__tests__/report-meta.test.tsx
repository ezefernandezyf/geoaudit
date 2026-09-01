import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { toGeminiViewModel } from "@/report/presenters/toGeminiViewModel";
import { ReportMeta } from "@/report/report-meta";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { geminiViewFixture } from "@/report/__tests__/view-fixtures";

/**
 * U5.6 - ReportMeta (ARU-10): pure presenter of the view model - the honest
 * metadata strip (duration from the adapter, persisted date via ctx). The
 * view model carries only measured metrics (APT-10): no fabricated avisos.
 */
describe("ReportMeta", () => {
  it("renders the audit duration from the view model", () => {
    render(<ReportMeta view={geminiViewFixture} />);
    // Fixture durationMs 3214 → 3s (whole seconds, min 1).
    expect(screen.getByText("3s")).toBeInTheDocument();
  });

  it("renders the persisted audit date when the caller provides it (ctx)", () => {
    const dated = toGeminiViewModel(auditResultFixture, {
      auditDate: "2026-08-10",
    });
    render(<ReportMeta view={dated} />);
    expect(screen.getByText("2026-08-10")).toBeInTheDocument();
  });

  it("omits the date row when no date is available (honesty, APT-10)", () => {
    render(<ReportMeta view={geminiViewFixture} />);
    // Default ctx → auditDate null → only the duration row renders.
    expect(screen.getByText("3s")).toBeInTheDocument();
    expect(screen.getAllByRole("term")).toHaveLength(1);
  });
});
