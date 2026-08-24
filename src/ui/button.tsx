import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "emerald" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Visual hierarchy: primary (navy), secondary (bordered), ghost (plain), emerald, danger. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Pending state: disables the button, sets aria-busy and swaps in a spinner. */
  loading?: boolean;
  /** Optional icon rendered before the label (DNF-7, DNF-10). Hidden while loading. */
  leftIcon?: ReactNode;
  /** Optional icon rendered after the label (DNF-7, DNF-10). Hidden while loading. */
  rightIcon?: ReactNode;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-navy text-white hover:bg-slate-800 active:bg-slate-900",
  secondary:
    "bg-surface text-text-primary border border-border-strong hover:bg-surface-muted",
  ghost: "bg-transparent text-text-primary hover:bg-surface-muted",
  emerald: "bg-emerald text-white hover:bg-emerald-600 active:bg-emerald-700",
  danger: "bg-red text-white hover:bg-red-600 active:bg-red-700",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium " +
  "transition-colors focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-emerald-500 focus-visible:ring-offset-2 " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

/**
 * Button primitive (STYLE-BRIEF §7, spec DNF-7). The loading state prevents
 * double-submit: the button is disabled, announces `aria-busy="true"` and
 * swaps the label for "Analizando…" plus a CSS spinner. Optional icon slots
 * (DNF-10, lucide-react) render beside the label and hide while loading.
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={loading || rest.disabled}
      aria-busy={loading || undefined}
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
          />
          Analizando…
        </>
      ) : (
        <>
          {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
          {children}
          {rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
        </>
      )}
    </button>
  );
}
