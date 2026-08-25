"use client";

import { useActionState, useState, type FormEvent } from "react";
import { Globe, Plus } from "lucide-react";
import { urlInputSchema } from "@/lib/contracts/url-input";
import { AUDIT_FORM_ERRORS } from "@/lib/audit/url-policy";
import { DASHBOARD_COPY } from "@/lib/copy";
import type { AuditAction, AuditFormState } from "@/lib/audit/actions";
import { Button } from "@/ui/button";
import { TextField } from "@/ui/text-field";

const INITIAL_STATE: AuditFormState = { error: null };

type RunnerBarUser = {
  name: string | null;
  email: string | null;
  /** Lowercase plan label (free/pro/enterprise), Gemini pill. */
  plan: string | null;
};

type RunnerBarProps = {
  /** The `auditAction` Server Action, injected by the RSC page (DSH-8). */
  action: AuditAction;
  /** Session user + plan for the right-hand chip. */
  user: RunnerBarUser;
};

/**
 * Dashboard runner bar (DSH-8, design U4). Gemini verbatim composition: a
 * bordered white bar holding the URL input with the "Run Audit" button INSIDE
 * the field plus the user chip (name + plan + initials) on the right.
 *
 * The URL input drives the real audit: client-side Zod validation before submit
 * (ADF-2), then the injected Server Action (auditAction) redirects to the
 * report. Same contract as the landing `AuditForm`, but without the sample URL
 * chips and with the dashboard's user chip.
 */
export function DashboardRunnerBar({ action, user }: RunnerBarProps) {
  const [serverState, formAction, isPending] = useActionState(
    action,
    INITIAL_STATE,
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const [url, setUrl] = useState("https://linear.app");
  const error = clientError ?? serverState.error;
  const { placeholder, submitLabel, inputLabel, formAriaLabel } =
    DASHBOARD_COPY.runner;

  const initials = user.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join("")
    : "?";

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
    <div className="flex flex-col items-stretch justify-between gap-4 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-xs sm:p-5 md:flex-row md:items-center">
      <form
        action={formAction}
        onSubmit={handleSubmit}
        aria-label={formAriaLabel}
        aria-busy={isPending || undefined}
        noValidate
        className="w-full max-w-2xl flex-1"
      >
        {/* Gemini runner pill: bordered field with the button inside. */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-2 shadow-xs">
          <TextField
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
                leftIcon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                {submitLabel}
              </Button>
            }
            className="!border-transparent !bg-transparent hover:!border-transparent focus:!border-transparent focus:!ring-0 !pr-28"
          />
        </div>
      </form>

      {/* User chip (Gemini): name + plan + initials avatar. */}
      <div className="flex items-center justify-between gap-4 border-t border-[#e2e8f0] pt-3 md:justify-end md:border-t-0 md:pt-0">
        <div className="text-right">
          <p className="text-xs font-bold text-[#0f172a]">
            {user.name ?? user.email ?? "Usuario"}
          </p>
          {user.plan ? (
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#475569]">
              {user.plan} Plan
            </p>
          ) : null}
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#cbd5e1] text-xs font-bold text-[#0f172a]">
          {initials}
        </div>
      </div>
    </div>
  );
}
