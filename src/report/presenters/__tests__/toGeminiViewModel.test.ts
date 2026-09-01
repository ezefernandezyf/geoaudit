import { describe, expect, it } from "vitest";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { toGeminiViewModel } from "@/report/presenters/toGeminiViewModel";

/**
 * U5.2 - Pure adapter `toGeminiViewModel` (APT-2..APT-6, APT-9, APT-10).
 * Maps a real AuditResult into the Gemini-shaped view model. Band thresholds
 * are the REAL 90/75/60/40 (`severityForScore`), never Gemini's 80/65/45/25.
 */
describe("toGeminiViewModel", () => {
  it("maps score + band using real thresholds (APT-2)", () => {
    const view = toGeminiViewModel(auditResultFixture);
    // geoScore 68 → real band "Fair" → lowercase "fair" (not Gemini's 65→"good").
    expect(view.totalScore).toBe(68);
    expect(view.band).toBe("fair");
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

  it("produces exactly five category scores with real row scores + weights (APT-6)", () => {
    const view = toGeminiViewModel(auditResultFixture);
    expect(view.categoryScores).toHaveLength(5);

    const names = view.categoryScores.map((c) => c.name);
    expect(names).toEqual([
      "Acceso de bots",
      "Citabilidad",
      "E-E-A-T",
      "Datos estructurados",
      "Plataforma",
    ]);

    const byId = Object.fromEntries(view.categoryScores.map((c) => [c.id, c]));
    // crawler.compositeScore 71 → fair; v2 weight 20%
    expect(byId.crawler.score).toBe(71);
    expect(byId.crawler.weight).toBe("20%");
    expect(byId.crawler.status).toBe("fair");
    // citability.pageScore 62 → fair; v2 weight 28%
    expect(byId.citability.score).toBe(62);
    expect(byId.citability.weight).toBe("28%");
    // content.composite 65 → fair; v2 weight 24%
    expect(byId.content.score).toBe(65);
    expect(byId.content.weight).toBe("24%");
    // schema: 1 detected, 1 issue → 90 → excellent; v2 weight 14%
    expect(byId.schema.score).toBe(90);
    expect(byId.schema.weight).toBe("14%");
    expect(byId.schema.status).toBe("excellent");
    // platform: aio 70 → fair (60-74 real band); v2 weight 14%
    expect(byId.platform.score).toBe(70);
    expect(byId.platform.weight).toBe("14%");
    expect(byId.platform.status).toBe("fair");
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
