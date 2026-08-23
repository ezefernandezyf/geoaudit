import type { AuditResult } from "@/lib/contracts/audit-result";
import { DomainScorecard } from "@/report/domain-scorecard";
import { ReportMeta } from "@/report/report-meta";
import { ScoreHero } from "@/report/score-hero";
import { TopFindings } from "@/report/top-findings";

/**
 * Shared report component (ADP-4/ADP-5, design D1). Extracted verbatim from
 * `audit-runner.tsx` (U1.2) so the `/report` page and the audit detail page
 * render from ONE source of truth — no duplicated report markup.
 *
 * Pure SSR Server Component (no `"use client"`): takes a persisted
 * `AuditResult` object and composes the full MVP report — ScoreHero +
 * DomainScorecard + TopFindings + ReportMeta (ARU-8). Degraded results
 * (RAO-12/RAO-13) render honestly through the child components: "No
 * disponible" chips, visible `meta.errors` and the true (rebalanced) GEO
 * Score (ARU-7).
 *
 * It never runs an audit itself: the caller (AuditRunner or the detail page)
 * owns fetching/persisting and passes the finished result.
 */
export function AuditReport({ result }: { result: AuditResult }) {
  return (
    <section
      aria-label="Reporte de auditoría"
      className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16"
    >
      <ScoreHero summary={result.summary} />
      <DomainScorecard result={result} />
      <TopFindings
        citability={result.citability}
        schema={result.schema}
        crawlers={result.crawlers}
      />
      <ReportMeta summary={result.summary} meta={result.meta} />
    </section>
  );
}
