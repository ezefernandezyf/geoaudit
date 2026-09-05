import { redirect } from "next/navigation";
import { AggregateHero } from "@/dashboard/aggregate-hero";
import { AuditHistoryTable } from "@/dashboard/audit-history-table";
import { DashboardEmptyState } from "@/dashboard/dashboard-empty-state";
import { DashboardRunnerBar } from "@/dashboard/runner-bar";
import { ScoreTrend } from "@/dashboard/score-trend";
import type { DashboardAudit } from "@/dashboard/types";
import { DASHBOARD_COPY } from "@/lib/copy";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditAction } from "@/lib/audit/actions";
import type {
  MultiPageResult,
  SeverityBand,
} from "@/lib/contracts/audit-result";
import { BreadcrumbListJsonLd } from "@/ui/breadcrumb-list-json-ld";

/**
 * Discriminates the two persisted result shapes (D3, U3.10): a multi-page
 * audit persists the light `{ aggregate, pages }` shape while single-page
 * audits keep the full `AuditResult`. Structural check - same convention as
 * the audit detail page.
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
    // DSH-10: flag multi-page rows by the persisted result shape.
    isMultiPage: isMultiPageResult(row.result),
  }));

  const runnerUser = {
    name: session.user.name ?? session.user.email ?? null,
    email: session.user.email ?? null,
  };

  return (
    <main className="min-h-dvh bg-white">
      {/* DASH-19.1 (sprint 19): honest Home > Dashboard breadcrumb trail. */}
      <BreadcrumbListJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Dashboard", path: "/dashboard" },
        ]}
      />
      {/* C14 (A11Y-4/5): sr-only page heading - the dashboard is a landmark
          page without a visible h1; the hidden heading gives screen readers a
          stable page title without altering the Gemini visual design. */}
      <h1 className="sr-only">{DASHBOARD_COPY.pageTitle}</h1>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        {/* U4.1 (DSH-8): runner bar - URL input + "Run Audit" inside + user chip. */}
        <DashboardRunnerBar action={auditAction} user={runnerUser} />

        {audits.length === 0 ? (
          <DashboardEmptyState />
        ) : (
          <>
            {/* U4.2 (DSH-9): 12-column grid - Aggregate (col-4) + Trend (col-8)
                share one row; the trend renders 12 pure-CSS bars. */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <AggregateHero
                  latestScore={audits[0].geoScore}
                  latestBand={audits[0].severityBand}
                />
              </div>
              <div className="lg:col-span-8">
                <ScoreTrend audits={audits} />
              </div>
            </div>

            {/* U4.3 (DSH-10/11): history table with header bar + Multi-Page
                chip + refresh + scanning row. */}
            <AuditHistoryTable audits={audits} />
          </>
        )}
      </div>
    </main>
  );
}
