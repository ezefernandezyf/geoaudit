import type { MultiPageResult } from "@/lib/contracts/audit-result";
import { ScoreHero, type ScoreHeroView } from "@/report/score-hero";
import { formatDurationMs } from "@/report/format";
import { ScoreBar, type ScoreCategory } from "@/ui/score-bar";
import { SeverityBadge, type GeminiBand } from "@/ui/severity-badge";

/**
 * Multi-page report (U3, U4.4 / MPA-10). Renders a persisted multi-page audit
 * from the master `Audit.result` light shape (`multiPageResultSchema`): the
 * aggregate hero (ScoreHero over the light aggregate — its shape is the
 * summary shape) plus one row per audited page: url + ScoreBar + GEO Score +
 * severity band + duration. Per-page rows reuse the same ScoreBar / SeverityBadge
 * primitives as the single-page report (MPA-10).
 *
 * U5.8: the hero now consumes a `ScoreHeroView` built from the light
 * aggregate (honest 1:1 mapping — the light shape carries url/geoScore/
 * severityBand/durationMs only, so categoryScores/findings/platforms are not
 * fabricated here; U6 owns the full multi-page view model).
 *
 * Pure SSR Server Component (no `"use client"`), like `<AuditReport>`: it
 * takes the persisted `MultiPageResult` object and never runs an audit. The
 * detail page discriminates single vs multi-page audits and renders this for
 * the latter.
 */

/** Hostname of an audited URL; empty string on any parse failure. */
function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

/** Honest ScoreHeroView from the light aggregate (U5.8 ScoreHero props). */
function aggregateHeroView(
  aggregate: MultiPageResult["aggregate"],
): ScoreHeroView {
  const domain = extractHostname(aggregate.url);
  const totalScore = Math.round(aggregate.geoScore);
  const band = aggregate.severityBand.toLowerCase() as GeminiBand;
  const durationSeconds = Math.max(1, Math.round(aggregate.durationMs / 1000));
  return {
    totalScore,
    band,
    domain,
    title: domain,
    summary: `${domain} — GEO Score ${totalScore} (${band}) en ~${durationSeconds}s`,
    durationSeconds,
    auditDate: null,
  };
}

export function MultiPageReport({ result }: { result: MultiPageResult }) {
  return (
    <section
      aria-label="Reporte de auditoría multi-página"
      className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16"
    >
      <ScoreHero view={aggregateHeroView(result.aggregate)} />
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
                  <SeverityBadge
                    band={page.severityBand.toLowerCase() as GeminiBand}
                  />
                </span>
              </div>
              <ScoreBar
                category={
                  {
                    id: page.url,
                    score: page.geoScore,
                    maxScore: 100,
                    status: page.severityBand.toLowerCase() as GeminiBand,
                  } satisfies ScoreCategory
                }
              />
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
