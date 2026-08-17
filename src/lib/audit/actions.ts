import { redirect } from "next/navigation";
import { urlInputSchema } from "@/lib/contracts/url-input";
import {
  AUDIT_FORM_ERRORS,
  isAllowedProtocol,
  normalizeToHttps,
} from "@/lib/audit/url-policy";

/** State returned to the form: `{ error: null }` on success (redirect fires). */
export type AuditFormState = { error: string | null };

/** Server Action signature consumed by useActionState in AuditForm. */
export type AuditAction = (
  prevState: AuditFormState,
  formData: FormData,
) => Promise<AuditFormState>;

/**
 * Free audit Server Action (ADF-5, design U2).
 *
 * parse FormData → Zod `urlInputSchema` → protocol filter (http/https only,
 * ADF-3) → silent http→https normalization (ADF-4) → redirect to
 * `/report?url=<normalized>`. NEVER runs the audit: the report page re-runs
 * `runAudit` under Suspense, so executing it here would double the work.
 *
 * Validation failures return inline state — never throw — so the form can
 * render them with `role="alert"` (ADF-7).
 */
export async function auditAction(
  _prevState: AuditFormState,
  formData: FormData,
): Promise<AuditFormState> {
  "use server";

  const result = urlInputSchema.safeParse({ url: formData.get("url") });
  if (!result.success) {
    return { error: AUDIT_FORM_ERRORS.invalidUrl };
  }

  const url = result.data.url;
  if (!isAllowedProtocol(url)) {
    return { error: AUDIT_FORM_ERRORS.protocol };
  }

  redirect(`/report?url=${encodeURIComponent(normalizeToHttps(url))}`);
}
