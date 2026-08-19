import { redirect } from "next/navigation";
import { AuditHistoryTable } from "@/dashboard/audit-history-table";
import { DashboardEmptyState } from "@/dashboard/dashboard-empty-state";
import { ScoreTrend } from "@/dashboard/score-trend";
import type { DashboardAudit } from "@/dashboard/types";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SeverityBand } from "@/lib/contracts/audit-result";
import { Card } from "@/ui/card";

/**
 * Authenticated dashboard (DSH-1..DSH-5, design U4).
 *
 * force-dynamic: per-user data, never prerenderable. runtime nodejs: reads
 * Prisma through the pg driver adapter (Node-only).
 *
 * Data flow: `auth()` session → `prisma.audit.findMany({ userId, createdAt
 * desc })` → presentational components. Read-only by design (DSH-5): the page
 * imports no audit engine and never re-runs an audit; the persisted `result`
 * JSON stays untouched (the detailed report owns it).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DashboardPage() {
  const session = await auth();
  // The middleware guards /dashboard/* (307 → /login); this keeps the RSC safe
  // if it is ever reached without a session (defensive, not the primary gate).
  if (!session?.user?.id) {
    redirect("/login");
  }

  const rows = await prisma.audit.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const audits: DashboardAudit[] = rows.map((row) => ({
    id: row.id,
    url: row.url,
    geoScore: row.geoScore,
    // U3 persists the contract value (English band); typed via the contract
    // the shared SeverityBadge maps to its Spanish label.
    severityBand: row.severityBand as SeverityBand,
    createdAt: row.createdAt,
  }));

  return (
    <main className="min-h-dvh bg-surface">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-4xl tracking-tight text-navy">
            Tu historial de auditorías
          </h1>
          <p className="max-w-lg text-text-secondary">
            Los resultados de tus auditorías GEO y la evolución de tu score.
          </p>
        </header>

        {audits.length === 0 ? (
          <DashboardEmptyState />
        ) : (
          <>
            <Card
              header={
                <h2 className="font-display text-xl tracking-tight text-navy">
                  Tendencia de GEO Score
                </h2>
              }
            >
              <ScoreTrend audits={audits} />
            </Card>
            <Card
              header={
                <h2 className="font-display text-xl tracking-tight text-navy">
                  Historial
                </h2>
              }
            >
              <AuditHistoryTable audits={audits} />
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
