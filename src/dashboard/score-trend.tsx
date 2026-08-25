import type { DashboardAudit } from "@/dashboard/types";
import { DASHBOARD_COPY } from "@/lib/copy";

/**
 * Trend window: exactly 12 bars, one per month (Gemini DSH-9). The window is
 * the 12 months ending in the most recent audit.
 */
const BARS = 12;

/** Gemini aggregate-badge style header copy (DSH-9). */
const { trend } = DASHBOARD_COPY;

// Month labels MUST match the UTC bucket keys (a TZ-negative host would shift
// 2026-08-01T00:00Z to July locally and mislabel the bars).
const MONTH_LABEL = new Intl.DateTimeFormat("en", {
  month: "short",
  timeZone: "UTC",
});

type ScoreTrendProps = {
  /**
   * Audits newest→oldest (RSC-owned ordering). Grouped into one bar per month
   * over the 12-month window ending at the latest audit; a month with no audit
   * renders a muted (empty) bar.
   */
  audits: DashboardAudit[];
};

/**
 * Visibility trend (DSH-2/DSH-9, design U4): exactly 12 pure-CSS bars, one per
 * month of the trailing year, no chart library. Each bar's height is the
 * average GEO score (%) of the audits in that month; months without an audit
 * render a short muted bar. The most recent month is emphasized (emerald)
 * mirroring Gemini's "Presente" bar. Every bar carries an accessible name.
 */
export function ScoreTrend({ audits }: ScoreTrendProps) {
  if (audits.length === 0) return null;

  const latest = audits[0].createdAt;
  // Index 0 = oldest month of the window … 11 = the most recent month.
  const months = Array.from({ length: BARS }, (_, index) => {
    const monthStart = new Date(
      Date.UTC(
        latest.getUTCFullYear(),
        latest.getUTCMonth() - (BARS - 1 - index),
        1,
      ),
    );
    return monthStart;
  });

  // Group audits by (year, month) key.
  const byMonth = new Map<string, DashboardAudit[]>();
  for (const audit of audits) {
    const key = `${audit.createdAt.getUTCFullYear()}-${audit.createdAt.getUTCMonth()}`;
    const bucket = byMonth.get(key);
    if (bucket) bucket.push(audit);
    else byMonth.set(key, [audit]);
  }

  const monthKey = (d: Date) => `${d.getUTCFullYear()}-${d.getUTCMonth()}`;

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-xs sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg italic text-[#0f172a]">
            {trend.title}
          </h2>
          <p className="text-xs text-[#475569]">{trend.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-xs bg-[#10b981]" />
          <span className="font-mono text-[10px] font-bold uppercase text-[#475569]">
            {trend.aiOverviews}
          </span>
        </div>
      </div>

      {/* 12 pure-CSS bars, no chart library. */}
      <div
        className="mt-4 flex h-32 items-end justify-between gap-1.5 px-2 sm:gap-2"
        role="img"
        aria-label="Tendencia de visibilidad: 12 meses"
      >
        {months.map((month, index) => {
          const bucket = byMonth.get(monthKey(month));
          const isLatest = index === BARS - 1;
          if (!bucket || bucket.length === 0) {
            return (
              <div
                key={monthKey(month)}
                title={`${MONTH_LABEL.format(month)}: sin datos`}
                role="img"
                className="w-full rounded-t-sm bg-[#f1f5f9] transition-colors hover:bg-[#cbd5e1]"
                style={{ height: "8%" }}
                aria-label={`${MONTH_LABEL.format(month)}: sin auditorías`}
              />
            );
          }
          const avg = Math.round(
            bucket.reduce((sum, a) => sum + a.geoScore, 0) / bucket.length,
          );
          return (
            <div
              key={monthKey(month)}
              title={`${MONTH_LABEL.format(month)}: ${avg} pts`}
              role="img"
              className={`w-full rounded-t-sm transition-colors ${
                isLatest
                  ? "bg-[#10b981] hover:bg-[#059669]"
                  : "bg-[#f1f5f9] hover:bg-[#cbd5e1]"
              }`}
              style={{ height: `${Math.max(avg, 6)}%` }}
              aria-label={`${MONTH_LABEL.format(month)}: ${avg} pts`}
            />
          );
        })}
      </div>

      <div className="mt-4 flex justify-between font-mono text-[10px] uppercase tracking-tighter text-[#94a3b8]">
        <span>{MONTH_LABEL.format(months[0])}</span>
        <span>{MONTH_LABEL.format(months[3])}</span>
        <span>{MONTH_LABEL.format(months[6])}</span>
        <span>{MONTH_LABEL.format(months[BARS - 1])}</span>
      </div>
    </div>
  );
}
