import { REPORT_COPY } from "@/lib/copy";
import type { GeminiView } from "@/report/presenters/types";
import { SeverityBadge } from "@/ui/severity-badge";

/**
 * Pure presenter of the Gemini view model (U5.5, ARU-11, design U5).
 *
 * Gemini ScoreHero composition VERBATIM (hex directos, radios, sombras) with
 * ONE data-binding change: it consumes the `GeminiView` produced by
 * `toGeminiViewModel` (never `AuditResult`), and the right-side benchmark uses
 * the REAL severity thresholds (90/75/60/40, `severityForScore`) instead of
 * Gemini's 80/65/45/25 (design D1).
 *
 * The benchmark is a "benchmark bar": the five real bands rendered as a
 * segmented scale with a marker positioned at the score, plus the readable
 * threshold rows.
 */
export type ScoreHeroView = Pick<
  GeminiView,
  | "totalScore"
  | "band"
  | "domain"
  | "title"
  | "summary"
  | "durationSeconds"
  | "auditDate"
>;

export type ScoreHeroProps = {
  /** View-model slice — the hero only reads the headline metrics. */
  view: ScoreHeroView;
};

/** Real threshold rows (severityForScore: 90/75/60/40). Text hexes are the
 * darkest-nearest that pass WCAG 2.2 AA (4.5:1) on white (A11Y-3/C14):
 * emerald-700 #047857, amber-700 #b45309, red-600 #dc2626. */
const BENCHMARK_ROWS = [
  { range: "90 - 100", label: "Excelente (Top 10%)", color: "text-[#047857]" },
  { range: "75 - 89", label: "Bueno (Promedio B2B)", color: "text-[#047857]" },
  {
    range: "60 - 74",
    label: "Regular (Riesgo omisión)",
    color: "text-[#b45309]",
  },
  {
    range: "40 - 59",
    label: "Deficiente (Riesgo crítico)",
    color: "text-[#dc2626]",
  },
  { range: "< 40", label: "Crítico", color: "text-[#dc2626]" },
] as const;

/** Benchmark bar segments (left→right), real band widths on the 0-100 scale. */
const BENCHMARK_SEGMENTS = [
  { width: "10%", className: "bg-[#10b981]" }, // 90-100 excellent
  { width: "15%", className: "bg-[#10b981]/80" }, // 75-89 good
  { width: "15%", className: "bg-[#f59e0b]" }, // 60-74 fair
  { width: "20%", className: "bg-[#f59e0b]/90" }, // 40-59 poor
  { width: "40%", className: "bg-[#ef4444]" }, // 0-39 critical
] as const;

/**
 * ScoreHero (ARU-11): the complete Gemini hero — big serif GEO Score in a
 * slate panel, the band chip, the domain + duration + date row, the serif
 * title and summary — plus the benchmark bar that positions the score against
 * the REAL thresholds (68 → Fair 60-74, NOT Gemini's bands). Pure SSR.
 */
export function ScoreHero({ view }: ScoreHeroProps) {
  const {
    totalScore,
    band,
    domain,
    title,
    summary,
    durationSeconds,
    auditDate,
  } = view;
  const markerLeft = `${Math.min(100, Math.max(0, totalScore))}%`;

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-[#e2e8f0] bg-white p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        {/* Left Side: Score & Context */}
        <div className="flex items-start gap-6 sm:items-center">
          <div className="flex min-w-[130px] flex-col justify-center rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-5 sm:min-w-[160px]">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#475569]">
              {REPORT_COPY.hero.scoreLabel}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-6xl leading-tight text-[#0f172a] sm:text-7xl">
                {totalScore}
              </span>
              <span className="font-mono text-xl font-bold text-[#047857]">
                /100
              </span>
            </div>
            <div className="mt-3">
              <SeverityBadge band={band} size="sm" />
            </div>
          </div>

          <div className="flex max-w-xl flex-col justify-center space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-[#e2e8f0] bg-[#f1f5f9] px-2.5 py-1 font-mono text-xs font-semibold text-[#0f172a]">
                {domain}
              </span>
              <span className="text-xs text-[#475569]">
                {REPORT_COPY.hero.auditLabel}{" "}
                <strong className="font-mono font-medium text-[#0f172a]">
                  {durationSeconds}s
                </strong>
              </span>
              {auditDate ? (
                <span className="hidden font-mono text-xs text-[#94a3b8] sm:inline">
                  • {auditDate}
                </span>
              ) : null}
            </div>

            <h2 className="font-serif text-lg italic leading-snug text-[#0f172a] sm:text-xl">
              {title}
            </h2>

            <p className="text-xs leading-relaxed text-[#475569] font-sans">
              {summary}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Benchmark (REAL thresholds, ARU-11) */}
        <div className="flex min-w-[210px] shrink-0 flex-col justify-center gap-3 text-left md:border-l md:border-[#e2e8f0] md:pl-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
            {REPORT_COPY.hero.benchmarkTitle}
          </div>

          {/* Benchmark bar: real band scale + score marker */}
          <div className="relative">
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
              {BENCHMARK_SEGMENTS.map((segment, index) => (
                <span
                  key={index}
                  className={`h-full ${segment.className}`}
                  style={{ width: segment.width }}
                />
              ))}
            </div>
            <span
              aria-hidden="true"
              data-benchmark-marker
              className="absolute -top-[5px] h-3 w-[3px] rounded-full bg-[#0f172a]"
              style={{ left: markerLeft }}
            />
          </div>

          <div className="space-y-1.5 text-xs font-sans">
            {BENCHMARK_ROWS.map((row) => (
              <div
                key={row.range}
                className="flex items-center justify-between gap-4"
              >
                <span className="font-mono text-[#64748b]">{row.range}</span>
                <span className={`font-medium ${row.color}`}>{row.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
