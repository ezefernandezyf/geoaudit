import type { AuditResult } from "@/lib/contracts/audit-result";

/**
 * Pure domain-score derivation shared by the React `<DomainScorecard>` and the
 * PDF report template (U4). ONE source of truth for "what is the score of a
 * domain row" — the PDF must print the same numbers the web report shows.
 *
 * No React, no presentation: functions only, fully unit-testable.
 */

/** The five report rows. `engine` is the meta.errors prefix used by RAO-12/13. */
export const DOMAIN_ROWS = [
  { engine: "crawler", label: "Acceso de bots" },
  { engine: "citability", label: "Citabilidad" },
  { engine: "content", label: "E-E-A-T" },
  { engine: "schema", label: "Datos estructurados" },
  { engine: "platform", label: "Plataforma" },
] as const;

/** RAO-12/RAO-13 degraded detection: `meta.errors` entries use the engine key. */
export function isEngineDegraded(errors: string[], engine: string): boolean {
  return errors.some((error) => error.startsWith(`${engine}:`));
}

/**
 * Schema presence proxy: 0 when no structured data was detected, otherwise
 * 100 minus 10 per validation issue (floor 0). Mirrors the UI derivation.
 */
export function deriveSchemaScore(schema: AuditResult["schema"]): number {
  if (schema.detected.length === 0) return 0;
  return Math.max(0, 100 - schema.issues.length * 10);
}

/** Reads a numeric 0-100 `score` from a contract `unknown` entry. */
function readScore(value: unknown): number | null {
  if (value === null || typeof value !== "object") return null;
  const { score } = value as { score?: unknown };
  return typeof score === "number" && score >= 0 && score <= 100 ? score : null;
}

/**
 * Platform row score: the `aio` platform score leads (it feeds the GEO Score
 * technical dimension); fall back to the first per-platform entry with a
 * numeric score.
 */
export function derivePlatformScore(
  perPlatform: Record<string, unknown>,
): number {
  const preferred = readScore(perPlatform["aio"]);
  if (preferred !== null) return preferred;
  for (const value of Object.values(perPlatform)) {
    const score = readScore(value);
    if (score !== null) return score;
  }
  return 0;
}

/** Row score for a given engine key, mirroring the UI scorecard. */
export function rowScore(result: AuditResult, engine: string): number {
  switch (engine) {
    case "crawler":
      return result.crawlers.compositeScore;
    case "citability":
      return result.citability.pageScore;
    case "content":
      return result.content.composite;
    case "schema":
      return deriveSchemaScore(result.schema);
    case "platform":
      return derivePlatformScore(result.platform.perPlatform);
    default:
      return 0;
  }
}
