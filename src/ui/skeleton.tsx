type SkeletonProps = {
  /** Screen-reader description of the pending content (default: "Cargando…"). */
  label?: string;
  /** Sizing/shape utilities, e.g. "h-4 w-full rounded-md". */
  className?: string;
};

/**
 * Pulse placeholder (STYLE-BRIEF §5, spec DNF-4) — the only required animation
 * in the app. Accessible via `role="status"` and motion-safe: the pulse is
 * disabled under `prefers-reduced-motion`.
 */
export function Skeleton({
  label = "Cargando…",
  className = "",
}: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`animate-pulse motion-reduce:animate-none rounded-md bg-border ${className}`}
    />
  );
}
