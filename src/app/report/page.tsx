import { Suspense } from "react";
import { auditAction } from "@/lib/audit/actions";
import { AuditForm } from "@/ui/audit-form";
import { AuditRunner } from "@/report/audit-runner";
import { resolveReportUrl, type ReportSearchParams } from "./resolve";
import { ReportSkeleton } from "./report-skeleton";
import { REPORT_COPY } from "@/lib/copy";

/**
 * Report shell (U3.T1, ARU-1/ARU-2/ARU-5).
 *
 * force-dynamic: the page depends on `searchParams` + async I/O, so static
 * prerendering would drop the params. runtime nodejs: the audit pipeline's
 * SSRF guard resolves DNS with `node:dns` - unavailable on the Edge runtime.
 *
 * Branch on `searchParams.url` (pure decision in resolve.ts):
 * - missing/invalid/disallowed → Empty state: inline AuditForm (same as the
 *   landing) pre-filled with the raw input for correction (ARU-5);
 * - valid → `<Suspense>` with the pulse skeleton fallback while the
 *   AuditRunner awaits `runAudit` (ARU-1/ARU-3).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ReportPageProps = {
  searchParams: Promise<ReportSearchParams>;
};

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const resolved = resolveReportUrl(await searchParams);

  if (resolved.status === "empty") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-white px-6">
        <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 py-24 text-center">
          <h1 className="font-serif text-4xl tracking-tight text-[#0f172a]">
            {REPORT_COPY.emptyState.title}
          </h1>
          <p className="max-w-lg text-[#475569]">
            {REPORT_COPY.emptyState.body}
          </p>
          <div className="w-full max-w-xl">
            <AuditForm action={auditAction} defaultValue={resolved.input} />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-white">
      <Suspense fallback={<ReportSkeleton url={resolved.url} />}>
        <AuditRunner url={resolved.url} />
      </Suspense>
    </main>
  );
}
