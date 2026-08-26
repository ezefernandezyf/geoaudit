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
  decorative = false,
}: {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  /** aria-hidden the SVG mark: use inside a link that already carries its own
   *  accessible name (navbar brand, WU-4) so the mark's "GeoAudit" label does
   *  not leak into the link's visible text (label-content-name-mismatch). */
  decorative?: boolean;
}) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : "GeoAudit"}
        aria-hidden={decorative || undefined}
      >
        {/* Navy tile */}
        <rect width="40" height="40" rx="10" fill="#0f172a" />
        {/* Serif G in brand emerald — VECTOR PATH (not <text>): a <text> node
            leaks its glyph into the parent link's textContent even when
            aria-hidden, breaking axe label-content-name-mismatch on the
            navbar brand link (WU-4). The path carries no text at all. */}
        <g transform="translate(10 10) scale(0.8333)">
          <path
            d="M11,7A2,2 0 0,0 9,9V15A2,2 0 0,0 11,17H13A2,2 0 0,0 15,15V13H13V15H11V9H17V7H11Z"
            fill="#10b981"
          />
        </g>
      </svg>
      {showWordmark ? (
        <span className="flex flex-col leading-none">
          <span className="font-serif italic tracking-tighter text-xl text-[#0f172a]">
            GeoAudit
          </span>{" "}
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">
            AI Visibility Audit
          </span>
        </span>
      ) : null}
    </span>
  );
}
