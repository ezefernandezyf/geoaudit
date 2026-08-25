import Link from "next/link";
import { redirect } from "next/navigation";
import { Layers, Lock } from "lucide-react";
import type { MultiPageResult } from "@/lib/contracts/audit-result";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePaidTier } from "@/lib/audit/feature-gate";
import { multiPageAuditAction } from "@/lib/audit/multi-page-actions";
import { MultiPageForm } from "@/report/multi-page-form";
import { MultiPageReport } from "@/report/multi-page-report";
import { Card } from "@/ui/card";
import { MULTIPAGE_COPY } from "@/lib/copy";

/**
 * Discriminates the two persisted result shapes (D3, U3.10) — same convention
 * as the dashboard and audit detail pages.
 */
function isMultiPageResult(value: unknown): value is MultiPageResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "aggregate" in value &&
    Array.isArray((value as { pages?: unknown }).pages)
  );
}

/**
 * Multi-page trigger page (U6.2, MPU-1/2/4/5, design U6).
 *
 * force-dynamic + nodejs: per-user tier + result lookup via Prisma.
 *
 * PRO gate (MPU-2): the tier is read from the DB and fed through the SAME
 * `requirePaidTier` the Server Action uses. FREE users see the upgrade CTA and
 * NEVER get the form (the action is never reachable from this page). PRO/
 * ENTERPRISE get the real `MultiPageForm` wired to `multiPageAuditAction`
 * (MPU-1).
 *
 * Real data (MPU-4/5): below the form, the most recent multi-page audit result
 * renders the Gemini route-selector + inspector (`MultiPageReport`) — an honest
 * presenter of the persisted `MultiPageResult` that omits metrics the engine
 * does not produce. If none exists yet, a neutral empty hint is shown.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function MultiPagePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true },
  });
  const gate = requirePaidTier(user?.tier ?? "FREE");

  // Latest multi-page result for the real-data selector + inspector (MPU-4).
  let latestMultiPage: MultiPageResult | null = null;
  if (gate.allowed) {
    const recent = await prisma.audit.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { result: true },
    });
    const found = recent.map((r) => r.result).find(isMultiPageResult);
    latestMultiPage = found ?? null;
  }

  return (
    <main className="min-h-dvh bg-[#f8fafc]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-[#64748b]">
            {MULTIPAGE_COPY.header.eyebrow}
          </span>
          <h1 className="font-serif text-3xl font-normal text-[#0f172a] sm:text-4xl">
            {MULTIPAGE_COPY.header.title}
          </h1>
          <p className="max-w-2xl text-sm text-[#64748b]">
            {MULTIPAGE_COPY.header.description}
          </p>
        </div>

        {!gate.allowed ? (
          /* MPU-2: FREE users see the upgrade CTA, never the form. */
          <Card>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#10b981]" aria-hidden="true" />
                <h2 className="font-display text-xl tracking-tight text-navy">
                  {MULTIPAGE_COPY.gate.title}
                </h2>
              </div>
              <p className="text-sm text-text-secondary">
                {MULTIPAGE_COPY.gate.body}
              </p>
              <div>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0f172a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e293b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-2"
                >
                  {MULTIPAGE_COPY.gate.cta}
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* MPU-1: the real action is injected from this RSC page. */}
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm sm:p-6">
              <MultiPageForm action={multiPageAuditAction} />
            </div>

            {/* MPU-4/5: real-data route selector + inspector. */}
            {latestMultiPage ? (
              <MultiPageReport result={latestMultiPage} />
            ) : (
              <div className="flex flex-col items-start gap-3 rounded-xl border border-[#e2e8f0] bg-white p-6">
                <Layers className="h-5 w-5 text-[#94a3b8]" aria-hidden="true" />
                <h2 className="font-display text-xl tracking-tight text-navy">
                  {MULTIPAGE_COPY.results.emptyTitle}
                </h2>
                <p className="text-sm text-text-secondary">
                  {MULTIPAGE_COPY.results.emptyBody}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
