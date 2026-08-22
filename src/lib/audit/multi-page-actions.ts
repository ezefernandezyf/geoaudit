"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { urlInputSchema } from "@/lib/contracts/url-input";
import { isAllowedProtocol } from "@/lib/audit/url-policy";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkTierLimit } from "@/lib/audit/enforcement";
import { requirePaidTier } from "@/lib/audit/feature-gate";
import { getDefaultRateLimiter, resolveClientKey } from "@/lib/rate-limit";
import { runMultiPageAudit } from "@/audit/multi-page";
import { persistMultiPageAudit } from "@/lib/audit/multi-page-persist";

/**
 * Multi-page audit Server Action (MPA-8, TLM-9/10, design D3/D7).
 *
 * PRO-gated entry point for the sitemap-driven multi-page audit. Unlike the
 * free flow (which redirects and runs the audit in the report page under
 * Suspense), the multi-page run is EXPENSIVE (up to 5 audits) and the design
 * (Data Flow) runs it HERE, persists through the SAME $transaction and
 * redirects to the audit detail page.
 *
 * Gates (cheapest first, following the auditAction pattern):
 * 1. Rate limit (ADF-9) — inline error, no processing.
 * 2. Zod `urlInputSchema` + protocol filter — inline error (ADF-3/5).
 * 3. Session — multi-page is a signed-in feature.
 * 4. PRO feature gate (MPA-8, D7): `requirePaidTier` — FREE users get
 *    `"upgrade"` and the engine is NEVER run (TLM-9).
 * 5. Tier limit (TLM-3 pattern): `checkTierLimit` — over-limit PRO gets
 *    `"limit"` before any work.
 *
 * Success: `runMultiPageAudit(url)` → `prisma.$transaction` →
 * `persistMultiPageAudit` (1 master Audit + N AuditPage rows + exactly ONE
 * paid-counter increment, MPA-6/7/TLM-10) → redirect to `/dashboard/audits/[id]`.
 * Engine/persist failures return `"failed"` — never uncaught; the redirect
 * (NEXT_REDIRECT throw) is intentionally OUTSIDE the try/catch so it
 * propagates normally.
 */

/** Error codes returned instead of thrown, mapped to copy in the trigger UI. */
export type MultiPageErrorCode =
  "rate-limited" | "invalid" | "auth" | "upgrade" | "limit" | "failed";

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

  // 3. Session: multi-page is a signed-in feature (the free flow allows
  // anonymous audits; multi-page is PRO-gated so it requires a user).
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "auth" };
  }

  // 4. PRO feature gate (MPA-8, TLM-9, D7): the same requirePaidTier the UI
  // uses — FREE is denied with the upgrade CTA BEFORE the engine runs.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true },
  });
  const gate = requirePaidTier(user?.tier ?? "FREE");
  if (!gate.allowed) {
    return { error: "upgrade" };
  }

  // 5. Tier limit pre-check (TLM-3): one multi-page audit counts exactly once
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
        now: Date.now(),
      }),
    );
  } catch (error) {
    console.error("multi-page audit failed", error);
    return { error: "failed" };
  }

  redirect(`/dashboard/audits/${auditId}`);
}
