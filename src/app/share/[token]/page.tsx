import { notFound } from "next/navigation";
import type {
  AuditResult,
  MultiPageResult,
} from "@/lib/contracts/audit-result";
import { prisma } from "@/lib/prisma";
import { AuditReport } from "@/report/audit-report";
import { MultiPageReport } from "@/report/multi-page-report";

/**
 * Discriminates the two persisted result shapes (same structural check as the
 * detail page): a multi-page audit persists the light `{ aggregate, pages }`
 * shape while single-page audits keep the full `AuditResult`. Without this, a
 * shared multi-page audit would dereference `summary`/`meta` undefined in
 * ScoreHero/DomainScorecard and crash (verify warning #4).
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
 * Public share page (SHR-2/5/6, design D4). `/share/[token]` renders a
 * revocable, read-only report — deliberately OUTSIDE the auth middleware
 * matcher (`/dashboard/*` only): no `auth()`, no ownership check.
 *
 * Lookup (SHR-6): `findUnique({ shareToken })` — a missing, null or unknown
 * token returns `null` → single `notFound()` (404) path. The nullable-unique
 * column is the exact match (SHR-1).
 *
 * Render (SHR-2): the persisted `result` JSON is rendered directly through the
 * shared report components — the audit is NEVER re-run (no audit engine
 * import at all). Single-page → `<AuditReport>`; multi-page → `<MultiPageReport>`
 * (fixes the verify warning #4 crash on shared multi-page audits).
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
    <main className="min-h-dvh bg-surface pb-16">
      {/* Public share shell (SHR-3 restyle): no app chrome, no billing. */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-navy font-display text-sm font-bold text-white">
              G
            </div>
            <div className="leading-none">
              <span className="block font-display text-lg text-navy">
                GeoAudit
              </span>
              <span className="font-mono text-[10px] text-text-secondary">
                Reporte de Visibilidad de IA
              </span>
            </div>
            <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-emerald/20 bg-emerald/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-700">
              Verificado
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 pt-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-xs text-text-secondary">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald" />
            Reporte público generado para{" "}
            <strong className="font-mono font-medium text-navy">
              {audit.url}
            </strong>
          </span>
        </div>

        {isMultiPageResult(audit.result) ? (
          <MultiPageReport result={audit.result} />
        ) : (
          <AuditReport result={audit.result as unknown as AuditResult} />
        )}
      </div>
    </main>
  );
}
