import { describe, expect, it } from "vitest";
import {
  auditResultFixture,
  auditResultV3Fixture,
} from "@/lib/contracts/__fixtures__/audit-result";
import { toGeminiViewModel } from "@/report/presenters/toGeminiViewModel";
import { brandErrorResult, brandZeroResult } from "@/report/__tests__/variants";

/**
 * U5.2 - Pure adapter `toGeminiViewModel` (APT-2..APT-6, APT-9, APT-10).
 * Maps a real AuditResult into the Gemini-shaped view model. Band thresholds
 * are the REAL single-source v3.1 bands 80/65/50/30 (`severityForScore`),
 * never Gemini's 80/65/45/25.
 */
describe("toGeminiViewModel", () => {
  it("maps score + band using real thresholds (APT-2)", () => {
    const view = toGeminiViewModel(auditResultFixture);
    // geoScore 68 → real band "Good" (v3.1 65-79) → lowercase "good".
    expect(view.totalScore).toBe(68);
    expect(view.band).toBe("good");
  });

  it("maps 74 to good with the real v3.1 thresholds (APT-2)", () => {
    // Real 80/65/50/30: 74 → Good (65-79). Gemini's 80/65/45/25 would also
    // give good - the discriminator is 47 (next test).
    const view = toGeminiViewModel({
      ...auditResultFixture,
      summary: { ...auditResultFixture.summary, geoScore: 74 },
    });
    expect(view.totalScore).toBe(74);
    expect(view.band).toBe("good");
  });

  it("maps 47 to poor, discriminating from Gemini's thresholds (APT-2)", () => {
    // Real 30-49 band → "poor"; Gemini's 80/65/45/25 would map 47 to "fair".
    const view = toGeminiViewModel({
      ...auditResultFixture,
      summary: { ...auditResultFixture.summary, geoScore: 47 },
    });
    expect(view.totalScore).toBe(47);
    expect(view.band).toBe("poor");
  });

  it("derives domain and falls title back to the domain (APT-3)", () => {
    const view = toGeminiViewModel(auditResultFixture);
    expect(view.domain).toBe("example.com");
    expect(view.title).toBe("example.com");
  });

  it("builds a summary only from real metrics (APT-4, APT-10)", () => {
    const view = toGeminiViewModel(auditResultFixture);
    expect(view.summary).toContain("example.com");
    expect(view.summary).toContain("68");
    expect(view.summary).toContain("~3s");
    // No invented metric like a fake citationRate / impactScore.
    expect(view.summary).not.toMatch(/cita/i);
    expect(view.summary).not.toMatch(/impact/i);
  });

  it("maps durationMs to whole seconds, min 1 (APT-5)", () => {
    const view = toGeminiViewModel(auditResultFixture);
    // 3214ms → 3s
    expect(view.durationSeconds).toBe(3);
  });

  it("produces exactly six category scores with real row scores + v3 weights (APT-6)", () => {
    const view = toGeminiViewModel(auditResultFixture);
    expect(view.categoryScores).toHaveLength(6);

    const names = view.categoryScores.map((c) => c.name);
    expect(names).toEqual([
      "Acceso de bots",
      "Citabilidad",
      "E-E-A-T",
      "Datos estructurados",
      "Plataforma",
      "Autoridad de marca",
    ]);

    const byId = Object.fromEntries(view.categoryScores.map((c) => [c.id, c]));
    // crawler.compositeScore 71 → good (v3.1 65-79); v3.1 technical weight 15%
    expect(byId.crawler.score).toBe(71);
    expect(byId.crawler.weight).toBe("15%");
    expect(byId.crawler.status).toBe("good");
    // citability.pageScore 62 → fair; v3.1 weight 24%
    expect(byId.citability.score).toBe(62);
    expect(byId.citability.weight).toBe("24%");
    // content.composite 65 → good (v3.1 65-79); v3.1 weight 23%
    expect(byId.content.score).toBe(65);
    expect(byId.content.weight).toBe("23%");
    // schema: engine score 61 (fixture) → fair; v3.1 weight 12%
    expect(byId.schema.score).toBe(61);
    expect(byId.schema.weight).toBe("12%");
    // platform: aio 70 → good (v3.1 65-79); v3.1 weight 14%
    expect(byId.platform.score).toBe(70);
    expect(byId.platform.weight).toBe("14%");
    // Legacy fixture has no brandAuthority → honest "No medido" (null), 12%.
    expect(byId.brand.score).toBeNull();
    expect(byId.brand.status).toBeNull();
    expect(byId.brand.weight).toBe("12%");
  });

  it("shows the six v3 weights summing to 100% (APT-6)", () => {
    const view = toGeminiViewModel(auditResultFixture);
    const sum = view.categoryScores.reduce(
      (total, c) => total + Number.parseFloat(c.weight),
      0,
    );
    expect(sum).toBe(100);
  });

  it("keeps keyMetric null and maxScore 100 for every category (APT-10)", () => {
    const view = toGeminiViewModel(auditResultFixture);
    for (const cat of view.categoryScores) {
      expect(cat.maxScore).toBe(100);
      expect(cat.keyMetric).toBeNull();
    }
  });

  it("passes through shareToken when present and null otherwise (APT-9)", () => {
    const withToken = toGeminiViewModel(auditResultFixture, {
      shareToken: "abc-123",
    });
    expect(withToken.shareToken).toBe("abc-123");

    const withoutToken = toGeminiViewModel(auditResultFixture);
    expect(withoutToken.shareToken).toBeNull();
  });

  it("does not invent a score for an absent metric (APT-10)", () => {
    const view = toGeminiViewModel(auditResultFixture);
    // There is no citationRate / impactScore / lastCrawled on the view model.
    expect(view).not.toHaveProperty("citationRate");
    expect(view).not.toHaveProperty("impactScore");
    expect(view).not.toHaveProperty("lastCrawled");
  });
});

describe("brand row honesty (APT-11)", () => {
  it("keeps a measured brand 0 as a real 0 with the no-presence note", () => {
    const view = toGeminiViewModel(brandZeroResult);
    const brand = view.categoryScores.find((c) => c.id === "brand")!;
    expect(brand.score).toBe(0);
    expect(brand.status).toBe("critical");
    expect(brand.weight).toBe("12%");
    expect(brand.description).toBe("Sin presencia externa.");
  });

  it("renders an absent brand (legacy 2.0.0) as No medido, weight still shown", () => {
    const view = toGeminiViewModel(auditResultFixture);
    const brand = view.categoryScores.find((c) => c.id === "brand")!;
    expect(brand.score).toBeNull();
    expect(brand.status).toBeNull();
    expect(brand.weight).toBe("12%");
    expect(brand.description).toBe(
      "Presencia externa de la marca en fuentes que citan las IA.",
    );
  });

  it("renders a failed brand engine as No medido, never a fabricated 0", () => {
    const view = toGeminiViewModel(brandErrorResult);
    const brand = view.categoryScores.find((c) => c.id === "brand")!;
    expect(brand.score).toBeNull();
    expect(brand.status).toBeNull();
    expect(brand.weight).toBe("12%");
  });

  it("maps a real v3 brand score with its honest band (80/65/50/30)", () => {
    const view = toGeminiViewModel(auditResultV3Fixture);
    const brand = view.categoryScores.find((c) => c.id === "brand")!;
    expect(brand.score).toBe(84);
    expect(brand.status).toBe("excellent"); // 84 → Excellent (v3.1 80+)
    expect(brand.weight).toBe("12%");
  });
});
