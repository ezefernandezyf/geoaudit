import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { urlInputSchema } from "@/lib/contracts/url-input";
import {
  AUDIT_FORM_ERRORS,
  isAllowedProtocol,
  normalizeToHttps,
} from "@/lib/audit/url-policy";
import { defaultRateLimiter, resolveClientKey } from "@/lib/rate-limit";

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
 * Rate limit first (ADF-9, RTL-4/5): the client key is derived from the
 * request headers (RTL-3) and checked against the in-memory fixed-window
 * limiter BEFORE any processing — an over-limit request returns the friendly
 * inline error instead of redirecting. The limiter is best-effort: in
 * serverless the in-memory store is per-instance, so the effective budget
 * scales with the instance count and is not shared across instances (RTL-6);
 * a real shared limiter backed by the DB lands in Sprint 3. Emergency kill
 * switch: `RATE_LIMIT_ENABLED=false` bypasses every check (RTL-7).
 *
 * Then: parse FormData → Zod `urlInputSchema` → protocol filter (http/https
 * only, ADF-3) → silent http→https normalization (ADF-4) → redirect to
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

  // Rate limit check first (ADF-9/RTL-4): cheapest gate, blocks abuse before
  // any processing. Inline error, no throw, no redirect (RTL-5).
  const requestHeaders = await headers();
  const decision = defaultRateLimiter.check(resolveClientKey(requestHeaders));
  if (!decision.allowed) {
    return { error: AUDIT_FORM_ERRORS.rateLimited };
  }

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
