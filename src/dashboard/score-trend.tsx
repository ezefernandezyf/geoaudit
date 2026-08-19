import type { DashboardAudit } from "@/dashboard/types";
import type { SeverityBand } from "@/lib/contracts/audit-result";

/** Plot at most the 10 most recent audits (design U4: 5-10 bars). */
const MAX_BARS = 10;

/** Bar fill per band, mirroring the SeverityBadge palette at 500-level. */
const BAR_CLASSES: Record<SeverityBand, string> = {
  Excellent: "bg-green-500",
  Good: "bg-emerald-500",
  Fair: "bg-amber-500",
  Poor: "bg-orange-500",
  Critical: "bg-red-500",
};

const SHORT_DATE = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
});

type ScoreTrendProps = {
  /**
   * Audits newest→oldest (RSC-owned ordering). Only the most recent
   * `MAX_BARS` are plotted.
   */
  audits: DashboardAudit[];
};

/**
 * Score trend (DSH-2, design U4): pure CSS bars, no chart library. Each bar is
 * a div whose height is the audit's GEO score in %, filled by severity band,
 * with the score above and a day/month label below. The bar itself carries the
 * accessible name so screen readers get "GEO Score 87" per column.
 */
export function ScoreTrend({ audits }: ScoreTrendProps) {
  const bars = audits.slice(0, MAX_BARS);

  return (
    <div className="flex items-end gap-3" aria-label="Tendencia de GEO Score">
      {bars.map((audit) => (
        <div key={audit.id} className="flex w-8 flex-col items-center gap-1.5">
          <span className="font-mono text-[11px] leading-none text-text-secondary">
            {audit.geoScore}
          </span>
          <div className="flex h-32 w-full items-end">
            <div
              role="img"
              aria-label={`GEO Score ${audit.geoScore}`}
              className={`w-full rounded-t ${BAR_CLASSES[audit.severityBand]}`}
              style={{ height: `${audit.geoScore}%` }}
            />
          </div>
          <span className="text-[10px] leading-none text-slate-400">
            {SHORT_DATE.format(audit.createdAt)}
          </span>
        </div>
      ))}
    </div>
  );
}
