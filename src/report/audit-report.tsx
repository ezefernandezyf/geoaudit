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

/**
 * Shared report component (ARU-10, design U5). Extracted so the `/report`
 * page and the audit detail page render from ONE source of truth — no
 * duplicated report markup.
 *
 * Presenter-of-view-model boundary (ARU-10): `<AuditReport>` accepts the
 * persisted `AuditResult` (and optional caller context — persisted
 * `shareToken`/`auditDate` that the contract does not carry) and runs the
 * pure adapter `toGeminiViewModel` at the boundary; every child is a pure
 * presenter of the `GeminiView` and never reads engine shapes.
 *
 * Pure SSR Server Component: takes a persisted `AuditResult` object and
 * composes the full Gemini report — ScoreHero (real benchmark) +
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

  return (
    <section
      aria-label="Reporte de auditoría"
      className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10"
    >
      <ScoreHero view={view} />
      <DomainScorecard view={view} />
      <PlatformMatrix view={view} />
      <TopFindings view={view} />
      <ReportMeta view={view} />
    </section>
  );
}
