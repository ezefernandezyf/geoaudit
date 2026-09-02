import { describe, expect, it } from "vitest";
import {
  GEO_SCORE_V2_WEIGHTS,
  GEO_SCORE_V3_WEIGHTS,
  GEO_SCORE_V3_1_WEIGHTS,
  SPRINT_1_WEIGHTS,
} from "@/scoring/weights";
import { GEO_SCORE_V3_1_WEIGHTS as RE_EXPORTED_V3_1 } from "@/scoring/index";
import {
  computeGeoScore,
  DIMENSIONS,
  type EngineScores,
} from "@/scoring/calculator";

/**
 * T24 RED fixtures (RGS-1..RGS-10) + T5 v3 cases (RGS-1/7/8/9/10/11). Pure
 * math over the renormalized weight config - no fixtures, no network. Every
 * assertion derives from the spec's own numbers (RGS-1 uneven v2: 68.125 → 68;
 * v3: 68.4 → 68; RGS-11 brand=0: 64; RGS-5 bands; RGS-9 rebalance).
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

  it("weights config defaults to GEO_SCORE_V3_WEIGHTS when omitted (RGS-1)", () => {
    const result = computeGeoScore(FULL);
    expect(result.scoringModelVersion).toBe("3.0.0");
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

  // --- T5: scoring v3 (RGS-1/7/8/9/10/11) ---

  it("RGS-1: v3 all engines at 80 (incl. brand_authority) → composite 80", () => {
    const result = computeGeoScore(
      { ...FULL, brand_authority: 80 },
      GEO_SCORE_V3_WEIGHTS,
    );
    expect(result.geoScore).toBe(80);
  });

  it("RGS-1: v3 uneven scores apply weights exactly (60×.224+90×.192+50×.16+100×.112+40×.112+70×.20 = 68.4 → 68)", () => {
    const result = computeGeoScore(
      {
        citability: 60,
        eeat: 90,
        technical: 50,
        schema: 100,
        platform: 40,
        brand_authority: 70,
      },
      GEO_SCORE_V3_WEIGHTS,
    );
    expect(result.geoScore).toBe(68);
  });

  it("RGS-1: v3 weights keep citability dominant and sum to 100", () => {
    const { weights } = GEO_SCORE_V3_WEIGHTS;
    const sum = Object.values(weights).reduce((acc, w) => acc + (w ?? 0), 0);
    expect(sum).toBe(100);
    const entries = Object.entries(weights);
    const max = Math.max(...entries.map(([, w]) => w ?? 0));
    const dominant = entries.find(([, w]) => (w ?? 0) === max)?.[0];
    expect(dominant).toBe("citability");
  });

  it("RGS-7/RGS-8: v3 surfaces version 3.0.0, 6-dim weights and re-entry note", () => {
    const result = computeGeoScore(
      { ...FULL, brand_authority: 80 },
      GEO_SCORE_V3_WEIGHTS,
    );
    expect(result.scoringModelVersion).toBe("3.0.0");
    expect(result.weights.version).toBe("3.0.0");
    expect(result.weights.weights).toEqual({
      citability: 22.4,
      eeat: 19.2,
      technical: 16,
      schema: 11.2,
      platform: 11.2,
      brand_authority: 20,
    });
    expect(result.weights.renormalizationNote).toMatch(/re-enters|re-entra/);
    expect(result.weights.renormalizationNote).toContain("20%");
  });

  it("RGS-11: DIMENSIONS registers 6 entries including brand_authority", () => {
    expect(DIMENSIONS).toHaveLength(6);
    expect(DIMENSIONS).toContain("brand_authority");
  });

  it("RGS-11: brand_authority score is mapped into dimensions when provided", () => {
    const result = computeGeoScore(
      { ...FULL, brand_authority: 55 },
      GEO_SCORE_V3_WEIGHTS,
    );
    expect(result.dimensions.brand_authority).toBe(55);
  });

  it("RGS-9: schema fails with v3 → rebalanced among remaining 5 (incl. brand) with reason", () => {
    const result = computeGeoScore(
      {
        citability: 70,
        eeat: 65,
        technical: 55,
        platform: 80,
        brand_authority: 50,
        failures: { schema: "unsupported_content_type" },
      },
      GEO_SCORE_V3_WEIGHTS,
    );
    // (70×22.4 + 65×19.2 + 55×16 + 80×11.2 + 50×20) / (22.4+19.2+16+11.2+20) = 5592/88.8 = 62.97 → 63
    expect(result.geoScore).toBe(63);
    expect(result.dimensions.schema).toBeNull();
    expect(result.notes.join(" ")).toContain("schema");
    expect(result.notes.join(" ")).toContain("unsupported_content_type");
    expect(result.notes.join(" ")).toMatch(/rebalanc/);
  });

  it("RGS-11: brand fails (wikidata_rate_limit) → excluded, weights rebalanced among 5", () => {
    const result = computeGeoScore(
      {
        citability: 70,
        eeat: 65,
        technical: 55,
        platform: 80,
        failures: { brand_authority: "wikidata_rate_limit" },
      },
      GEO_SCORE_V3_WEIGHTS,
    );
    // (70×22.4 + 65×19.2 + 55×16 + 80×11.2) / (22.4+19.2+16+11.2) = 4592/68.8 = 66.74 → 67
    expect(result.dimensions.brand_authority).toBeNull();
    expect(result.geoScore).toBe(67);
    expect(result.notes.join(" ")).toContain("brand_authority");
    expect(result.notes.join(" ")).toContain("wikidata_rate_limit");
    expect(result.notes.join(" ")).toMatch(/rebalanc/);
  });

  it("RGS-11: brand measured 0 penalizes → all-80 + brand 0 = 64 with note", () => {
    const result = computeGeoScore(
      { ...FULL, brand_authority: 0 },
      GEO_SCORE_V3_WEIGHTS,
    );
    // 80×(0.224+0.192+0.16+0.112+0.112) + 0×0.20 = 80×0.8 = 64
    expect(result.geoScore).toBe(64);
    expect(result.dimensions.brand_authority).toBe(0);
    expect(result.notes.join(" ")).toContain("brand 0: no external presence");
  });

  it("RGS-10: empty page with brand=0 documents both zero notes", () => {
    const result = computeGeoScore(
      {
        crawler: 60,
        citability: 0,
        eeat: 10,
        schema: 0,
        platform: 30,
        brand_authority: 0,
      },
      GEO_SCORE_V3_WEIGHTS,
    );
    // technical = 60×0.6 + 30×0.4 = 48 → (48×16 + 10×19.2 + 30×11.2)/100 = 12.96 → 13
    expect(Number.isNaN(result.geoScore)).toBe(false);
    expect(result.geoScore).toBe(13);
    expect(result.notes.join(" ")).toContain("no extractable content blocks");
    expect(result.notes.join(" ")).toContain("brand 0: no external presence");
  });

  it("v2 5-dim regression: brand_authority absent with V2 config stays excluded (RGS-9)", () => {
    const result = computeGeoScore(FULL, GEO_SCORE_V2_WEIGHTS);
    expect(result.scoringModelVersion).toBe("2.0.0");
    expect(result.dimensions.brand_authority).toBeNull();
    expect(result.geoScore).toBe(80);
  });

  // --- T1: scoring v3.1 calibration (RGS-1/7/8, sprint 14) ---

  it("RGS-1: v3.1 all engines at 80 (incl. brand_authority) → composite 80", () => {
    const result = computeGeoScore(
      { ...FULL, brand_authority: 80 },
      GEO_SCORE_V3_1_WEIGHTS,
    );
    expect(result.geoScore).toBe(80);
  });

  it("RGS-1: v3.1 uneven scores apply weights exactly (60×.24+90×.23+50×.15+100×.12+40×.14+70×.12 = 68.6 → 69)", () => {
    const result = computeGeoScore(
      {
        citability: 60,
        eeat: 90,
        technical: 50,
        schema: 100,
        platform: 40,
        brand_authority: 70,
      },
      GEO_SCORE_V3_1_WEIGHTS,
    );
    expect(result.geoScore).toBe(69);
  });

  it("RGS-1: v3.1 weights keep citability dominant and sum to 100", () => {
    const { weights } = GEO_SCORE_V3_1_WEIGHTS;
    const sum = Object.values(weights).reduce((acc, w) => acc + (w ?? 0), 0);
    expect(sum).toBe(100);
    const entries = Object.entries(weights);
    const max = Math.max(...entries.map(([, w]) => w ?? 0));
    const dominant = entries.find(([, w]) => (w ?? 0) === max)?.[0];
    expect(dominant).toBe("citability");
  });

  it("RGS-7/RGS-8: v3.1 surfaces version 3.1.0, 24/23/15/12/14/12 weights and the brand 20% → 12% recalibration note", () => {
    const result = computeGeoScore(
      { ...FULL, brand_authority: 80 },
      GEO_SCORE_V3_1_WEIGHTS,
    );
    expect(result.scoringModelVersion).toBe("3.1.0");
    expect(result.weights.version).toBe("3.1.0");
    expect(result.weights.weights).toEqual({
      citability: 24,
      eeat: 23,
      technical: 15,
      schema: 12,
      platform: 14,
      brand_authority: 12,
    });
    expect(result.weights.renormalizationNote).toContain("20%");
    expect(result.weights.renormalizationNote).toContain("12%");
  });

  it("T3: GEO_SCORE_V3_1_WEIGHTS is re-exported from @/scoring (orchestrator import path)", () => {
    expect(RE_EXPORTED_V3_1.version).toBe("3.1.0");
    expect(RE_EXPORTED_V3_1.weights.brand_authority).toBe(12);
  });
});
