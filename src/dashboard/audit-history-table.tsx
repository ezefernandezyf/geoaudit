"use client";

import { useState } from "react";
import type { DashboardAudit } from "@/dashboard/types";
import { formatAuditDate } from "@/report/format";
import { SeverityBadge } from "@/ui/severity-badge";

type AuditHistoryTableProps = {
  /**
   * Audits to list. The RSC owns the ordering (Prisma `orderBy createdAt
   * desc`, DSH-1): this component renders rows exactly in the order received
   * (newest first) and filters them client-side by URL substring (DSH-9).
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
 * History table (DSH-1/DSH-3/DSH-7/DSH-9, design U3): URL, GEO score (mono),
 * band badge, es-AR date and a per-row re-audit link that reuses the landing
 * audit flow (`/report?url=<encoded>`). Each row's URL links to its detail
 * page (`/dashboard/audits/[id]`, DSH-7). Rows are restyled with sparse (not
 * zebra) dividers.
 *
 * Since U3.9 the table is a client component: a search input filters rows by
 * URL substring on the client (DSH-9). The RSC still owns ordering.
 */
export function AuditHistoryTable({ audits }: AuditHistoryTableProps) {
  const [query, setQuery] = useState("");

  const normalized = query.trim().toLowerCase();
  const visible = normalized
    ? audits.filter((audit) => audit.url.toLowerCase().includes(normalized))
    : audits;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <input
          type="search"
          aria-label="Filtrar por URL"
          placeholder="Filtrar por URL…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-sm text-text-secondary">
          No se encontraron auditorías que coincidan con{" "}
          <span className="font-mono">{query.trim()}</span>.
        </p>
      ) : (
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
            {visible.map((audit) => (
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
      )}
    </div>
  );
}
