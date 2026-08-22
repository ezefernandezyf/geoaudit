import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { AuditResult } from "@/lib/contracts/audit-result";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditReport } from "@/report/audit-report";
import { ShareLinkPanel } from "@/dashboard/share-link-panel";
import { requirePaidTier } from "@/lib/audit/feature-gate";
import { createShareToken, revokeShareToken } from "@/lib/audit/share-actions";
import { Card } from "@/ui/card";

/**
 * Audit detail page (ADP-1..ADP-3, design D1/D2). First dynamic route of the
 * app: `/dashboard/audits/[id]` renders the persisted audit's report.
 *
 * force-dynamic: per-user row, never prerenderable. runtime nodejs: reads
 * Prisma through the pg driver adapter (Node-only).
 *
 * Ownership (ADP-2, D2): the query is scoped `findFirst({ id, userId })`, so a
 * non-owner and a missing audit both collapse to `null` → single `notFound()`
 * (404) path — no existence leak. The middleware 307-redirects
 * `/dashboard/*` to /login; the `redirect("/login")` here is the defensive
 * RSC guard mirroring the dashboard page.
 *
 * Render (ADP-3): the persisted `result` JSON is the sole source — the page
 * never re-runs an audit. The cast mirrors the write-side `InputJsonValue`
 * cast in audit-runner.tsx (Prisma types the JSON column as JsonValue, the
 * contract types it as AuditResult; the persisted value is contract-shaped by
 * construction).
 *
 * Share (U2.7, SHR-3, TLM-9, design D7): the share feature is PRO-gated. The
 * tier is read from the DB (the session carries only user.id — dashboard
 * pattern) and fed through the SAME `requirePaidTier` the Server Actions use:
 * PRO/ENTERPRISE render the `<ShareLinkPanel>` (with the two actions injected,
 * the BillingCta → CheckoutButton pattern); FREE renders the upgrade CTA.
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

  return (
    <main className="min-h-dvh bg-surface">
      <AuditReport result={audit.result as unknown as AuditResult} />
      <div className="mx-auto w-full max-w-3xl px-6 pb-16">
        <Card
          header={
            <h2 className="font-display text-xl tracking-tight text-navy">
              Compartir reporte
            </h2>
          }
        >
          {gate.allowed ? (
            <ShareLinkPanel
              auditId={audit.id}
              initialToken={audit.shareToken}
              createAction={createShareToken}
              revokeAction={revokeShareToken}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-text-secondary">
                Los links de share son una función PRO. Mejorá tu plan para
                compartir reportes con tu equipo o tus clientes.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Mejorar a PRO
              </Link>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
