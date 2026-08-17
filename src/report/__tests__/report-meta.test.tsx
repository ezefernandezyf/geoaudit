import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { ReportMeta } from "@/report/report-meta";
import { degradedCitabilityResult } from "@/report/__tests__/variants";

/**
 * U4.T5 — ReportMeta (ARU-7): the audit metadata strip — localized audit date
 * plus the honest `meta.errors` avisos when the audit was degraded. Never
 * hides a degraded result behind a clean score.
 */
describe("ReportMeta", () => {
  it("renders the audit date from the completed timestamp", () => {
    render(
      <ReportMeta
        summary={auditResultFixture.summary}
        meta={auditResultFixture.meta}
      />,
    );
    expect(screen.getByText(/2023/)).toBeInTheDocument();
  });

  it("renders no avisos when the audit has no errors", () => {
    render(
      <ReportMeta
        summary={auditResultFixture.summary}
        meta={auditResultFixture.meta}
      />,
    );
    expect(screen.queryByText("Avisos del análisis")).not.toBeInTheDocument();
  });

  it("lists meta.errors honestly when the audit is degraded (ARU-7)", () => {
    render(
      <ReportMeta
        summary={degradedCitabilityResult.summary}
        meta={degradedCitabilityResult.meta}
      />,
    );
    expect(screen.getByText("Avisos del análisis")).toBeInTheDocument();
    expect(screen.getByText("citability: boom")).toBeInTheDocument();
  });
});
