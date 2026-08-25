"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Search } from "lucide-react";
import type { DashboardAudit } from "@/dashboard/types";
import { formatAuditDate } from "@/report/format";
import { DASHBOARD_COPY } from "@/lib/copy";
import { SeverityBadge, type GeminiBand } from "@/ui/severity-badge";

type AuditHistoryTableProps = {
  /**
   * Audits to list. The RSC owns the ordering (Prisma `orderBy createdAt
   * desc`, DSH-1): this component renders rows exactly in the order received
   * (newest first) and filters them client-side by URL substring (DSH-9).
   */
  audits: DashboardAudit[];
  /**
   * When true, renders a "SCANNING..." skeleton row at the end of the table
   * (DSH-11) — an in-flight audit the user just triggered from the runner bar.
   */
  isScanning?: boolean;
  /** URL to show in the scanning row (defaults to a neutral path). */
  scanningUrl?: string;
};

const DETAIL_LINK_CLASSES =
  "inline-block max-w-full truncate align-middle text-[#0f172a] font-sans transition-colors " +
  "hover:text-emerald-700 hover:underline focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-2";

/**
 * History table (DSH-1/3/7/9/10/11, design U4). Gemini verbatim composition:
 * a header bar (title + record count + refresh button), a client search filter,
 * and rows showing URL/domain (+ a "Multi-Page" chip on multi-page audits),
 * GEO score (mono), band badge and es-AR date, plus a per-row re-audit link.
 * While an audit is in flight a "SCANNING..." skeleton row renders (DSH-11).
 */
export function AuditHistoryTable({
  audits,
  isScanning = false,
  scanningUrl = "/investment/portfolios",
}: AuditHistoryTableProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { history } = DASHBOARD_COPY;

  const normalized = query.trim().toLowerCase();
  const visible = normalized
    ? audits.filter((audit) => audit.url.toLowerCase().includes(normalized))
    : audits;

  return (
    <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-xs">
      {/* Header bar (DSH-10): title + count + refresh. */}
      <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-[#f8fafc] px-6 py-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f172a]">
          {history.header}
        </h3>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-[#475569]">
            {history.showingCount} {visible.length} {history.records}
          </span>
          <button
            type="button"
            onClick={() => router.refresh()}
            aria-label="Refrescar historial"
            title="Refrescar historial"
            className="rounded p-1 text-[#94a3b8] transition-colors hover:bg-[#e2e8f0] hover:text-[#0f172a]"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Client search filter (DSH-9). */}
      <div className="border-b border-[#e2e8f0] px-6 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="search"
            aria-label="Filtrar por URL"
            placeholder="Filtrar por URL…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-md border border-[#e2e8f0] bg-white py-2 pl-9 pr-3 text-sm text-[#0f172a] placeholder-[#94a3b8] outline-none transition-colors focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/15"
          />
        </div>
      </div>

      {visible.length === 0 && !isScanning ? (
        <p className="px-6 py-6 text-sm text-[#64748b]">
          {history.emptySearch}{" "}
          <span className="font-mono">{query.trim()}</span>.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-[#e2e8f0] bg-white text-[10px] uppercase tracking-wider text-[#475569]">
              <tr>
                <th className="px-6 py-3.5 font-semibold">
                  {history.columns.resource}
                </th>
                <th className="px-6 py-3.5 font-semibold">
                  {history.columns.score}
                </th>
                <th className="px-6 py-3.5 font-semibold">
                  {history.columns.severity}
                </th>
                <th className="px-6 py-3.5 text-right font-semibold">
                  {history.columns.timestamp}
                </th>
                <th className="px-6 py-3.5">
                  <span className="sr-only">Re-auditar</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] text-sm font-sans">
              {visible.map((audit) => (
                <tr
                  key={audit.id}
                  className="border-b border-[#e2e8f0] transition-colors hover:bg-[#f8fafc]"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/dashboard/audits/${audit.id}`}
                        className={DETAIL_LINK_CLASSES}
                      >
                        {audit.url}
                      </a>
                      {audit.isMultiPage ? (
                        <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] text-blue-700">
                          Multi-Page
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm font-bold text-[#0f172a]">
                    {audit.geoScore}
                  </td>
                  <td className="px-6 py-4">
                    <SeverityBadge
                      band={audit.severityBand.toLowerCase() as GeminiBand}
                      size="sm"
                    />
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs text-[#475569]">
                    {formatAuditDate(audit.createdAt.getTime())}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={`/report?url=${encodeURIComponent(audit.url)}`}
                      className="inline-flex items-center gap-1.5 rounded p-1 text-[#94a3b8] transition-colors hover:text-[#0f172a]"
                      title="Re-auditar"
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="text-xs">Re-auditar</span>
                    </a>
                  </td>
                </tr>
              ))}

              {isScanning ? (
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] opacity-75">
                  <td className="px-6 py-4 font-medium text-[#0f172a]">
                    <span className="font-mono text-xs text-[#64748b]">
                      {scanningUrl}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[#cbd5e1]">--</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-[#cbd5e1]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#64748b]">
                      {history.scanning}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs text-[#cbd5e1]">
                    {history.inProgress}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
