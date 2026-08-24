import type { HTMLAttributes } from "react";

type CardVariant = "default" | "muted" | "highlight";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Visual variant: default (white), muted (slate-50), highlight (emerald border). */
  variant?: CardVariant;
  /** Removes the default p-6 body padding (Gemini). */
  noPadding?: boolean;
};

/** Gemini Card variant styles verbatim (hex directos, no header/footer slots). */
const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: "bg-white border border-[#e2e8f0]",
  muted: "bg-[#f8fafc] border border-[#e2e8f0]",
  highlight: "bg-white border-2 border-[#10b981] shadow-sm",
};

/**
 * Card primitive (spec DNF-6 delta, U1.3): Gemini verbatim — padded surface
 * container with border, rounded corners and `transition-all`. Gemini has NO
 * header/footer slots (DNF-9), so callers place headings inside the children.
 */
export function Card({
  variant = "default",
  noPadding = false,
  children,
  className = "",
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-xl ${VARIANT_CLASSES[variant]} ${noPadding ? "" : "p-6"} transition-all ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
