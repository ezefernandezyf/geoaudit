import { useId, type InputHTMLAttributes, type ReactNode } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Visible label. Uppercase small-caps per Gemini (tracking-wider). */
  label: string;
  /** Validation message shown in the reserved error slot (role="alert"). */
  error?: string | null;
  /** Optional helper text shown in the reserved slot when there is no error. */
  helperText?: string;
  /** Optional icon rendered inside the left of the input (Gemini). */
  leftIcon?: ReactNode;
  /** Optional element rendered inside the right of the input (Gemini). */
  rightElement?: ReactNode;
  /** Visually hides the label (sr-only) while keeping it for a11y. */
  hideLabelVisually?: boolean;
};

/**
 * TextField primitive (U1.4, DNF-8 delta): Gemini verbatim - label uppercase
 * `tracking-wider` in slate-500, input with hex border/ring states, a reserved
 * error slot (`min-h-[18px]`) so validation never causes layout shift, and
 * `useId`-generated ids when the caller omits `id`. `data-error-slot` is a
 * non-visual test hook kept from the previous implementation.
 */
export function TextField({
  label,
  error,
  helperText,
  leftIcon,
  rightElement,
  hideLabelVisually = false,
  id,
  className = "",
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="flex w-full flex-col gap-1.5 text-left font-sans">
      <label
        htmlFor={inputId}
        className={`select-none text-xs font-semibold uppercase tracking-wider text-[#475569] ${hideLabelVisually ? "sr-only" : "block"}`}
      >
        {label}
      </label>

      <div className="relative flex w-full items-center">
        {leftIcon ? (
          <div className="pointer-events-none absolute left-3.5 flex items-center justify-center text-[#64748b]">
            {leftIcon}
          </div>
        ) : null}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full rounded-md border bg-white py-2.5 text-sm text-[#0f172a] transition-all duration-150 placeholder-[#94a3b8] ${
            leftIcon ? "pl-10" : "pl-3.5"
          } ${rightElement ? "pr-24" : "pr-3.5"} ${
            error
              ? "border-[#ef4444] focus:border-[#ef4444] focus:ring-2 focus:ring-[#ef4444]/20"
              : "border-[#cbd5e1] hover:border-[#94a3b8] focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/15"
          } ${className}`}
          {...props}
        />
        {rightElement ? (
          <div className="absolute right-2 flex items-center">
            {rightElement}
          </div>
        ) : null}
      </div>

      {/* Reserved Error/Helper slot */}
      <div data-error-slot className="min-h-[18px]">
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1 text-xs font-medium text-[#dc2626]"
          >
            <span aria-hidden="true">•</span> {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-[#64748b]">
            {helperText}
          </p>
        ) : null}
      </div>
    </div>
  );
}
