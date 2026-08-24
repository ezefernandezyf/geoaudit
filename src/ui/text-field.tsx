import type { InputHTMLAttributes, ReactNode } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Input id — also used to wire the label and the error description. */
  id: string;
  label: string;
  /** Validation message shown in the reserved error slot (role="alert"). */
  error?: string | null;
  /** Optional helper text shown in the reserved slot when there is no error. */
  helperText?: string;
  /** Optional icon rendered inside the left of the input (DNF-10). */
  leftIcon?: ReactNode;
  /** Optional element rendered inside the right of the input. */
  rightElement?: ReactNode;
};

const INPUT_CLASSES =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm " +
  "text-text-primary placeholder:text-text-secondary focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-emerald-500 " +
  "aria-[invalid=true]:border-red aria-[invalid=true]:focus-visible:ring-red";

/**
 * TextField primitive (STYLE-BRIEF §7, spec DNF-8): label above input, error
 * below. The error slot always reserves space (min-h) so validation messages
 * never cause layout shift; when present, the message is announced via
 * `role="alert"` and the input is marked `aria-invalid`. `helperText`,
 * `leftIcon` and `rightElement` are additive (U1.7, DNF-8).
 */
export function TextField({
  id,
  label,
  error,
  helperText,
  leftIcon,
  rightElement,
  type = "url",
  className = "",
  ...rest
}: TextFieldProps) {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const describedBy = error ? errorId : helperText ? helperId : undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <div className="relative flex items-center">
        {leftIcon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 text-text-secondary"
          >
            {leftIcon}
          </span>
        ) : null}
        <input
          id={id}
          type={type}
          className={`${INPUT_CLASSES} ${leftIcon ? "pl-9" : ""} ${rightElement ? "pr-10" : ""} ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {rightElement ? (
          <span className="absolute right-2 flex items-center">
            {rightElement}
          </span>
        ) : null}
      </div>
      <div data-error-slot className="min-h-5">
        {error ? (
          <p id={errorId} role="alert" className="text-sm text-red">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-sm text-text-secondary">
            {helperText}
          </p>
        ) : null}
      </div>
    </div>
  );
}
