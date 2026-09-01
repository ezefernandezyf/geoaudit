"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { urlInputSchema } from "@/lib/contracts/url-input";
import { isAllowedProtocol } from "@/lib/audit/url-policy";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkTierLimit } from "@/lib/audit/enforcement";
import { getDefaultRateLimiter, resolveClientKey } from "@/lib/rate-limit";
import { runMultiPageAudit } from "@/audit/multi-page";
import { persistMultiPageAudit } from "@/lib/audit/multi-page-persist";

/**
 * Multi-page audit Server Action (MPA-1, TLM-3/10, design D3).
 *
 * Entry point for the sitemap-driven multi-page audit. Unlike the single-page
 * flow (which redirects and runs the audit in the report page under
 * Suspense), the multi-page run is EXPENSIVE (up to 5 audits) and the design
 * (Data Flow) runs it HERE, persists through the SAME $transaction and
 * redirects to the audit detail page.
 *
 * Gates (cheapest first, following the auditAction pattern):
 * 1. Rate limit (ADF-9) - inline error, no processing.
 * 2. Zod `urlInputSchema` + protocol filter - inline error (ADF-3/5).
 * 3. Session - multi-page is a signed-in feature (counts against the user's
 *    FREE limit, so it requires a user). No tier gate (MPA-8 removed).
 * 4. Limit (TLM-3): `checkTierLimit` - over-limit users get `"limit"` before
 *    any work.
 *
 * Success: `runMultiPageAudit(url)` → `prisma.$transaction` →
 * `persistMultiPageAudit` (1 master Audit + N AuditPage rows, MPA-6/7) →
 * redirect to `/dashboard/audits/[id]`. TLM-10 is satisfied structurally: the
 * master Audit row counts exactly once toward the 30-day window.
 * Engine/persist failures return `"failed"` - never uncaught; the redirect
 * (NEXT_REDIRECT throw) is intentionally OUTSIDE the try/catch so it
 * propagates normally.
 */

/** Error codes returned instead of thrown, mapped to copy in the trigger UI. */
export type MultiPageErrorCode =
  "rate-limited" | "invalid" | "auth" | "limit" | "failed";

/** State consumed by useActionState (the trigger form renders the codes). */
export type MultiPageFormState = { error: MultiPageErrorCode | null };

/** Server Action signature (mirrors AuditAction / ShareLinkAction). */
export type MultiPageAction = (
  prevState: MultiPageFormState,
  formData: FormData,
) => Promise<MultiPageFormState>;

export async function multiPageAuditAction(
  _prevState: MultiPageFormState,
  formData: FormData,
): Promise<MultiPageFormState> {
  // 1. Rate limit (ADF-9/RTL-4): cheapest gate, inline error, no processing.
  const requestHeaders = await headers();
  const limiter = await getDefaultRateLimiter();
  const decision = await limiter.check(resolveClientKey(requestHeaders));
  if (!decision.allowed) {
    return { error: "rate-limited" };
  }

  // 2. Shared Zod contract + protocol filter (ADF-3/5).
  const result = urlInputSchema.safeParse({ url: formData.get("url") });
  if (!result.success) {
    return { error: "invalid" };
  }
  const url = result.data.url;
  if (!isAllowedProtocol(url)) {
    return { error: "invalid" };
  }

  // 3. Session: multi-page is a signed-in feature (it counts against the
  // user's FREE limit) so it requires a user; there is no tier gate (MPA-8
  // removed - any authenticated user runs it).
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "auth" };
  }

  // 4. Limit pre-check (TLM-3): one multi-page audit counts exactly once
  // (TLM-10), so the check measures the same counter as the single-page flow.
  const { allowed } = await checkTierLimit(prisma, session.user.id, Date.now());
  if (!allowed) {
    return { error: "limit" };
  }

  // Run + persist. The engine never throws (per-page isolation, MPA-1) and
  // discovery degrades to zero pages; only an unexpected failure lands here.
  const userId = session.user.id;
  let auditId: string;
  try {
    const engineResult = await runMultiPageAudit(url);
    auditId = await prisma.$transaction((tx) =>
      persistMultiPageAudit(tx, {
        userId,
        aggregate: engineResult.aggregate,
        pages: engineResult.pages,
      }),
    );
  } catch (error) {
    console.error("multi-page audit failed", error);
    return { error: "failed" };
  }

  redirect(`/dashboard/audits/${auditId}`);
}
