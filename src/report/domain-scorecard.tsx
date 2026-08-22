import type { AuditResult, SeverityBand } from "@/lib/contracts/audit-result";
import { severityForScore } from "@/scoring/calculator";
import {
  DOMAIN_ROWS,
  isEngineDegraded,
  rowScore,
} from "@/report/domain-metrics";

export type DomainScorecardProps = {
  /** Full audit result — the scorecard derives per-domain scores + degradation. */
  result: AuditResult;
};

/** Band → mini-bar fill color (shared P3 thresholds via severityForScore). */
const BAND_BAR: Record<SeverityBand, string> = {
  Excellent: "bg-green-500",
  Good: "bg-emerald-500",
  Fair: "bg-amber-500",
  Poor: "bg-orange-500",
  Critical: "bg-red-500",
};

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
 * renders an honest "No disponible" chip instead of a fake score. Row scores
 * and degradation come from the shared `domain-metrics` module (U4) so the
 * PDF template prints the same numbers.
 */
export function DomainScorecard({ result }: DomainScorecardProps) {
  const { errors } = result.meta;
  return (
    <section aria-label="Puntajes por dominio" className="w-full">
      <h2 className="font-display text-2xl tracking-tight text-navy">
        Puntajes por dominio
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {DOMAIN_ROWS.map(({ engine, label }) => {
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
