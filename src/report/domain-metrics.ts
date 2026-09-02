import type { AuditResult } from "@/lib/contracts/audit-result";

/**
 * Pure domain-score derivation shared by the React `<DomainScorecard>` and the
 * PDF report template (U4). ONE source of truth for "what is the score of a
 * domain row" - the PDF must print the same numbers the web report shows.
 *
 * No React, no presentation: functions only, fully unit-testable.
 */

/** The six report rows. `engine` is the meta.errors prefix used by RAO-12/13. */
export const DOMAIN_ROWS = [
  { engine: "crawler", label: "Acceso de bots" },
  { engine: "citability", label: "Citabilidad" },
  { engine: "content", label: "E-E-A-T" },
  { engine: "schema", label: "Datos estructurados" },
  { engine: "platform", label: "Plataforma" },
  { engine: "brand", label: "Autoridad de marca" },
] as const;

/** RAO-12/RAO-13 degraded detection: `meta.errors` entries use the engine key. */
export function isEngineDegraded(errors: string[], engine: string): boolean {
  return errors.some((error) => error.startsWith(`${engine}:`));
}

/**
 * Schema row score: the real engine rubric score (0-100, RSC-14). A defensive
 * `?? 0` guards legacy persisted rows that predate `schema.score` (read via
 * `as unknown as AuditResult` without Zod re-parse) so they never surface an
 * `undefined`; it never reconstructs the old `100 - issues*10` proxy (APT-6).
 */
export function deriveSchemaScore(schema: AuditResult["schema"]): number {
  return schema.score ?? 0;
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

/**
 * Brand row score (APT-11, design D6): the real engine score when measured,
 * `null` when absent (legacy 2.0.0 rows without `brandAuthority`, RAO-16) or
 * failed (`status !== "success"`, BRA-7/RAO-12). `null` renders "No medido" -
 * it must never fall through to the `rowScore` `return 0` default, which
 * would fabricate a measured value (APT-10/11). A MEASURED 0 is a real
 * penalty (RGS-11) and is returned as-is. The defensive shape check mirrors
 * the platform derivation: persisted rows are read as `unknown as AuditResult`
 * without Zod re-parse, so a malformed score also reads as "No medido".
 */
export function deriveBrandScore(
  brandAuthority: AuditResult["brandAuthority"],
): number | null {
  if (!brandAuthority || brandAuthority.status !== "success") return null;
  const { score } = brandAuthority;
  return typeof score === "number" && score >= 0 && score <= 100 ? score : null;
}

/** Row score for a given engine key; `null` = row not measured (APT-11). */
export function rowScore(result: AuditResult, engine: string): number | null {
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
    // APT-11: the brand case MUST sit before the default so an unmeasured
    // brand row returns null ("No medido"), never the default's fabricated 0.
    case "brand":
      return deriveBrandScore(result.brandAuthority);
    default:
      return 0;
  }
}
