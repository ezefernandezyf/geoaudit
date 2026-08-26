import { describe, expect, it } from "vitest";
import { GEO_SCORE_V2_WEIGHTS, SPRINT_1_WEIGHTS } from "@/scoring/weights";
import { computeGeoScore, type EngineScores } from "@/scoring/calculator";

/**
 * T24 RED fixtures (RGS-1..RGS-10). Pure math over the renormalized weight
 * config — no fixtures, no network. Every assertion derives from the spec's
 * own numbers (RGS-1 uneven: 68.125 → 68; RGS-5 bands; RGS-9 rebalance).
 */

const FULL: EngineScores = {
  citability: 80,
  eeat: 80,
  technical: 80,
  schema: 80,
  platform: 80,
};

describe("computeGeoScore (RGS-1..RGS-10)", () => {
  it("RGS-1: all engines at 80 → composite 80 (equal weights cancel out)", () => {
    const result = computeGeoScore(FULL, SPRINT_1_WEIGHTS);
    expect(result.geoScore).toBe(80);
  });

  it("RGS-1: uneven scores apply weights exactly (60×.3125+90×.25+50×.1875+100×.125+40×.125 = 68.125 → 68)", () => {
    const result = computeGeoScore(
      {
        citability: 60,
        eeat: 90,
        technical: 50,
        schema: 100,
        platform: 40,
      },
      SPRINT_1_WEIGHTS,
    );
    expect(result.geoScore).toBe(68);
  });

  it("RGS-2: technical is composed from crawler×0.6 + platform×0.4 when technical is absent", () => {
    const result = computeGeoScore(
      {
        citability: 80,
        eeat: 80,
        schema: 80,
        crawler: 80,
        platform: 50,
      },
      SPRINT_1_WEIGHTS,
    );
    // technical = 80×0.6 + 50×0.4 = 68 → composite = (2500+2000+1275+1000+625)/100 = 74
    expect(result.dimensions.technical).toBe(68);
    expect(result.geoScore).toBe(74);
  });

  it("RGS-2: explicit technical wins over crawler composition when both provided", () => {
    const result = computeGeoScore(
      {
        citability: 80,
        eeat: 80,
        technical: 60,
        schema: 80,
        crawler: 100,
        platform: 50,
      },
      SPRINT_1_WEIGHTS,
    );
    // Technical stays 60 (pre-composed), NOT 100×0.6+50×0.4 = 80.
    expect(result.dimensions.technical).toBe(60);
    expect(result.geoScore).toBe(73);
  });

  it("RGS-2/RGS-9: platform present but crawler missing → technical cannot be composed, excluded with note", () => {
    const result = computeGeoScore(
      {
        citability: 70,
        eeat: 65,
        schema: 80,
        platform: 80,
      },
      SPRINT_1_WEIGHTS,
    );
    // No crawler → composition impossible → technical excluded.
    // (70×31.25 + 65×25 + 80×12.5 + 80×12.5) / (31.25+25+12.5+12.5) = 5812.5/81.25 = 71.54 → 72
    expect(result.dimensions.technical).toBeNull();
    expect(result.notes.join(" ")).toContain("technical");
    expect(result.geoScore).toBe(72);
  });

  it("RGS-9: missing platform (no crawler either) → technical excluded with note", () => {
    const result = computeGeoScore(
      {
        citability: 70,
        eeat: 65,
        schema: 80,
      },
      SPRINT_1_WEIGHTS,
    );
    // No technical, no crawler, no platform → technical + platform excluded,
    // weights rebalanced among citability + eeat + schema: (70×31.25+65×25+80×12.5)/68.75 = 70
    expect(result.dimensions.technical).toBeNull();
    expect(result.dimensions.platform).toBeNull();
    expect(result.notes.join(" ")).toContain("technical");
    expect(result.notes.join(" ")).toContain("platform");
    expect(result.geoScore).toBe(70);
  });

  it("RGS-4/RGS-5: 92.3 → rounds to 92 → Excellent", () => {
    const result = computeGeoScore(
      {
        citability: 92.3,
        eeat: 92.3,
        technical: 92.3,
        schema: 92.3,
        platform: 92.3,
      },
      SPRINT_1_WEIGHTS,
    );
    expect(result.geoScore).toBe(92);
    expect(result.severityBand).toBe("Excellent");
  });

  it("RGS-4/RGS-5: 73.8 → rounds to 74 → Fair", () => {
    const result = computeGeoScore(
      {
        citability: 73.8,
        eeat: 73.8,
        technical: 73.8,
        schema: 73.8,
        platform: 73.8,
      },
      SPRINT_1_WEIGHTS,
    );
    expect(result.geoScore).toBe(74);
    expect(result.severityBand).toBe("Fair");
  });

  it("RGS-5: 39 → Critical", () => {
    const result = computeGeoScore(
      {
        citability: 39,
        eeat: 39,
        technical: 39,
        schema: 39,
        platform: 39,
      },
      SPRINT_1_WEIGHTS,
    );
    expect(result.geoScore).toBe(39);
    expect(result.severityBand).toBe("Critical");
  });

  it("RGS-4: 103 → capped at 100 → Excellent", () => {
    const result = computeGeoScore(
      {
        citability: 103,
        eeat: 103,
        technical: 103,
        schema: 103,
        platform: 103,
      },
      SPRINT_1_WEIGHTS,
    );
    expect(result.geoScore).toBe(100);
    expect(result.severityBand).toBe("Excellent");
  });

  it("RGS-9: schema failure excluded, weights rebalanced among remaining 4 with note + reason", () => {
    const result = computeGeoScore(
      {
        citability: 70,
        eeat: 65,
        technical: 55,
        platform: 80,
        failures: { schema: "unsupported_content_type" },
      },
      SPRINT_1_WEIGHTS,
    );
    // (70×31.25 + 65×25 + 55×18.75 + 80×12.5) / (100 - 12.5) = 5843.75/87.5 = 66.79 → 67
    expect(result.geoScore).toBe(67);
    expect(result.dimensions.schema).toBeNull();
    expect(result.notes.join(" ")).toContain("schema");
    expect(result.notes.join(" ")).toContain("unsupported_content_type");
    expect(result.notes.join(" ")).toMatch(/rebalanc/);
  });

  it("RGS-10: zero-content page (crawler=60, citability=0, eeat=10, schema=0, platform=30) → valid score, not NaN", () => {
    const result = computeGeoScore(
      {
        crawler: 60,
        citability: 0,
        eeat: 10,
        schema: 0,
        platform: 30,
      },
      SPRINT_1_WEIGHTS,
    );
    // technical = 60×0.6 + 30×0.4 = 48 → (48×18.75 + 10×25 + 30×12.5)/100 = 15.25 → 15
    expect(Number.isNaN(result.geoScore)).toBe(false);
    expect(result.geoScore).toBe(15);
    expect(result.notes.join(" ")).toContain("no extractable content blocks");
  });

  it("RGS-10: empty input → valid score, not NaN, no crash", () => {
    const result = computeGeoScore({}, SPRINT_1_WEIGHTS);
    expect(Number.isNaN(result.geoScore)).toBe(false);
    expect(result.geoScore).toBeGreaterThanOrEqual(0);
    expect(result.geoScore).toBeLessThanOrEqual(100);
  });

  it("RGS-7/RGS-8: version 2.0.0 surfaced + v2 weights + Brand Authority note present", () => {
    const result = computeGeoScore(FULL, GEO_SCORE_V2_WEIGHTS);
    expect(result.scoringModelVersion).toBe("2.0.0");
    expect(result.weights.version).toBe("2.0.0");
    expect(result.weights.weights).toEqual({
      citability: 28,
      eeat: 24,
      technical: 20,
      schema: 14,
      platform: 14,
    });
    expect(result.weights.renormalizationNote).toContain("Brand Authority");
  });

  it("RGS-1: v2 weights keep citability dominant and sum to 100", () => {
    const { weights } = GEO_SCORE_V2_WEIGHTS;
    const sum = Object.values(weights).reduce((acc, w) => acc + w, 0);
    expect(sum).toBe(100);
    const entries = Object.entries(weights);
    const max = Math.max(...entries.map(([, w]) => w));
    const dominant = entries.find(([, w]) => w === max)?.[0];
    expect(dominant).toBe("citability");
  });

  it("keeps SPRINT_1_WEIGHTS as the historical 1.0.0 config for legacy regression", () => {
    expect(SPRINT_1_WEIGHTS.version).toBe("1.0.0");
    expect(SPRINT_1_WEIGHTS.weights).toEqual({
      citability: 31.25,
      eeat: 25,
      technical: 18.75,
      schema: 12.5,
      platform: 12.5,
    });
  });

  it("weights config defaults to GEO_SCORE_V2_WEIGHTS when omitted (RGS-1)", () => {
    const result = computeGeoScore(FULL);
    expect(result.scoringModelVersion).toBe("2.0.0");
    expect(result.geoScore).toBe(80);
  });

  it("RGS-6 severity band boundaries follow P3 (90/75/60/40)", () => {
    const bands = [
      [100, "Excellent"],
      [90, "Excellent"],
      [89, "Good"],
      [75, "Good"],
      [74, "Fair"],
      [60, "Fair"],
      [59, "Poor"],
      [40, "Poor"],
      [39, "Critical"],
      [0, "Critical"],
    ] as const;
    for (const [value, expected] of bands) {
      const result = computeGeoScore(
        {
          citability: value,
          eeat: value,
          technical: value,
          schema: value,
          platform: value,
        },
        SPRINT_1_WEIGHTS,
      );
      expect(result.severityBand).toBe(expected);
    }
  });
});
