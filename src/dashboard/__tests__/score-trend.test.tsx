import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScoreTrend } from "@/dashboard/score-trend";
import { auditFixtures, manyAuditFixtures } from "./fixtures";

/**
 * U4 — Score trend (DSH-2). Pure CSS bars: each bar is a div whose height is
 * the audit's GEO score in %, colored by severity band. No chart library — the
 * assertions pin the DOM to divs (no svg/canvas could ever load).
 */
describe("ScoreTrend (DSH-2)", () => {
  it("renders one CSS bar per audit with height equal to its score", () => {
    const { container } = render(<ScoreTrend audits={auditFixtures} />);

    for (const audit of auditFixtures) {
      const bar = screen.getByRole("img", {
        name: `GEO Score ${audit.geoScore}`,
      });
      expect(bar).toHaveStyle({ height: `${audit.geoScore}%` });
    }

    // pure CSS bars: no chart library markup can appear
    expect(container.querySelector("svg, canvas")).toBeNull();
  });

  it("colors each bar by its severity band", () => {
    render(<ScoreTrend audits={auditFixtures} />);
    expect(screen.getByRole("img", { name: "GEO Score 87" })).toHaveClass(
      "bg-green-500",
    );
    expect(screen.getByRole("img", { name: "GEO Score 62" })).toHaveClass(
      "bg-emerald-500",
    );
    expect(screen.getByRole("img", { name: "GEO Score 41" })).toHaveClass(
      "bg-amber-500",
    );
    expect(screen.getByRole("img", { name: "GEO Score 23" })).toHaveClass(
      "bg-orange-500",
    );
    expect(screen.getByRole("img", { name: "GEO Score 9" })).toHaveClass(
      "bg-red-500",
    );
  });

  it("plots at most the 10 most recent audits", () => {
    render(<ScoreTrend audits={manyAuditFixtures} />);
    expect(screen.getAllByRole("img")).toHaveLength(10);
    expect(
      screen.getByRole("img", { name: "GEO Score 98" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "GEO Score 32" }),
    ).not.toBeInTheDocument();
  });
});
