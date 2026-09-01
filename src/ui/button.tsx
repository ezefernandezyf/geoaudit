import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "emerald" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Visual hierarchy: primary (navy), secondary (bordered), ghost (plain), emerald, danger. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Pending state: disables the button, sets aria-busy and swaps in a Loader2 spinner (DNF-7). */
  isLoading?: boolean;
  /** Label shown while loading (default "Analizando…" - B11, parametrizable). */
  loadingLabel?: string;
  /** Optional icon rendered before the label (Gemini). Hidden while loading. */
  leftIcon?: ReactNode;
  /** Optional icon rendered after the label (Gemini). Hidden while loading. */
  rightIcon?: ReactNode;
};

/** Gemini Button base styles verbatim (index.css + Button.tsx). */
const BASE_CLASSES =
  "inline-flex items-center justify-center font-medium font-sans " +
  "transition-all duration-150 rounded-md focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-[#0f172a]/20 disabled:opacity-50 " +
  "disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] " +
  "select-none whitespace-nowrap";

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[#0f172a] text-white hover:bg-[#1e293b] active:bg-[#0f172a] shadow-xs",
  secondary:
    "bg-white text-[#0f172a] border border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1]",
  ghost: "text-[#0f172a] hover:bg-[#f1f5f9] active:bg-[#e2e8f0]",
  emerald:
    "bg-[#10b981] text-white hover:bg-[#059669] active:bg-[#047857] shadow-xs",
  danger: "bg-[#ef4444] text-white hover:bg-[#dc2626] active:bg-[#b91c1c]",
};

/**
 * Button primitive (spec DNF-7) - Gemini verbatim (hex classes, sizes,
 * variants, Loader2 spinner). While loading the button is disabled, announces
 * `aria-busy="true"` and swaps the label for `loadingLabel` (default
 * "Analizando…", the app's established pending copy, ADF-6; B11 makes it
 * parametrizable); icon slots hide so the spinner is the only indicator.
 */
export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingLabel = "Analizando…",
  leftIcon,
  rightIcon,
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  const busy = isLoading;
  return (
    <button
      type={type}
      disabled={busy || rest.disabled}
      aria-busy={busy || undefined}
      className={`${BASE_CLASSES} ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {busy ? (
        <>
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin text-current"
            aria-hidden="true"
          />
          {loadingLabel}
        </>
      ) : (
        <>
          {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
          <span>{children}</span>
          {rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
        </>
      )}
    </button>
  );
}
