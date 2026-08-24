/**
 * Lowercase Gemini severity band (Gemini types.ts verbatim). The shared
 * Capitalized `SeverityBand` contract stays untouched — the adapter (U5)
 * delivers lowercase view-model bands, so the badge only knows lowercase.
 */
export type GeminiBand = "excellent" | "good" | "fair" | "poor" | "critical";

/** Band → Spanish label (Gemini geoUtils SEVERITY_BANDS labels verbatim). */
const BAND_LABELS: Record<GeminiBand, string> = {
  excellent: "Excelente",
  good: "Bueno",
  fair: "Regular",
  poor: "Deficiente",
  critical: "Crítico",
};

/** Gemini SeverityBadge colorMap verbatim (hex directos). */
const COLOR_MAP: Record<
  GeminiBand,
  { bg: string; text: string; border: string; dot: string }
> = {
  excellent: {
    bg: "bg-[#10b981]/10",
    text: "text-[#10b981]",
    border: "border-[#10b981]/20",
    dot: "bg-[#10b981]",
  },
  good: {
    bg: "bg-[#10b981]/10",
    text: "text-[#10b981]",
    border: "border-[#10b981]/20",
    dot: "bg-[#10b981]",
  },
  fair: {
    bg: "bg-[#f59e0b]/10",
    text: "text-[#d97706]",
    border: "border-[#f59e0b]/20",
    dot: "bg-[#f59e0b]",
  },
  poor: {
    bg: "bg-[#ef4444]/10",
    text: "text-[#ef4444]",
    border: "border-[#ef4444]/20",
    dot: "bg-[#ef4444]",
  },
  critical: {
    bg: "bg-[#ef4444]/10",
    text: "text-[#dc2626]",
    border: "border-[#ef4444]/30",
    dot: "bg-[#dc2626]",
  },
};

const SIZE_STYLES: Record<"sm" | "md" | "lg", string> = {
  sm: "text-[11px] font-semibold px-2 py-0.5 gap-1.5",
  md: "text-xs font-semibold px-2.5 py-1 gap-1.5",
  lg: "text-sm font-semibold px-3 py-1.5 gap-2",
};

type SeverityBadgeProps = {
  /** Lowercase Gemini band (adapter output). */
  band: GeminiBand;
  /** Overrides the default Spanish label. */
  labelOverride?: string;
  size?: "sm" | "md" | "lg";
  /** Shows the colored dot (Gemini default). */
  showDot?: boolean;
  /** Optional numeric score rendered in mono before the label. */
  score?: number;
  className?: string;
};

/**
 * SeverityBadge (DNF-5 delta, U1.5): re-copied Gemini verbatim — sleek pill
 * with a tinted background, crisp border, optional dot + mono score, lowercase
 * band input. Capitalized→lowercase normalization does NOT live here: the
 * adapter (U5) delivers lowercase bands to this badge.
 */
export function SeverityBadge({
  band,
  labelOverride,
  size = "md",
  showDot = true,
  score,
  className = "",
}: SeverityBadgeProps) {
  const label = labelOverride ?? BAND_LABELS[band];
  const style = COLOR_MAP[band] ?? COLOR_MAP.fair;

  return (
    <span
      className={`inline-flex items-center rounded-full border ${style.bg} ${style.text} ${style.border} ${SIZE_STYLES[size]} select-none whitespace-nowrap tracking-normal font-sans ${className}`}
    >
      {showDot ? (
        <span
          className={`h-1.5 w-1.5 rounded-full ${style.dot} shrink-0`}
          aria-hidden="true"
        />
      ) : null}
      {typeof score === "number" ? (
        <span className="mr-0.5 font-mono font-bold">{score}</span>
      ) : null}
      <span>{label}</span>
    </span>
  );
}
