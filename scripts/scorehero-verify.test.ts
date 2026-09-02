import { describe, expect, it } from "vitest";
import { runAudit } from "@/audit";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import type { AuditResult } from "@/lib/contracts/audit-result";
import { toGeminiViewModel } from "@/report/presenters/toGeminiViewModel";
import type { GeminiBand } from "@/report/presenters/types";
import { SCOREHERO_EVIDENCE } from "@/app/score-hero-evidence";

/**
 * ScoreHero verification script (A3.1, LND-7, design sprint 8 §A6).
 *
 * Audits real candidate URLs with the REAL engine (`runAudit`) and prints the
 * GEO Score + band of each one. The best REAL result is then copied into
 * `src/app/score-hero-evidence.ts` (see its TODO) as the landing ScoreHero
 * evidence — the landing NEVER shows an invented number.
 *
 * MANUAL ONLY — real network. NOT part of the standard suite: this file lives
 * outside the vitest `include` (`src/**`) and runs through its own config:
 *
 *   pnpm verify:scorehero
 *
 * The "lógica (sin red)" describe below runs with a mocked runner on every
 * invocation (fast, no network); the "red real" describe is the one that hits
 * the candidate URLs and produces the evidence for `score-hero-evidence.ts`.
 * Re-evaluate the landing evidence with the same command whenever it seems
 * stale (design sprint 8 §A6).
 *
 * Sprint 9 WU-2 (port from `diag/scorehero-breakdown`): the script now prints
 * a PER-CATEGORY breakdown (crawler / citability / content / schema / platform
 * / brand) for every URL, so the calibration diagnostic (WU-2) can see which
 * dimension crushes the total before the weights/rubrics are rebalanced (WU-3).
 */

/**
 * Real candidate URLs the engine will audit.
 *
 * The first round (linear.app/stripe/vercel/notion) was all <50, blocked AI
 * crawlers. Round 2 targeted SEO/GEO-friendly sites (best: moz.com 48 — still
 * poor). Round 3 targets modern documentation sites: rich JSON-LD, structured
 * content, AI-crawler-friendly robots.txt — the profile the GEO engine
 * rewards. Homes score worst; docs pages are the best-in-class profile.
 *
 * The landing itself (relevy.app) is the dogfooding target
 * (A3.2): the live deploy still runs the PRE-fix build, so it audits low —
 * the breakdown below shows WHY (score-hero-evidence.ts TODO).
 */
export const CANDIDATE_URLS = [
  // Round 2 best (kept for reference)
  "https://moz.com",
  // Round 3 — modern docs / best-in-class GEO profile
  "https://llmstxt.org",
  "https://react.dev",
  "https://nextjs.org",
  "https://supabase.com",
  "https://tailwindcss.com",
  "https://developer.apple.com",
  "https://docs.anthropic.com",
  "https://openai.com",
  "https://aws.amazon.com",
  "https://smashingmagazine.com",
  "https://webflow.com",
  "https://notion.so",
  // Dogfooding target (A3.2) — pre-fix build, baseline of the recalibration
  "https://relevy.app",
] as const;

/** One verified entry: the URL, its real score and band, and the honest summary. */
export type VerifyEntry = {
  url: string;
  score: number;
  band: GeminiBand;
  summary: string;
  /** Per-category breakdown (id → score) to diagnose what drags the total.
   *  Score/band are nullable: a row the engine did not measure (legacy
   *  brandAuthority) is honestly null, "No medido" (APT-11). */
  categories: Array<{
    id: string;
    name: string;
    score: number | null;
    band: GeminiBand | null;
  }>;
};

/** Maps a real audit result to the printed entry (band from REAL thresholds). */
export function toVerifyEntry(url: string, result: AuditResult): VerifyEntry {
  const view = toGeminiViewModel(result);
  return {
    url,
    score: view.totalScore,
    band: view.band,
    summary: view.summary,
    // CategoryScore exposes `status` (the real band); alias it to `band` here.
    categories: view.categoryScores.map((c) => ({
      id: c.id,
      name: c.name,
      score: c.score,
      band: c.status,
    })),
  };
}

/** Best entry by score; on a tie keeps the first audited (stable order). */
export function pickBest(entries: VerifyEntry[]): VerifyEntry | null {
  return entries.reduce<VerifyEntry | null>(
    (best, entry) => (best === null || entry.score > best.score ? entry : best),
    null,
  );
}

