import type { HTMLAttributes, ReactNode } from "react";

type CardVariant = "default" | "muted" | "highlight";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Optional top section (title, meta row, actions). */
  header?: ReactNode;
  /** Optional bottom section (actions, links, meta). */
  footer?: ReactNode;
  /** Visual variant: default (surface), muted (surface-muted), highlight (emerald border). */
  variant?: CardVariant;
  /** Removes the default p-6 body padding (U1.4, DNF-6). */
  noPadding?: boolean;
};

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: "bg-surface border border-border",
  muted: "bg-surface-muted border border-border",
  highlight: "bg-surface border-2 border-emerald",
};

/**
 * Card primitive (STYLE-BRIEF §7, spec DNF-6): padded surface container with
 * border and rounded corners. Header/footer slots are optional — when absent
 * they are not rendered at all. `noPadding` and `variant` are additive.
 */
export function Card({
  header,
  footer,
  variant = "default",
  noPadding = false,
  children,
  className = "",
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-xl ${VARIANT_CLASSES[variant]} ${noPadding ? "" : "p-6"} ${className}`}
      {...rest}
    >
      {header ? (
        <div data-card-header className="mb-4 border-b border-border pb-4">
          {header}
        </div>
      ) : null}
      {children}
      {footer ? (
        <div data-card-footer className="mt-4 border-t border-border pt-4">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
