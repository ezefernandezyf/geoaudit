import type { AuditResult } from "@/lib/contracts/audit-result";
import {
  toGeminiViewModel,
  type ViewModelContext,
} from "@/report/presenters/toGeminiViewModel";
import { DomainScorecard } from "@/report/domain-scorecard";
import { PlatformMatrix } from "@/report/platform-matrix";
import { ReportMeta } from "@/report/report-meta";
import { ScoreHero } from "@/report/score-hero";
import { TopFindings } from "@/report/top-findings";
import { FileDown } from "lucide-react";
import Link from "next/link";
import { REPORT_COPY } from "@/lib/copy";

/**
 * Shared report component (ARU-10, design U5). Extracted so the `/report`
 * page and the audit detail page render from ONE source of truth - no
 * duplicated report markup.
 *
 * Presenter-of-view-model boundary (ARU-10): `<AuditReport>` accepts the
 * persisted `AuditResult` (and optional caller context - persisted
 * `shareToken`/`auditDate` that the contract does not carry) and runs the
 * pure adapter `toGeminiViewModel` at the boundary; every child is a pure
 * presenter of the `GeminiView` and never reads engine shapes.
 *
 * Pure SSR Server Component: takes a persisted `AuditResult` object and
 * composes the full Gemini report - ScoreHero (real benchmark) +
 * DomainScorecard + PlatformMatrix + TopFindings + ReportMeta (ARU-10/11/12).
 * It never runs an audit itself: the caller (AuditRunner or the detail page)
 * owns fetching/persisting and passes the finished result.
 */
export function AuditReport({
  result,
  ctx,
}: {
  result: AuditResult;
  /** Persisted context the contract does not carry (APT-9). */
  ctx?: ViewModelContext;
}) {
  const view = toGeminiViewModel(result, ctx);
  // PDF-10 (D1/D2): the export entry renders ONLY when the audit persisted
  // (a real href exists) - best-effort persistence failure means NO entry, no
  // dead link. Anonymous reports get the signup CTA instead.
  const exportPdfHref = ctx?.exportPdfHref ?? null;
  const exportAnonCta = ctx?.exportAnonCta ?? false;

  return (
    <section
      aria-label="Reporte de auditoría"
      className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10"
    >
      <ScoreHero view={view} />

      {exportPdfHref ? (
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-[#e2e8f0] bg-white px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">
              {REPORT_COPY.export.title}
            </p>
            <p className="text-xs text-[#475569]">{REPORT_COPY.export.body}</p>
          </div>
          <a
            href={exportPdfHref}
            className="inline-flex items-center gap-2 rounded-md bg-[#0f172a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e293b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <FileDown className="h-4 w-4" aria-hidden="true" />
            {REPORT_COPY.export.cta}
          </a>
        </div>
      ) : exportAnonCta ? (
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-[#e2e8f0] bg-white px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">
              {REPORT_COPY.export.anonTitle}
            </p>
            <p className="text-xs text-[#475569]">
              {REPORT_COPY.export.anonBody}
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-md bg-[#0f172a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1e293b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            {REPORT_COPY.export.anonCta}
          </Link>
        </div>
      ) : null}

      <DomainScorecard view={view} />
      <PlatformMatrix view={view} />
      <TopFindings view={view} />
      <ReportMeta view={view} />
    </section>
  );
}
