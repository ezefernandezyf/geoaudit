import { describe, expect, it } from "vitest";
import { runAudit } from "@/audit";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import type { AuditResult } from "@/lib/contracts/audit-result";
import { toGeminiViewModel } from "@/report/presenters/toGeminiViewModel";
import type { GeminiBand } from "@/report/presenters/types";

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
 */

/** Real candidate URLs the engine will audit (linear.app + 3 reales). */
export const CANDIDATE_URLS = [
  "https://linear.app",
  "https://stripe.com",
  "https://vercel.com",
  "https://notion.so",
] as const;

/** One verified entry: the URL, its real score and band, and the honest summary. */
export type VerifyEntry = {
  url: string;
  score: number;
  band: GeminiBand;
  summary: string;
};

/** Maps a real audit result to the printed entry (band from REAL thresholds). */
export function toVerifyEntry(url: string, result: AuditResult): VerifyEntry {
  const view = toGeminiViewModel(result);
  return {
    url,
    score: view.totalScore,
    band: view.band,
    summary: view.summary,
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
    } catch (error) {
      console.error(
        `✗ ${url}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return entries;
}

describe("lógica de verificación (sin red, runner mockeado)", () => {
  it("resume un AuditResult real en score + band honesta (umbrales 90/75/60/40)", () => {
    const entry = toVerifyEntry("https://example.com/", auditResultFixture);
    // auditResultFixture: GEO Score 68 → band "fair" (60-74), nunca inventada.
    expect(entry.score).toBe(68);
    expect(entry.band).toBe("fair");
    expect(entry.summary).toContain("GEO Score 68 (fair)");
  });

  it("elige la mejor URL real por score; empate conserva la primera auditada", () => {
    const entries: VerifyEntry[] = [
      {
        url: "https://a.example",
        score: 68,
        band: "fair",
        summary: "a — GEO Score 68 (fair)",
      },
      {
        url: "https://b.example",
        score: 91,
        band: "excellent",
        summary: "b — GEO Score 91 (excellent)",
      },
      {
        url: "https://c.example",
        score: 82,
        band: "good",
        summary: "c — GEO Score 82 (good)",
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
});

describe("red real (MANUAL — corre solo con pnpm verify:scorehero)", () => {
  it("audita las URLs candidatas e imprime score + band por URL", async () => {
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
