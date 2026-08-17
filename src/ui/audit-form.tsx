"use client";

import { useActionState, useState, type FormEvent } from "react";
import { urlInputSchema } from "@/lib/contracts/url-input";
import { AUDIT_FORM_ERRORS } from "@/lib/audit/url-policy";
import type { AuditAction, AuditFormState } from "@/lib/audit/actions";
import { Button } from "@/ui/button";
import { TextField } from "@/ui/text-field";

const INITIAL_STATE: AuditFormState = { error: null };

type AuditFormProps = {
  /** Server Action passed from a Server Component (never imported client-side). */
  action: AuditAction;
};

/**
 * Free audit landing form (ADF-1/2/6/7, design U2). Reuses TextField + Button.
 *
 * Client-side Zod validation runs before submit for early feedback (ADF-2);
 * protocol and server errors come back inline through the action state and are
 * rendered by TextField's reserved slot with `role="alert"` (ADF-7). While the
 * action is in flight the form is `aria-busy` and the submit shows a spinner
 * + "Analizando…" (ADF-6).
 */
export function AuditForm({ action }: AuditFormProps) {
  const [serverState, formAction, isPending] = useActionState(
    action,
    INITIAL_STATE,
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const error = clientError ?? serverState.error;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const result = urlInputSchema.safeParse({
      url: new FormData(event.currentTarget).get("url"),
    });
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
      aria-label="Auditoría GEO"
      aria-busy={isPending || undefined}
      noValidate
      className="flex flex-col gap-4"
    >
      <TextField
        id="audit-url"
        name="url"
        label="URL del sitio"
        placeholder="https://ejemplo.com"
        error={error}
        disabled={isPending}
      />
      <Button type="submit" loading={isPending} className="w-full">
        Auditar
      </Button>
    </form>
  );
}
