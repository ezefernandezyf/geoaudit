import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  /** Screen-reader description of the pending content (default: "Cargando…"). */
  label?: string;
  /** Gemini shape variants. */
  variant?: "rectangular" | "circular" | "text";
  /** Optional explicit width (CSS value or number → px). */
  width?: string | number;
  /** Optional explicit height (CSS value or number → px). */
  height?: string | number;
  /** Extra sizing/shape utilities. */
  className?: string;
};

/**
 * Skeleton primitive (DNF-11 delta, U1.7): Gemini verbatim — slate-300 block
 * with the app's `animate-pulse-subtle` pulse (globals.css keyframes, disabled
 * under prefers-reduced-motion). Accessible via role="status" + aria-label.
 */
export function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  label = "Cargando…",
  style,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    rectangular: "rounded-lg",
    circular: "rounded-full",
    text: "rounded h-4 w-full",
  }[variant];

  return (
    <div
      role="status"
      aria-label={label}
      style={{
        width,
        height,
        ...style,
      }}
      className={`bg-[#e2e8f0] animate-pulse-subtle ${variantClasses} ${className}`}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Gemini AuditReportSkeleton verbatim: ScoreHero + scorecard + findings placeholders. */
export function AuditReportSkeleton() {
  return (
    <div
      className="w-full max-w-5xl mx-auto space-y-6"
      role="status"
      aria-label="Cargando auditoría GEO..."
    >
      {/* Score Hero Skeleton */}
      <div className="p-6 sm:p-8 bg-white rounded-xl border border-[#e2e8f0] flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="flex items-center gap-6 w-full md:w-2/3">
          <Skeleton className="w-28 h-28 shrink-0 rounded-lg" />
          <div className="space-y-3 w-full">
            <Skeleton className="w-1/3 h-4" />
            <Skeleton className="w-3/4 h-7" />
            <Skeleton className="w-full h-4" />
          </div>
        </div>
        <div className="w-full md:w-1/4 space-y-2">
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-full h-4" />
        </div>
      </div>

      {/* Domain Scorecard Skeleton */}
      <div className="p-6 bg-white rounded-xl border border-[#e2e8f0] space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="w-48 h-6" />
          <Skeleton className="w-24 h-4" />
        </div>
        <div className="space-y-3">
          <Skeleton className="w-full h-20" />
          <Skeleton className="w-full h-20" />
          <Skeleton className="w-full h-20" />
        </div>
      </div>

      {/* Findings Skeleton */}
      <div className="p-6 bg-white rounded-xl border border-[#e2e8f0] space-y-4">
        <Skeleton className="w-40 h-6" />
        <div className="space-y-3">
          <Skeleton className="w-full h-24" />
          <Skeleton className="w-full h-24" />
        </div>
      </div>
    </div>
  );
}