/**
 * Audits every candidate sequentially; a failing URL is logged, not thrown —
 * the script reports the score of every URL that could be audited.
 */
export async function runVerify(
  urls: readonly string[],
  runner: (url: string) => Promise<AuditResult> = runAudit,
): Promise<VerifyEntry[]> {
  const entries: VerifyEntry[] = [];
  for (const url of urls) {
    try {
      const entry = toVerifyEntry(url, await runner(url));
      entries.push(entry);
      console.log(`✓ ${entry.summary}`);
      for (const c of entry.categories) {
        console.log(`    ${c.id}: ${c.score} (${c.band})`);
      }
    } catch (error) {
      console.error(
        `✗ ${url}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return entries;
}

describe("lógica de verificación (sin red, runner mockeado)", () => {
  it("resume un AuditResult real en score + band honesta (umbrales 80/65/50/30)", () => {
    const entry = toVerifyEntry("https://example.com/", auditResultFixture);
    // auditResultFixture: GEO Score 68 → band "good" (65-79), nunca inventada.
    expect(entry.score).toBe(68);
    expect(entry.band).toBe("good");
    expect(entry.summary).toContain("GEO Score 68 (good)");
  });

  it("desglosa el resultado real en 6 categorías con id, nombre, score y band", () => {
    const entry = toVerifyEntry("https://example.com/", auditResultFixture);
    expect(entry.categories).toHaveLength(6);
    expect(entry.categories.map((c) => c.id)).toEqual([
      "crawler",
      "citability",
      "content",
      "schema",
      "platform",
      "brand",
    ]);
    for (const c of entry.categories) {
      expect(c.name).not.toBe("");
      // Una fila no medida (brand en legacy 2.0.0) es null honesto (APT-11).
      if (c.score !== null) expect(typeof c.score).toBe("number");
      if (c.band !== null)
        expect(["excellent", "good", "fair", "poor", "critical"]).toContain(
          c.band,
        );
    }
  });

  it("elige la mejor URL real por score; empate conserva la primera auditada", () => {
    const entries: VerifyEntry[] = [
      {
        url: "https://a.example",
        score: 68,
        band: "good",
        summary: "a — GEO Score 68 (good)",
        categories: [],
      },
      {
        url: "https://b.example",
        score: 91,
        band: "excellent",
        summary: "b — GEO Score 91 (excellent)",
        categories: [],
      },
      {
        url: "https://c.example",
        score: 82,
        band: "good",
        summary: "c — GEO Score 82 (good)",
        categories: [],
      },
    ];
    expect(pickBest(entries)?.url).toBe("https://b.example");
    // Empate → primera en orden de auditoría (orden estable de runVerify).
    const tie: VerifyEntry[] = [
      entries[0],
      { ...entries[0], url: "https://d.example" },
    ];
    expect(pickBest(tie)?.url).toBe("https://a.example");
  });

  it("la evidencia fijada del ScoreHero tiene 6 filas con pesos v3.1 (T9)", () => {
    // T9 (sprint 13) + sprint 14: la evidencia regenerada debe reflejar las 6
    // dimensiones del engine v3.1 - brand incluido con su peso del 12 %
    // (RGS-1/APT-6, recalibración v3.1.0).
    expect(SCOREHERO_EVIDENCE.categoryScores).toHaveLength(6);
    const brand = SCOREHERO_EVIDENCE.categoryScores.find(
      (c) => c.id === "brand",
    );
    expect(brand?.name).toBe("Autoridad de marca");
    expect(brand?.weight).toBe("12%");
    // Los seis pesos v3.1 suman 100.
    const total = SCOREHERO_EVIDENCE.categoryScores.reduce(
      (sum, c) => sum + Number.parseFloat(c.weight.replace("%", "")),
      0,
    );
    expect(total).toBeCloseTo(100, 1);
  });
});

describe("red real (MANUAL — corre solo con pnpm verify:scorehero)", () => {
  it("audita las URLs candidatas e imprime score + band + desglose por URL", async () => {
    const entries = await runVerify(CANDIDATE_URLS);
    const best = pickBest(entries);
    console.log(
      `\nMejor URL real candidata para el ScoreHero de la landing: ${
        best?.summary ?? "ninguna (sin auditorías exitosas)"
      }`,
    );
    expect(entries.length).toBeGreaterThan(0);
  }, 300_000);
});
