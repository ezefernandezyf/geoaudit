import { notFound } from "next/navigation";
import type { AuditResult } from "@/lib/contracts/audit-result";
import { prisma } from "@/lib/prisma";
import { AuditReport } from "@/report/audit-report";

/**
 * Public share page (SHR-2/5/6, design D4). `/share/[token]` renders a
 * revocable, read-only report — deliberately OUTSIDE the auth middleware
 * matcher (`/dashboard/*` only): no `auth()`, no ownership check.
 *
 * Lookup (SHR-6): `findUnique({ shareToken })` — a missing, null or unknown
 * token returns `null` → single `notFound()` (404) path. The nullable-unique
 * column is the exact match (SHR-1).
 *
 * Render (SHR-2): the persisted `result` JSON is rendered directly through
 * the shared `<AuditReport>` — the audit is NEVER re-run (no audit engine
 * import at all).
 *
 * Exposure (SHR-5): the query selects the audit row only (no user relation)
 * and the page passes ONLY `audit.result` to the report — `userId`, email and
 * tier never reach the payload or the DOM.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SharePageProps = {
  params: Promise<{ token: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const audit = await prisma.audit.findUnique({
    where: { shareToken: token },
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
