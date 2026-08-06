import { describe, expect, it } from "vitest";
import {
  auditResultSchema,
  severityBandSchema,
} from "@/lib/contracts/audit-result";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";

describe("auditResultSchema (RAO-10 typed output)", () => {
  it("parses the full AuditResult fixture and preserves key values", () => {
    const result = auditResultSchema.safeParse(auditResultFixture);
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data;
      expect(data.summary.url).toBe("https://example.com/");
      expect(data.summary.geoScore).toBe(68);
      expect(data.summary.severityBand).toBe("Fair");
      expect(data.scoringModelVersion).toBe("1.0.0");
      expect(data.meta.errors).toEqual([]);
    }
  });

  it("exposes every top-level AuditResult field required by RAO-10", () => {
    const result = auditResultSchema.safeParse(auditResultFixture);
    expect(result.success).toBe(true);
    if (result.success) {
      const keys = Object.keys(result.data).sort();
      expect(keys).toEqual(
        [
          "citability",
          "content",
          "crawlers",
          "meta",
          "platform",
          "schema",
          "scoringModelVersion",
          "summary",
        ].sort(),
      );
    }
  });

  it("rejects a geoScore outside 0-100", () => {
    const result = auditResultSchema.safeParse({
      ...auditResultFixture,
      summary: { ...auditResultFixture.summary, geoScore: 101 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a severityBand outside the 5-band enum", () => {
    const result = auditResultSchema.safeParse({
      ...auditResultFixture,
      summary: { ...auditResultFixture.summary, severityBand: "Amazing" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a scoringModelVersion other than 1.0.0", () => {
    const result = auditResultSchema.safeParse({
      ...auditResultFixture,
      scoringModelVersion: "0.9.0",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-URL summary.url", () => {
    const result = auditResultSchema.safeParse({
      ...auditResultFixture,
      summary: { ...auditResultFixture.summary, url: "not-a-url" },
    });
    expect(result.success).toBe(false);
  });
});

describe("severityBandSchema (RGS-5 bands)", () => {
  it("accepts all five bands and rejects anything else", () => {
    for (const band of [
      "Excellent",
      "Good",
      "Fair",
      "Poor",
      "Critical",
    ] as const) {
      expect(severityBandSchema.safeParse(band).success).toBe(true);
    }
    expect(severityBandSchema.safeParse("Amazing").success).toBe(false);
  });
});
