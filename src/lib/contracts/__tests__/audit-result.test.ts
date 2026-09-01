import { describe, expect, it } from "vitest";
import {
  auditResultSchema,
  multiPageResultSchema,
  severityBandSchema,
} from "@/lib/contracts/audit-result";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";

/** D3 master light shape - aggregate + per-page summaries (MPA-6). */
const multiPageFixture = {
  aggregate: {
    url: "https://example.com/",
    geoScore: 74,
    severityBand: "Fair",
    durationMs: 2400,
  },
  pages: [
    {
      url: "https://example.com/",
      geoScore: 68,
      severityBand: "Fair",
      durationMs: 900,
    },
    {
      url: "https://example.com/blog",
      geoScore: 80,
      severityBand: "Good",
      durationMs: 1100,
    },
  ],
};

describe("auditResultSchema (RAO-10 typed output)", () => {
  it("parses the full AuditResult fixture and preserves key values", () => {
    const result = auditResultSchema.safeParse(auditResultFixture);
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data;
      expect(data.summary.url).toBe("https://example.com/");
      expect(data.summary.geoScore).toBe(68);
      expect(data.summary.severityBand).toBe("Fair");
      expect(data.scoringModelVersion).toBe("2.0.0");
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

  it("rejects a scoringModelVersion other than 2.0.0 (RGS-7)", () => {
    for (const version of ["1.0.0", "0.9.0"]) {
      const result = auditResultSchema.safeParse({
        ...auditResultFixture,
        scoringModelVersion: version,
      });
      expect(result.success).toBe(false);
    }
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

describe("multiPageResultSchema (D3 master light shape, MPA-6)", () => {
  it("parses the aggregate + pages light shape and preserves key values", () => {
    const result = multiPageResultSchema.safeParse(multiPageFixture);
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data;
      expect(data.aggregate.url).toBe("https://example.com/");
      expect(data.aggregate.geoScore).toBe(74);
      expect(data.aggregate.severityBand).toBe("Fair");
      expect(data.pages).toHaveLength(2);
      expect(data.pages[0]).toEqual({
        url: "https://example.com/",
        geoScore: 68,
        severityBand: "Fair",
        durationMs: 900,
      });
      expect(data.pages[1].geoScore).toBe(80);
      expect(data.pages[1].severityBand).toBe("Good");
    }
  });

  it("rejects an aggregate geoScore outside 0-100", () => {
    const result = multiPageResultSchema.safeParse({
      ...multiPageFixture,
      aggregate: { ...multiPageFixture.aggregate, geoScore: 101 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a page severityBand outside the 5-band enum", () => {
    const result = multiPageResultSchema.safeParse({
      ...multiPageFixture,
      pages: [
        { ...multiPageFixture.pages[0], severityBand: "Amazing" },
        multiPageFixture.pages[1],
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative page durationMs", () => {
    const result = multiPageResultSchema.safeParse({
      ...multiPageFixture,
      pages: [
        { ...multiPageFixture.pages[0], durationMs: -5 },
        multiPageFixture.pages[1],
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a single-page multi-page result (1 page, triangulation)", () => {
    const single = {
      aggregate: multiPageFixture.aggregate,
      pages: [multiPageFixture.pages[0]],
    };
    expect(multiPageResultSchema.safeParse(single).success).toBe(true);
  });
});
