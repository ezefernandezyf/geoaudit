import { describe, expect, it } from "vitest";
import type {
  CategoryScore,
  Finding,
  GeminiBand,
  GeminiView,
  PlatformRow,
} from "@/report/presenters/types";

/**
 * U5.1 — View model shape (APT-1). The adapter returns a single object whose
 * fields cover every field the report components need, with no invented
 * metrics (APT-10). Types are erased at runtime, so this test proves the
 * SHAPE contract by exercising the type surface: a representative value must
 * be assignable and its required fields all present.
 */

const representative: GeminiView = {
  totalScore: 68,
  band: "fair",
  domain: "example.com",
  title: "example.com",
  summary: "example.com — GEO Score 68 (fair) en ~3s",
  durationSeconds: 3,
  auditDate: null,
  categoryScores: [],
  findings: [],
  platforms: [],
  shareToken: null,
};

const requiredViewFields = [
  "totalScore",
  "band",
  "domain",
  "title",
  "summary",
  "durationSeconds",
  "auditDate",
  "categoryScores",
  "findings",
  "platforms",
  "shareToken",
] as const;

describe("GeminiView shape (APT-1)", () => {
  it("exposes all report fields on the view model", () => {
    expect(Object.keys(representative).sort()).toEqual(
      [...requiredViewFields].sort(),
    );
  });

  it("accepts only the lowercase Gemini band union", () => {
    const bands: GeminiBand[] = [
      "excellent",
      "good",
      "fair",
      "poor",
      "critical",
    ];
    expect(bands).toContain(representative.band);
    expect(representative.band).not.toMatch(/^[A-Z]/);
  });

  it("category, finding and platform rows expose their required fields", () => {
    const cat: CategoryScore = {
      id: "crawler",
      name: "Acceso de bots",
      score: 71,
      maxScore: 100,
      weight: "18.75%",
      status: "fair",
      keyMetric: null,
      description: "Acceso de los crawlers de IA al sitio.",
    };
    const finding: Finding = {
      id: "schema-issues",
      title: "Datos estructurados: faltan estas propiedades",
      severity: "excellent",
      category: "Datos estructurados",
      description: "El marcado JSON-LD detectado omite propiedades.",
      details: ["Organization missing sameAs"],
      impactScore: null,
      codeSnippet: "{ }",
      codeLanguage: "json",
      recommendation: "Corrija el marcado JSON-LD.",
    };
    const platform: PlatformRow = {
      id: "claude",
      name: "Claude",
      bot: "Claude-Web",
      readiness: null,
      access: "unknown",
    };

    expect(cat.maxScore).toBe(100);
    expect(finding.impactScore).toBeNull();
    expect(platform.readiness).toBeNull();
    // All three satisfy their interfaces at compile time (no type errors above).
    expect([cat, finding, platform]).toHaveLength(3);
  });
});
