import { runAudit } from "@/audit";
import type { AuditResult } from "@/lib/contracts/audit-result";
import { DomainScorecard } from "@/report/domain-scorecard";
import {
  detectFetchFailureCode,
  resolveFetchErrorCopy,
} from "@/report/fetch-error-copy";
import { ReportMeta } from "@/report/report-meta";
import { ScoreHero } from "@/report/score-hero";
import { TopFindings } from "@/report/top-findings";

export type AuditRunnerProps = {
  /** Normalized http/https URL to audit (already validated by resolve.ts). */
  url: string;
};

/**
 * Report driver (ARU-1/ARU-2): runs `runAudit(url)` under the page Suspense.
 *
 * U4: on success it composes the full MVP report (D1) — ScoreHero +
 * DomainScorecard + TopFindings + ReportMeta (ARU-8). Degraded results
 * (RAO-12/RAO-13) render honestly: "No disponible" chips, visible
 * `meta.errors` and the true (rebalanced) GEO Score (ARU-7).
 *
 * It catches the page-fetch failure throw and renders the mapped friendly
 * Spanish copy + a Reintentar link (ARU-6); unexpected errors are rethrown so
 * the `error.tsx` boundary (ARU-4) handles them.
 */
export async function AuditRunner({ url }: AuditRunnerProps) {
  let result: AuditResult;
  try {
    result = await runAudit(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (detectFetchFailureCode(message) === null) {
      // Not a known fetch failure — let the error boundary (ARU-4) own it.
      throw error;
    }
    return <FetchErrorState url={url} copy={resolveFetchErrorCopy(error)} />;
  }
  return <AuditReport result={result} />;
}

function FetchErrorState({ url, copy }: { url: string; copy: string }) {
  return (
    <section
      role="alert"
      className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center"
    >
      <h2 className="font-display text-3xl tracking-tight text-navy">
        No pudimos analizar el sitio
      </h2>
      <p className="max-w-md text-text-secondary">{copy}</p>
      <a
        href={`/report?url=${encodeURIComponent(url)}`}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        Reintentar
      </a>
    </section>
  );
}

function AuditReport({ result }: { result: AuditResult }) {
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
