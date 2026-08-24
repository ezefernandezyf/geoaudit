import type { AuditResult } from "@/lib/contracts/audit-result";
import { ScoreBar, type ScoreCategory } from "@/ui/score-bar";
import { severityForScore } from "@/scoring/index";
import {
  DOMAIN_ROWS,
  isEngineDegraded,
  rowScore,
} from "@/report/domain-metrics";

export type DomainScorecardProps = {
  /** Full audit result — the scorecard derives per-domain scores + degradation. */
  result: AuditResult;
};

function UnavailableChip() {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-text-secondary">
      No disponible
    </span>
  );
}

/**
 * DomainScorecard (ARU-7/ARU-8): five domain rows rendered with the shared
 * `ScoreBar` primitive (U1). A degraded engine (RAO-12/RAO-13) renders an
 * honest "No disponible" chip instead of a fake score. Row scores and
 * degradation come from the shared `domain-metrics` module so the PDF template
 * prints the same numbers.
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
          // U1 bridge: the ScoreBar now takes a Gemini-style `category`; the
          // status band is derived from the REAL severityForScore thresholds
          // (90/75/60/40), lowercased for the view-model band. The adapter
          // (U5) will centralize this mapping.
          const category: ScoreCategory = {
            id: engine,
            name: label,
            score,
            maxScore: 100,
            status: severityForScore(
              score,
            ).toLowerCase() as ScoreCategory["status"],
          };
          return (
            <li
              key={engine}
              className="rounded-md border border-border bg-surface p-4"
            >
              {degraded ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-text-primary">
                    {label}
                  </span>
                  <UnavailableChip />
                </div>
              ) : (
                <ScoreBar category={category} />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
