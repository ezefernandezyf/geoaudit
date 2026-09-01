"use client";

import { useActionState, useState, type FormEvent } from "react";
import { ArrowRight, Globe } from "lucide-react";
import { urlInputSchema } from "@/lib/contracts/url-input";
import { AUDIT_FORM_ERRORS } from "@/lib/audit/url-policy";
import { LANDING_COPY } from "@/lib/copy";
import type { AuditAction, AuditFormState } from "@/lib/audit/actions";
import { Button } from "@/ui/button";
import { TextField } from "@/ui/text-field";

const INITIAL_STATE: AuditFormState = { error: null };

/** Gemini landing sample URLs verbatim - pre-fill chips (LND-1). */
const SAMPLE_URLS = [
  { label: "linear.app", url: "https://linear.app" },
  { label: "acme-store.io", url: "https://acme-store.io" },
  { label: "devstack.io", url: "https://devstack.io" },
  { label: "legacyconsulting.com", url: "https://legacyconsulting.com" },
];

type AuditFormProps = {
  /** Server Action passed from a Server Component (never imported client-side). */
  action: AuditAction;
  /**
   * Initial value pre-filled into the URL input (ARU-5): lets the report
   * empty state keep the invalid param visible for user correction.
   */
  defaultValue?: string;
};

/**
 * Free audit landing form (ADF-1/2/6/7, LND-1, design U2). Gemini hero
 * composition: the submit button rides INSIDE the URL field (TextField
 * rightElement) and sample URL chips pre-fill the input (LND-1).
 *
 * Client-side Zod validation runs before submit for early feedback (ADF-2);
 * protocol and server errors come back inline through the action state and are
 * rendered by TextField's reserved slot with `role="alert"` (ADF-7). While the
 * action is in flight the form is `aria-busy` and the submit shows a spinner
 * + "Analizando…" (ADF-6).
 */
export function AuditForm({ action, defaultValue }: AuditFormProps) {
  const [serverState, formAction, isPending] = useActionState(
    action,
    INITIAL_STATE,
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const error = clientError ?? serverState.error;
  const { inputLabel, placeholder, submitLabel, formAriaLabel } =
    LANDING_COPY.auditForm;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const result = urlInputSchema.safeParse({ url });
    if (!result.success) {
      // Block the native form action so the action is never dispatched.
      event.preventDefault();
      setClientError(AUDIT_FORM_ERRORS.invalidUrl);
      return;
    }
    setClientError(null);
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      aria-label={formAriaLabel}
      aria-busy={isPending || undefined}
      noValidate
    >
      {/* Gemini hero pill: bordered white field with the button inside. */}
      <div className="rounded-xl border border-[#cbd5e1] bg-white p-2 shadow-sm">
        <TextField
          id="audit-url"
          name="url"
          type="url"
          label={inputLabel}
          hideLabelVisually
          placeholder={placeholder}
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            if (clientError) setClientError(null);
          }}
          error={error}
          disabled={isPending}
          leftIcon={<Globe className="h-5 w-5" aria-hidden="true" />}
          rightElement={
            <Button
              type="submit"
              size="sm"
              isLoading={isPending}
              rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              {submitLabel}
            </Button>
          }
          className="!border-transparent !bg-transparent hover:!border-transparent focus:!border-transparent focus:!ring-0 !pr-36"
        />
      </div>

      {/* Quick demo URLs (LND-1): chips pre-fill the input. */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-[#64748b]">
        <span className="font-medium">{LANDING_COPY.hero.sampleLabel}</span>
        {SAMPLE_URLS.map((sample) => (
          <button
            key={sample.label}
            type="button"
            onClick={() => {
              setUrl(sample.url);
              if (clientError) setClientError(null);
            }}
            className="cursor-pointer rounded border border-[#e2e8f0] bg-white px-2.5 py-1 font-mono text-[#0f172a] transition-colors hover:bg-[#f1f5f9]"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </form>
  );
}
