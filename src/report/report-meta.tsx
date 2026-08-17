import type { AuditResult } from "@/lib/contracts/audit-result";
import { formatAuditDate, formatDurationMs } from "@/report/format";

export type ReportMetaProps = {
  /** Audit summary — duration used for the meta strip. */
  summary: AuditResult["summary"];
  /** Audit meta — completedAt for the date, errors for the honest avisos. */
  meta: AuditResult["meta"];
};

/**
 * ReportMeta (ARU-7): the report metadata strip — localized audit date — plus
 * the honest `meta.errors` avisos. A degraded audit is never presented as
 * success: every engine failure recorded by RAO-12/RAO-13 stays visible.
 */
export function ReportMeta({ summary, meta }: ReportMetaProps) {
  return (
    <section aria-label="Metadatos del análisis" className="w-full">
      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-text-secondary">
        <div>
          <dt className="sr-only">Fecha de la auditoría</dt>
          <dd>{formatAuditDate(meta.completedAt)}</dd>
        </div>
        <div>
          <dt className="sr-only">Duración del análisis</dt>
          <dd>{formatDurationMs(summary.durationMs)}</dd>
        </div>
      </dl>
      {meta.errors.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-text-primary">
            Avisos del análisis
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
