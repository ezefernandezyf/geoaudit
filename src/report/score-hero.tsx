import type { AuditResult, SeverityBand } from "@/lib/contracts/audit-result";
import { formatDurationMs } from "@/report/format";
import { SeverityBadge } from "@/ui/severity-badge";

export type ScoreHeroProps = {
  /** Audit summary: normalized URL, GEO Score, severity band, duration. */
  summary: AuditResult["summary"];
};

/** Band → text color for the big score number (mirrors SeverityBadge families). */
const SCORE_COLOR: Record<SeverityBand, string> = {
  Excellent: "text-green-600",
  Good: "text-emerald-600",
  Fair: "text-amber-600",
  Poor: "text-orange-600",
  Critical: "text-red-600",
};

/**
 * ScoreHero (ARU-8): the GEO Score headline — big number colored by its
 * severity band, the band chip (SeverityBadge), the normalized audited URL
 * and the audit duration. Pure presentation: summary in, markup out.
 */
export function ScoreHero({ summary }: ScoreHeroProps) {
  const { geoScore, severityBand, url, durationMs } = summary;
  return (
    <section
      aria-label="Puntaje GEO"
      className="flex flex-col items-start gap-6 rounded-md border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          GEO Score
        </p>
        <p
          className={`font-display text-6xl leading-none tracking-tight ${SCORE_COLOR[severityBand]}`}
        >
          {geoScore}
        </p>
        <SeverityBadge band={severityBand} />
      </div>
      <dl className="flex flex-col gap-1 text-sm">
        <div>
          <dt className="sr-only">URL analizada</dt>
          <dd className="break-all text-text-primary">{url}</dd>
        </div>
        <div>
          <dt className="sr-only">Duración del análisis</dt>
          <dd className="text-text-secondary">
            Duración: {formatDurationMs(durationMs)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
