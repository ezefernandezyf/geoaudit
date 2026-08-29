import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, FileQuestion } from "lucide-react";
import type {
  AuditResult,
  MultiPageResult,
} from "@/lib/contracts/audit-result";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditReport } from "@/report/audit-report";
import { MultiPageReport } from "@/report/multi-page-report";
import { toGeminiViewModel } from "@/report/presenters/toGeminiViewModel";
import type { GeminiView } from "@/report/presenters/types";
import { ShareModal } from "@/dashboard/share-modal";
import { createShareToken, revokeShareToken } from "@/lib/audit/share-actions";
import { Card } from "@/ui/card";
import { MULTIPAGE_COPY } from "@/lib/copy";

/**
 * Discriminates the two persisted result shapes (D3, U3.10): a multi-page
 * audit persists the light `{ aggregate, pages }` shape (`multiPageResultSchema`)
 * while single-page audits keep the full `AuditResult`. Structural check — the
 * persisted JSON is contract-shaped by construction (same cast convention as
 * the write side).
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
 * A3 drill-down (MPU-7, design sprint 8 A3): maps the persisted `AuditPage`
 * rows (1:N under the multi-page master audit, `result: Json`) to per-page
 * `GeminiView`s. Each row's `result` is cast to `AuditResult` with the SAME
 * convention the write side uses (`result: Json`, contract-shaped by
 * construction) and run through the pure adapter `toGeminiViewModel`. Pure
 * mapping — no I/O; the caller owns the query.
 */
function pageViewsFromRows(
  rows: Array<{ url: string; result: unknown }>,
): { url: string; view: GeminiView }[] {
  return rows.map((row) => ({
    url: row.url,
    view: toGeminiViewModel(row.result as unknown as AuditResult),
  }));
}

/**
 * Audit detail page (U5.9, ADP-6/7/8, design U5). `/dashboard/audits/[id]`
 * renders the persisted audit's report in the Gemini AuditDetailPage
 * composition: back-to-history bar, the full Gemini report (hero with real
 * benchmark + 5-category scorecard + 6-platform matrix + findings with real
 * JSON-LD code), the ShareModal (real actions) and the Export PDF — available
 * to every authenticated owner (ADP-7/8, no tier gate).
 *
 * force-dynamic: per-user row, never prerenderable. runtime nodejs: reads
 * Prisma through the pg driver adapter (Node-only).
 *
 * Ownership (ADP-2): `findFirst({ id, userId })` → non-owner and missing
 * audit collapse to `null` → single `notFound()` (404) — no existence leak.
 * The middleware 307-redirects `/dashboard/*` to /login; the
 * `redirect("/login")` here is the defensive RSC guard.
 *
 * Render (ADP-3): the persisted `result` JSON is the sole source — never
 * re-runs an audit. The persisted date + share token travel through the
 * adapter `ctx` (APT-9).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AuditDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AuditDetailPage({
  params,
}: AuditDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const audit = await prisma.audit.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!audit) {
    notFound();
  }

  const auditDate = audit.createdAt.toISOString();

  // A3 drill-down (MPU-7/8): multi-page audits resolve their per-page FULL
  // reports server-side from the persisted `AuditPage` rows (light master
  // shape stays unenriched). Legacy audits without rows → honest empty state.
  let multiPage = null as {
    result: MultiPageResult;
    pageViews: { url: string; view: GeminiView }[];
  } | null;
  if (isMultiPageResult(audit.result)) {
    const rows = await prisma.auditPage.findMany({
      where: { auditId: audit.id },
      orderBy: { position: "asc" },
    });
    multiPage = {
      result: audit.result,
      pageViews: pageViewsFromRows(rows),
    };
  }

  return (
    <main className="min-h-dvh bg-[#f8fafc]">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        {/* Top action header (Gemini AuditDetailPage verbatim) */}
        <div className="flex flex-col justify-between gap-4 pt-8 sm:flex-row sm:items-center sm:pt-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748b] transition-colors hover:text-[#0f172a]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Volver al historial</span>
          </Link>

          {/* ADP-7/8: share + export are available to every authenticated owner. */}
          <div className="flex flex-wrap items-center gap-2.5">
            <ShareModal
              auditId={audit.id}
              initialToken={audit.shareToken}
              createAction={createShareToken}
              revokeAction={revokeShareToken}
            />
            {/* Real download: the PDF route re-checks ownership (PDF-2). */}
            <a
              href={`/api/report/${audit.id}/pdf`}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-[#0f172a] px-3 text-xs font-medium text-white shadow-xs transition-all duration-150 select-none whitespace-nowrap hover:bg-[#1e293b] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f172a]/20"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Exportar PDF</span>
            </a>
          </div>
        </div>

        {multiPage ? (
          multiPage.pageViews.length === 0 ? (
            /* Honest empty state (MPU-8): legacy multi-page audit with no
               persisted AuditPage rows — no fabricated pages or metrics. */
            <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
              <Card>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f8fafc]">
                    <FileQuestion
                      className="h-5 w-5 text-[#64748b]"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-normal text-[#0f172a]">
                      {MULTIPAGE_COPY.results.detailEmptyTitle}
                    </h2>
                    <p className="mt-2 text-sm text-[#475569]">
                      {MULTIPAGE_COPY.results.detailEmptyBody}
                    </p>
                  </div>
                </div>
              </Card>
            </main>
          ) : (
            <MultiPageReport
              result={multiPage.result}
              pageViews={multiPage.pageViews}
            />
          )
        ) : (
          <AuditReport
            result={audit.result as unknown as AuditResult}
            ctx={{ auditDate, shareToken: audit.shareToken }}
          />
        )}
      </div>
    </main>
  );
}
