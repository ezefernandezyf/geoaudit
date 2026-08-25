import type { SeverityBand } from "@/lib/contracts/audit-result";
import { SeverityBadge, type GeminiBand } from "@/ui/severity-badge";
import { DASHBOARD_COPY } from "@/lib/copy";

type AggregateHeroProps = {
  /** Latest audit's GEO score (0-100), from the persisted rows. */
  latestScore: number;
  /** Latest audit's severity band, from the persisted rows. */
  latestBand: SeverityBand;
};

/**
 * Aggregate hero (DSH-8, design U4). Gemini verbatim: a bordered white card
 * holding the "Aggregate GEO Score" label, the serif score (emerald /100) and
 * the severity band badge. Values arrive as props from the persisted Audit
 * rows (the page reads `audits[0]`) — never a recomputation. Pure presentation.
 */
export function AggregateHero({ latestScore, latestBand }: AggregateHeroProps) {
  const band = latestBand.toLowerCase() as GeminiBand;

  return (
    <section
      aria-label="Resumen del GEO Score"
      className="flex flex-col justify-center rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-xs sm:p-8"
    >
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#475569]">
        {DASHBOARD_COPY.trend.aggregateLabel}
      </p>
      <div className="flex items-baseline gap-3">
        <span className="font-serif text-6xl leading-tight text-[#0f172a] sm:text-7xl">
          {latestScore}
        </span>
        <span className="font-mono text-xl font-bold text-[#047857]">/100</span>
      </div>
      <div className="mt-4">
        <SeverityBadge band={band} />
      </div>
      <p className="mt-4 text-xs leading-relaxed text-[#475569]">
        La visibilidad en redes de citación de LLMs supera el benchmark del
        sector B2B y SaaS.
      </p>
    </section>
  );
}
