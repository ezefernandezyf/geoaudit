import { runAudit } from "@/audit";
import type { AuditResult } from "@/lib/contracts/audit-result";
import { SeverityBadge } from "@/ui/severity-badge";
import {
  detectFetchFailureCode,
  resolveFetchErrorCopy,
} from "@/report/fetch-error-copy";

export type AuditRunnerProps = {
  /** Normalized http/https URL to audit (already validated by resolve.ts). */
  url: string;
};

/**
 * Report driver (ARU-1/ARU-2): runs `runAudit(url)` under the page Suspense.
 *
 * U3 minimal version (ARU-6 pull-forward): catches the page-fetch failure
 * throw and renders the mapped friendly Spanish copy + a Reintentar link;
 * unexpected errors are rethrown so the `error.tsx` boundary (ARU-4) handles
 * them. On success it renders a "reporte próximo" placeholder with the basic
 * meta (URL + estado + GEO Score + duration + meta.errors) — the full
 * scorecard render lands in U4.T1.
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
  return <AuditPlaceholder result={result} />;
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

function AuditPlaceholder({ result }: { result: AuditResult }) {
  const { summary, meta } = result;
  return (
    <section
      aria-label="Reporte de auditoría"
      className="mx-auto w-full max-w-3xl px-6 py-16"
    >
      <p className="mb-8 text-sm text-text-secondary">
        El reporte completo estará disponible en una próxima actualización.
      </p>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-border bg-surface p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            URL
          </dt>
          <dd className="mt-1 break-all text-sm text-text-primary">
            {summary.url}
          </dd>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            GEO Score
          </dt>
          <dd className="mt-1 font-display text-3xl text-navy">
            {summary.geoScore}
          </dd>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            Estado
          </dt>
          <dd className="mt-1">
            <SeverityBadge band={summary.severityBand} />
          </dd>
        </div>
        <div className="rounded-md border border-border bg-surface p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            Duración
          </dt>
          <dd className="mt-1 text-sm text-text-primary">
            {(summary.durationMs / 1000).toFixed(1)} s
          </dd>
        </div>
      </dl>
      {meta.errors.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-text-primary">
            Errores del análisis
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {meta.errors.map((error) => (
              <li
                key={error}
                className="rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-text-secondary"
              >
                {error}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
