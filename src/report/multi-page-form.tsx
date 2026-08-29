"use client";

import { useActionState, useState, type FormEvent } from "react";
import { Globe, Layers, ArrowRight } from "lucide-react";
import { urlInputSchema } from "@/lib/contracts/url-input";
import { AUDIT_FORM_ERRORS } from "@/lib/audit/url-policy";
import { MULTIPAGE_COPY } from "@/lib/copy";
import type {
  MultiPageAction,
  MultiPageErrorCode,
  MultiPageFormState,
} from "@/lib/audit/multi-page-actions";
import { Button } from "@/ui/button";
import { TextField } from "@/ui/text-field";

const INITIAL_STATE: MultiPageFormState = { error: null };

/** MultiPageErrorCode → neutral Spanish copy (MPU-3, design U6). */
const ERROR_COPY: Record<MultiPageErrorCode, string> = MULTIPAGE_COPY.errors;

type MultiPageFormProps = {
  /** The real `multiPageAuditAction` Server Action, injected by the RSC page
   *  (MPU-1) so it is never imported from a client module. */
  action: MultiPageAction;
};

/**
 * Multi-page trigger form (U6.1, MPU-1/3, design U6). Gemini composition reusing
 * the TextField + Button primitives: a bordered field with the submit button
 * inside. Drives the REAL `multiPageAuditAction` through `useActionState`.
 *
 * MPU-1: submit invokes the injected action; on success the action redirects to
 * `/dashboard/audits/[id]`. MPU-3: each `MultiPageErrorCode` maps to neutral
 * Spanish copy (MULTIPAGE_COPY.errors) rendered with `role="alert"`.
 *
 * There is no tier gate (MPU-2 removed): the form renders for every
 * authenticated user; the limit check lives in the Server Action (TLM-3).
 */
export function MultiPageForm({ action }: MultiPageFormProps) {
  const [serverState, formAction, isPending] = useActionState(
    action,
    INITIAL_STATE,
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const serverError = serverState.error ? ERROR_COPY[serverState.error] : null;
  const error = clientError ?? serverError;
  const { inputLabel, placeholder, submitLabel, formAriaLabel } =
    MULTIPAGE_COPY.form;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const result = urlInputSchema.safeParse({ url });
    if (!result.success) {
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
      <div className="rounded-xl border border-[#cbd5e1] bg-white p-2 shadow-sm">
        <TextField
          id="multipage-url"
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
      <p className="mt-3 flex items-center gap-1.5 text-xs text-[#64748b]">
        <Layers className="h-3.5 w-3.5" aria-hidden="true" />
        {MULTIPAGE_COPY.header.description}
      </p>
    </form>
  );
}
