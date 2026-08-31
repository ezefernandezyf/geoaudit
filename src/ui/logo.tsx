/**
 * Relevy logo (SHL-4, sprint 11 rebrand): user-generated mark from the brand
 * brief (docs/RELEVY-BRAND-BRIEF.md) — two stylized quote paths evoking
 * "being cited", navy + emerald accent, no tile. Wordmark "Relevy" in
 * Instrument Serif; the "AI Visibility Audit" tagline is dropped (brief §3:
 * no tagline). Full variant renders mark + wordmark; mark-only
 * (showWordmark=false) renders just the SVG (favicon / compact spots).
 * The API {size, showWordmark, className, decorative} is unchanged so the
 * navbar/footer/login call sites keep working.
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
   *  accessible name (navbar brand, WU-4) so the mark's "Relevy" label does
   *  not leak into the link's visible text (label-content-name-mismatch). */
  decorative?: boolean;
}) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : "Relevy"}
        aria-hidden={decorative || undefined}
      >
        {/* Quote 1 (navy → white in dark mode) */}
        <path
          d="M5 11h8v8c0 4.418-3.582 8-8 8v-4c2.209 0 4-1.791 4-4H5v-8z"
          className="fill-[#0f172a] dark:fill-white"
        />
        {/* Quote 2 (emerald accent) */}
        <path
          d="M19 5h8v8c0 4.418-3.582 8-8 8v-4c2.209 0 4-1.791 4-4h-4V5z"
          className="fill-[#10b981]"
        />
      </svg>
      {showWordmark ? (
        <span className="font-serif text-2xl leading-none text-[#0f172a] dark:text-white">
          Relevy
        </span>
      ) : null}
    </span>
  );
}
