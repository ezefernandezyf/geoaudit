import type { MultiPageResult } from "@/lib/contracts/audit-result";
import { ScoreHero } from "@/report/score-hero";
import { formatDurationMs } from "@/report/format";
import { ScoreBar } from "@/ui/score-bar";
import { SeverityBadge } from "@/ui/severity-badge";

/**
 * Multi-page report (U3, U4.4 / MPA-10). Renders a persisted multi-page audit
 * from the master `Audit.result` light shape (`multiPageResultSchema`): the
 * aggregate hero (ScoreHero over the light aggregate — its shape is the
 * summary shape) plus one row per audited page: url + ScoreBar + GEO Score +
 * severity band + duration. Per-page rows reuse the same ScoreBar / SeverityBadge
 * primitives as the single-page report (MPA-10).
 *
 * Pure SSR Server Component (no `"use client"`), like `<AuditReport>`: it
 * takes the persisted `MultiPageResult` object and never runs an audit. The
 * detail page discriminates single vs multi-page audits and renders this for
 * the latter.
 */
export function MultiPageReport({ result }: { result: MultiPageResult }) {
  return (
    <section
      aria-label="Reporte de auditoría multi-página"
      className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16"
    >
      <ScoreHero summary={result.aggregate} />
      <section aria-label="Páginas analizadas" className="flex flex-col gap-4">
        <h2 className="font-display text-2xl tracking-tight text-navy">
          Páginas analizadas
        </h2>
        <ul className="flex flex-col gap-3">
          {result.pages.map((page) => (
            <li
              key={page.url}
              className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="break-all text-sm text-text-primary">
                  {page.url}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-text-primary">
                    {page.geoScore}/100
                  </span>
                  <SeverityBadge band={page.severityBand} />
                </span>
              </div>
              <ScoreBar score={page.geoScore} />
              <span className="text-xs text-text-secondary">
                Duración: {formatDurationMs(page.durationMs)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
