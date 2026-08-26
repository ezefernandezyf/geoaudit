import type { GeminiBand } from "@/ui/severity-badge";

/**
 * ScoreBar category — the adapter (U5) builds these from real AuditResult
 * data. `status` is the lowercase Gemini band; the fill color derives from it
 * (real thresholds 90/75/60/40 via severityForScore) instead of Gemini's
 * numeric getBarColor (80/65/45/25). `name`/weight/keyMetric/description are
 * optional so interim consumers never invent data the report doesn't provide.
 */
export type ScoreCategory = {
  id: string;
  /** Row label shown above the bar (omitted when the row already shows it). */
  name?: string;
  score: number;
  maxScore: number;
  weight?: string;
  keyMetric?: string;
  status: GeminiBand;
  description?: string;
};

type ScoreBarProps = {
  category: ScoreCategory;
  onClick?: () => void;
  isInteractive?: boolean;
};

/** Fill color per real Gemini band (excellent/good → emerald, fair/poor → amber, critical → red). */
const STATUS_FILL: Record<GeminiBand, string> = {
  excellent: "bg-[#10b981]",
  good: "bg-[#10b981]/80",
  fair: "bg-[#f59e0b]",
  poor: "bg-[#f59e0b]/90",
  critical: "bg-[#ef4444]",
};

/**
 * ScoreBar (U1.6, DNF-9): Gemini ScoreBar verbatim composition (hex directos)
 * with ONE change per design decision: the fill color derives from
 * `category.status` (the real band), never from the numeric 80/65/45/25 map.
 * Keeps the `data-score-fill` test hook so existing report tests stay green.
 * Note: unlike Gemini, the band badge is NOT embedded — composition-level
 * consumers (ScoreHero, multi-page rows) already render it, avoiding
 * duplicated band text in pages with several bars.
 */
export function ScoreBar({
  category,
  onClick,
  isInteractive = false,
}: ScoreBarProps) {
  const percentage = Math.min(
    100,
    Math.max(0, (category.score / category.maxScore) * 100),
  );

  return (
    <div
      onClick={isInteractive ? onClick : undefined}
      className={`p-4 bg-white rounded-lg border border-[#e2e8f0] transition-colors ${
        isInteractive ? "hover:border-[#cbd5e1] cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
        <div className="flex items-center gap-2">
          {category.name ? (
            <h3 className="text-sm font-semibold text-[#0f172a] font-sans">
              {category.name}
            </h3>
          ) : null}
          {category.weight ? (
            <span className="text-xs text-[#64748b] font-mono">
              (Peso: {category.weight})
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {category.keyMetric ? (
            <span className="text-xs font-mono text-[#64748b] bg-[#f8fafc] px-2 py-0.5 rounded border border-[#e2e8f0]">
              {category.keyMetric}
            </span>
          ) : null}
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-base font-bold text-[#0f172a]">
              {category.score}
            </span>
            {/* PERF-3: #64748b (4.76:1) cumple AA 4.5:1 — #94a3b8 (2.56:1) fallaba. */}
            <span className="text-xs text-[#64748b]">/100</span>
          </div>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden mb-2">
        <div
          data-score-fill
          className={`h-full ${STATUS_FILL[category.status]} transition-all duration-500 rounded-full`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-label={`Score ${category.score}/${category.maxScore}`}
          aria-valuenow={category.score}
          aria-valuemin={0}
          aria-valuemax={category.maxScore}
        />
      </div>

      {category.description ? (
        <p className="text-xs text-[#475569] font-sans leading-relaxed">
          {category.description}
        </p>
      ) : null}
    </div>
  );
}
