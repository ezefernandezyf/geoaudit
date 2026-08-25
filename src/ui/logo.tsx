/**
 * GeoAudit logo (DNF-12, U1.8, A7 sprint 8): SVG inline mark — serif "G" in a
 * navy tile with the emerald glyph — plus the "GeoAudit" wordmark. Two
 * variants: full (navbar/login/footer) and mark-only (favicon / compact
 * spots). The fine wave and globe details were removed (A7) so the mark stays
 * legible at favicon sizes (16x16/32x32).
 */
export function Logo({
  size = 32,
  showWordmark = true,
  className = "",
}: {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="GeoAudit"
      >
        {/* Navy tile */}
        <rect width="40" height="40" rx="10" fill="#0f172a" />
        {/* Serif G in brand emerald */}
        <text
          x="20"
          y="26"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="20"
          fontWeight="700"
          fill="#10b981"
        >
          G
        </text>
      </svg>
      {showWordmark ? (
        <span className="flex flex-col leading-none">
          <span className="font-serif italic tracking-tighter text-xl text-[#0f172a]">
            GeoAudit
          </span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">
            AI Visibility Audit
          </span>
        </span>
      ) : null}
    </span>
  );
}
