import type { SeverityBand } from "@/lib/contracts/audit-result";

/**
 * Band → chip styling. Tinted 50-level backgrounds + 700-level text keep
 * every chip at WCAG AA contrast (STYLE-BRIEF §2). The bands themselves are
 * the shared `SeverityBand` contract from the GEO Score; only the Spanish
 * label and color are presentation concerns.
 */
const BAND_STYLES: Record<
  SeverityBand,
  { label: string; chipClassName: string }
> = {
  Excellent: {
    label: "Excelente",
    chipClassName: "bg-green-50 text-green-700",
  },
  Good: { label: "Bueno", chipClassName: "bg-emerald-50 text-emerald-700" },
  Fair: { label: "Regular", chipClassName: "bg-amber-50 text-amber-700" },
  Poor: { label: "Deficiente", chipClassName: "bg-orange-50 text-orange-700" },
  Critical: { label: "Crítico", chipClassName: "bg-red-50 text-red-700" },
};

type SeverityBadgeProps = {
  /** Severity band from the shared AuditResult contract. */
  band: SeverityBand;
};

/**
 * Severity chip (STYLE-BRIEF §7, spec DNF-5). Pure presentation: band in,
 * color-coded Spanish label out.
 */
export function SeverityBadge({ band }: SeverityBadgeProps) {
  const { label, chipClassName } = BAND_STYLES[band];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${chipClassName} border-transparent`}
    >
      {label}
    </span>
  );
}
