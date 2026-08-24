import { severityForScore } from "@/scoring/index";
import type { SeverityBand } from "@/lib/contracts/audit-result";

/**
 * Band → fill color. Tinted 500-level fills derived from the shared P3
 * `SeverityBand` contract (STYLE-BRIEF §2). The band itself comes from
 * `severityForScore(score)` — the single source of truth, NOT a duplicated
 * threshold map.
 */
const BAND_FILL: Record<SeverityBand, string> = {
  Excellent: "bg-emerald",
  Good: "bg-emerald",
  Fair: "bg-amber",
  Poor: "bg-amber",
  Critical: "bg-red",
};

type ScoreBarProps = {
  /** Numeric 0-100 score. Clamped to the 0-100 range for the fill width. */
  score: number;
  /** Optional row label rendered above the bar. */
  label?: string;
  /** Additional classes for the outer container. */
  className?: string;
};

/**
 * ScoreBar primitive (DNF-9): a reusable 0-100 band-colored bar. The fill
 * width equals the score and the fill color maps to the severity band derived
 * from the shared `severityForScore` contract. Pure presentation — no data.
 */
export function ScoreBar({ score, label, className = "" }: ScoreBarProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const band = severityForScore(clamped);
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-text-primary">{label}</span>
          <span className="text-sm font-mono text-text-secondary">
            {clamped}
            <span className="text-xs text-text-secondary">/100</span>
          </span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-border"
      >
        <div
          data-score-fill
          className={`h-full ${BAND_FILL[band]} rounded-full transition-all motion-reduce:transition-none`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
