import type { AuditResult, SeverityBand } from "@/lib/contracts/audit-result";
import { severityForScore } from "@/scoring/calculator";

export type DomainScorecardProps = {
  /** Full audit result — the scorecard derives per-domain scores + degradation. */
  result: AuditResult;
};

/**
 * The five report rows. `engine` is the meta.errors prefix used by RAO-12/RAO-13
 * ("citability: boom", "schema: unsupported_content_type", ...); the label is
 * the Spanish UI copy.
 */
const ROWS = [
  { engine: "crawler", label: "Acceso de bots" },
  { engine: "citability", label: "Citabilidad" },
  { engine: "content", label: "E-E-A-T" },
  { engine: "schema", label: "Datos estructurados" },
  { engine: "platform", label: "Plataforma" },
] as const;

/** Band → mini-bar fill color (shared P3 thresholds via severityForScore). */
const BAND_BAR: Record<SeverityBand, string> = {
  Excellent: "bg-green-500",
  Good: "bg-emerald-500",
  Fair: "bg-amber-500",
  Poor: "bg-orange-500",
  Critical: "bg-red-500",
};

/**
 * RAO-12/RAO-13 degraded detection: `meta.errors` entries use the engine key
 * prefix ("citability: <reason>"). The contract has no per-engine status
 * field, so the errors array is the honest signal.
 */
function isEngineDegraded(errors: string[], engine: string): boolean {
  return errors.some((error) => error.startsWith(`${engine}:`));
}

/**
 * Schema presence proxy: the shared SchemaResult contract intentionally drops
 * the engine rubric score, so the row derives a presentation score — 0 when no
 * structured data was detected, otherwise 100 minus 10 per validation issue
 * (floor 0). The per-issue detail lives in TopFindings.
 */
function deriveSchemaScore(schema: AuditResult["schema"]): number {
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
 * Platform row score: the `aio` platform score is the value wired into the GEO
 * Score technical dimension, so it leads; when absent, fall back to the first
 * per-platform entry carrying a numeric score.
 */
function derivePlatformScore(perPlatform: Record<string, unknown>): number {
  const preferred = readScore(perPlatform["aio"]);
  if (preferred !== null) return preferred;
  for (const value of Object.values(perPlatform)) {
    const score = readScore(value);
    if (score !== null) return score;
  }
  return 0;
}

function rowScore(result: AuditResult, engine: string): number {
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

function UnavailableChip() {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-text-secondary">
      No disponible
    </span>
  );
}

/**
 * DomainScorecard (ARU-7/ARU-8): five domain rows, each with its score and a
 * band-colored mini-bar sized to the score. A degraded engine (RAO-12/RAO-13)
 * renders an honest "No disponible" chip instead of a fake score.
 */
export function DomainScorecard({ result }: DomainScorecardProps) {
  const { errors } = result.meta;
  return (
    <section aria-label="Puntajes por dominio" className="w-full">
      <h2 className="font-display text-2xl tracking-tight text-navy">
        Puntajes por dominio
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {ROWS.map(({ engine, label }) => {
          const degraded = isEngineDegraded(errors, engine);
          const score = rowScore(result, engine);
          const band = severityForScore(score);
          return (
            <li
              key={engine}
              className="rounded-md border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-text-primary">
                  {label}
                </span>
                {degraded ? (
                  <UnavailableChip />
                ) : (
                  <span className="font-display text-xl text-navy">
                    {score}
                  </span>
                )}
              </div>
              {degraded ? null : (
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    data-testid="row-bar"
                    className={`h-2 rounded-full ${BAND_BAR[band]}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
