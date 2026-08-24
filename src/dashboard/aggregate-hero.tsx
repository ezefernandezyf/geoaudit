import type { SeverityBand } from "@/lib/contracts/audit-result";
import { SeverityBadge, type GeminiBand } from "@/ui/severity-badge";

type AggregateHeroProps = {
  /** Latest audit's GEO score (0-100), from the persisted rows. */
  latestScore: number;
  /** Latest audit's severity band, from the persisted rows. */
  latestBand: SeverityBand;
};

/**
 * Aggregate hero (DSH-8, design U3): a summary card of the user's most recent
 * GEO Score and its band. Values arrive as props from the persisted Audit rows
 * (the page reads `audits[0]`) — never a recomputation. Pure presentation.
 */
export function AggregateHero({ latestScore, latestBand }: AggregateHeroProps) {
  return (
    <section
      aria-label="Resumen del GEO Score"
      className="flex flex-col items-start gap-4 rounded-xl border border-border bg-surface p-6"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
        GEO Score más reciente
      </p>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-6xl leading-none tracking-tight text-navy">
          {latestScore}
        </span>
        <span className="font-mono text-sm text-text-secondary">/100</span>
      </div>
      <SeverityBadge band={latestBand.toLowerCase() as GeminiBand} />
    </section>
  );
}
