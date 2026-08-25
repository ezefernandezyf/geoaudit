import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import type {
  AuditResult,
  MultiPageResult,
} from "@/lib/contracts/audit-result";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditReport } from "@/report/audit-report";
import { MultiPageReport } from "@/report/multi-page-report";
import { ShareModal } from "@/dashboard/share-modal";
import { requirePaidTier } from "@/lib/audit/feature-gate";
import { createShareToken, revokeShareToken } from "@/lib/audit/share-actions";
import { Card } from "@/ui/card";

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
 * Audit detail page (U5.9, ADP-6/7/8, design U5). `/dashboard/audits/[id]`
 * renders the persisted audit's report in the Gemini AuditDetailPage
 * composition: back-to-history bar, the full Gemini report (hero with real
 * benchmark + 5-category scorecard + 6-platform matrix + findings with real
 * JSON-LD code), the PRO-gated ShareModal (real actions) and the PRO-gated
 * Export PDF.
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
 *
 * PRO gates (TLM-9, ADP-7/8): the tier is read from the DB and fed through
 * the SAME `requirePaidTier` the Server Actions and the PDF route use.
 * PRO/ENTERPRISE render the ShareModal (real create/revoke actions injected)
 * and the real Export PDF download link (`/api/report/[id]/pdf`, which itself
 * re-checks ownership + tier, PDF-2/3); FREE renders the upgrade CTA.
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true },
  });
  const gate = requirePaidTier(user?.tier ?? "FREE");
  const auditDate = audit.createdAt.toISOString();

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

          {gate.allowed ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <ShareModal
                auditId={audit.id}
                initialToken={audit.shareToken}
                createAction={createShareToken}
                revokeAction={revokeShareToken}
              />
              {/* Real download: the PDF route re-checks ownership + tier. */}
              <a
                href={`/api/report/${audit.id}/pdf`}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-[#0f172a] px-3 text-xs font-medium text-white shadow-xs transition-all duration-150 select-none whitespace-nowrap hover:bg-[#1e293b] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f172a]/20"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Exportar PDF</span>
              </a>
            </div>
          ) : null}
        </div>

        {isMultiPageResult(audit.result) ? (
          <MultiPageReport result={audit.result} />
        ) : (
          <AuditReport
            result={audit.result as unknown as AuditResult}
            ctx={{ auditDate, shareToken: audit.shareToken }}
          />
        )}

        {!gate.allowed ? (
          <div className="mx-auto w-full max-w-5xl pb-16">
            <Card>
              <h2 className="font-display text-xl tracking-tight text-navy">
                Compartir y exportar son funciones PRO
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                <p className="text-sm text-text-secondary">
                  Los links de share y la exportación a PDF son funciones PRO.
                  Mejore su plan para compartir reportes con su equipo o sus
                  clientes y exportarlos a PDF.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0f172a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e293b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-2"
                >
                  Mejorar a PRO
                </Link>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </main>
  );
}
