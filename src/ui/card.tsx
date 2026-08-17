import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Optional top section (title, meta row, actions). */
  header?: ReactNode;
  /** Optional bottom section (actions, links, meta). */
  footer?: ReactNode;
};

/**
 * Card primitive (STYLE-BRIEF §7, spec DNF-6): padded surface container with
 * border and rounded corners. Header/footer slots are optional — when absent
 * they are not rendered at all.
 */
export function Card({
  header,
  footer,
  children,
  className = "",
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-6 ${className}`}
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
