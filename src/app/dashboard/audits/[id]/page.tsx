import { notFound, redirect } from "next/navigation";
import type { AuditResult } from "@/lib/contracts/audit-result";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditReport } from "@/report/audit-report";

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

  return (
    <main className="min-h-dvh bg-surface">
      <AuditReport result={audit.result as unknown as AuditResult} />
    </main>
  );
}
