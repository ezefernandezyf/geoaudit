import { describe, expect, it } from "vitest";
import { formatAuditDate, formatDurationMs } from "@/report/format";

/**
 * U4 - pure presentation formatting for the report domain. Shared by
 * ScoreHero (duration, ARU-8) and ReportMeta (date).
 */
describe("formatDurationMs", () => {
  it("renders seconds with one decimal", () => {
    expect(formatDurationMs(3214)).toBe("3.2 s");
    expect(formatDurationMs(0)).toBe("0.0 s");
  });

  it("rounds sub-second durations to one decimal", () => {
    expect(formatDurationMs(460)).toBe("0.5 s");
  });
});

describe("formatAuditDate", () => {
  it("renders the completedAt timestamp as a localized es-AR date", () => {
    const formatted = formatAuditDate(1_700_000_003_214);
    expect(formatted).toContain("2023");
    expect(formatted).not.toContain("GMT");
  });
});
