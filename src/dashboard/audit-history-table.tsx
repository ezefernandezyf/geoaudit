import type { DashboardAudit } from "@/dashboard/types";
import { formatAuditDate } from "@/report/format";
import { SeverityBadge } from "@/ui/severity-badge";

type AuditHistoryTableProps = {
  /**
   * Audits to list. The RSC owns the ordering (Prisma `orderBy createdAt
   * desc`, DSH-1): this component renders rows exactly in the order received.
   */
  audits: DashboardAudit[];
};

const HEADER_CELL =
  "pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wide text-text-secondary";

const REAUDIT_LINK_CLASSES =
  "inline-flex rounded text-sm font-medium text-emerald-700 transition-colors " +
  "hover:text-emerald-800 hover:underline focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

const DETAIL_LINK_CLASSES =
  "inline-block max-w-full truncate align-middle text-text-primary transition-colors " +
  "hover:text-emerald-700 hover:underline focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

/**
 * History table (DSH-1/DSH-3/DSH-7, design U4/U1): URL, GEO score (mono),
 * band badge, es-AR date and a per-row re-audit link that reuses the landing
 * audit flow (`/report?url=<encoded>`). Since U1, each row's URL links to its
 * detail page (`/dashboard/audits/[id]`, DSH-7). Pure presentation, fully
 * fixture-testable.
 */
export function AuditHistoryTable({ audits }: AuditHistoryTableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th scope="col" className={HEADER_CELL}>
            URL
          </th>
          <th scope="col" className={HEADER_CELL}>
            GEO Score
          </th>
          <th scope="col" className={HEADER_CELL}>
            Banda
          </th>
          <th scope="col" className={HEADER_CELL}>
            Fecha
          </th>
          <th scope="col" className="pb-2 pl-4 text-right">
            <span className="sr-only">Re-auditar</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {audits.map((audit) => (
          <tr key={audit.id}>
            <td
              className="max-w-[20rem] truncate py-3 pr-4 text-text-primary"
              title={audit.url}
            >
              <a
                href={`/dashboard/audits/${audit.id}`}
                className={DETAIL_LINK_CLASSES}
              >
                {audit.url}
              </a>
            </td>
            <td className="py-3 pr-4 font-mono font-medium text-navy">
              {audit.geoScore}
            </td>
            <td className="py-3 pr-4">
              <SeverityBadge band={audit.severityBand} />
            </td>
            <td className="whitespace-nowrap py-3 pr-4 text-text-secondary">
              {formatAuditDate(audit.createdAt.getTime())}
            </td>
            <td className="py-3 pl-4 text-right">
              <a
                href={`/report?url=${encodeURIComponent(audit.url)}`}
                className={REAUDIT_LINK_CLASSES}
              >
                Re-auditar
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
