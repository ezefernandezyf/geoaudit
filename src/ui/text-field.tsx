import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Input id — also used to wire the label and the error description. */
  id: string;
  label: string;
  /** Validation message shown in the reserved error slot (role="alert"). */
  error?: string | null;
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
 * `role="alert"` and the input is marked `aria-invalid`.
 */
export function TextField({
  id,
  label,
  error,
  type = "url",
  className = "",
  ...rest
}: TextFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={`${INPUT_CLASSES} ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      <div data-error-slot className="min-h-5">
        {error ? (
          <p id={errorId} role="alert" className="text-sm text-red">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
