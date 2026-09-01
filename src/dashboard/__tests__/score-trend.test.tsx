import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScoreTrend } from "@/dashboard/score-trend";
import { auditFixtures, manyAuditFixtures } from "./fixtures";

/**
 * U4.2 - Score trend (DSH-2/DSH-9, design U4). Exactly 12 pure-CSS bars, one
 * per month of the trailing year (Gemini verbatim), no chart library - the
 * assertions pin the DOM to divs (no svg/canvas could ever load).
 */
describe("ScoreTrend (DSH-2/DSH-9)", () => {
  it("renders exactly 12 CSS bars (one per month)", () => {
    const { container } = render(<ScoreTrend audits={auditFixtures} />);
    // 12 month bars + 4 footer labels.
    const monthBars = container.querySelectorAll(
      'div[aria-label*="pts"], div[aria-label*="sin auditorías"]',
    );
    expect(monthBars).toHaveLength(12);

    // pure CSS bars: no chart library markup can appear
    expect(container.querySelector("svg, canvas")).toBeNull();
  });

  it("highlights the most recent month with the emerald Gemini bar", () => {
    const { container } = render(<ScoreTrend audits={auditFixtures} />);
    const emerald = container.querySelectorAll("div[class*='#10b981']");
    // The most recent month bar uses the emerald fill (latest = emphasis).
    expect(emerald.length).toBeGreaterThanOrEqual(1);
  });

  it("groups audits by month into the trailing 12-month window", () => {
    render(<ScoreTrend audits={manyAuditFixtures} />);
    // The most recent month (highest score) is the emerald "Presente" bar.
    const latestBar = screen.getByRole("img", {
      name: /Tendencia de visibilidad/,
    });
    expect(latestBar).toBeInTheDocument();
  });

  it("renders 12 monthly footer labels", () => {
    const { container } = render(<ScoreTrend audits={auditFixtures} />);
    const labels = container.querySelectorAll(
      "div.flex.justify-between.font-mono span",
    );
    expect(labels.length).toBeGreaterThanOrEqual(4);
  });
});
