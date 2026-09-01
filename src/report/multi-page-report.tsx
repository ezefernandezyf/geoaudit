"use client";

import { useState } from "react";
import { ChevronRight, Clock } from "lucide-react";
import type { MultiPageResult } from "@/lib/contracts/audit-result";
import { ScoreHero, type ScoreHeroView } from "@/report/score-hero";
import { DomainScorecard } from "@/report/domain-scorecard";
import { PlatformMatrix } from "@/report/platform-matrix";
import { TopFindings } from "@/report/top-findings";
import type { GeminiView } from "@/report/presenters/types";
import { formatDurationMs } from "@/report/format";
import { SeverityBadge, type GeminiBand } from "@/ui/severity-badge";
import { MULTIPAGE_COPY } from "@/lib/copy";

/**
 * Multi-page report presenter (U6.3, MPA-10/11, design U6). Gemini
 * `MultiPageReportPage` verbatim composition over the REAL `MultiPageResult`
 * light shape: an aggregate ScoreHero + a selectable route selector + a per-page
 * inspector.
 *
 * Data honesty (MPA-11/MPU-5): the light shape only carries url/geoScore/
 * severityBand/durationMs per page - so each row derives its GEO score from
 * `geoScore`, its duration from `durationMs` and OMITS the metrics the engine
 * does not produce (`schemaFound`, `crawlTimeMs`, `status`). No fabricated
 * values. Pure presenter - never runs an audit; the `selected` page is client
 * state only.
 *
 * Full mode (A3, MPU-7/9): when the caller supplies `pageViews` - the full
 * `GeminiView` per page, resolved SERVER-side from the persisted `AuditPage`
 * rows (via `toGeminiViewModel`) - the inspector renders the page's COMPLETE
 * report (ScoreHero + DomainScorecard + PlatformMatrix + TopFindings) of the
 * selected view. The selector (MPU-9) alternates between full reports. The
 * light `MultiPageResult` shape is never enriched: the detail comes from
 * `pageViews`, not from `result.pages`.
 *
 * Client component (`"use client"`): the route selector + inspector needs
 * selection state (Gemini uses `useState`). Rendered by the audit detail page,
 * the share page and the `/multipage` page.
 */

/** Derives the Gemini-style route path from an audited URL; "/" on any failure. */
function routePath(url: string): string {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return "/";
  }
}

/** Honest ScoreHeroView from the light aggregate (U5.8 ScoreHero props). */
function aggregateHeroView(
  aggregate: MultiPageResult["aggregate"],
): ScoreHeroView {
  const domain = new URL(aggregate.url).hostname;
  const totalScore = Math.round(aggregate.geoScore);
  const band = aggregate.severityBand.toLowerCase() as GeminiBand;
  const durationSeconds = Math.max(1, Math.round(aggregate.durationMs / 1000));
  return {
    totalScore,
    band,
    domain,
    title: domain,
    summary: `${domain} - GEO Score ${totalScore} (${band}) en ~${durationSeconds}s`,
    durationSeconds,
    auditDate: null,
  };
}

export function MultiPageReport({
  result,
  pageViews,
}: {
  result: MultiPageResult;
  /**
   * Full per-page views (A3, MPU-7) - resolved SERVER-side from the persisted
   * `AuditPage` rows via `toGeminiViewModel`. When present, the inspector
   * renders the selected page's complete report; when absent, the light-shape
   * inspector renders (share/multipage pages keep the light view).
   */
  pageViews?: { url: string; view: GeminiView }[];
}) {
  const pages = result.pages;
  const [selectedPath, setSelectedPath] = useState<string>(pages[0]?.url ?? "");
  const selected = pages.find((p) => p.url === selectedPath) ?? pages[0];
  const selectedView = pageViews?.find((v) => v.url === selected?.url)?.view;
  const fullMode = pageViews !== undefined;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      {/* Header info (Gemini MultiPageReportPage verbatim) */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-medium uppercase tracking-widest text-[#64748b]">
              {MULTIPAGE_COPY.header.eyebrow}
            </span>
            <span className="rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-800">
              {pages.length} URLs auditadas
            </span>
          </div>
          <h1 className="mt-1 font-serif text-3xl font-normal text-[#0f172a] sm:text-4xl">
            {new URL(result.aggregate.url).hostname} - Desglose por Ruta
          </h1>
        </div>
      </div>

      {/* 1. Aggregate score hero */}
      <ScoreHero view={aggregateHeroView(result.aggregate)} />

      {/* 2. Route selector */}
      <section
        aria-label={MULTIPAGE_COPY.results.selectorTitle}
        className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white"
      >
        <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-[#f8fafc] p-5">
          <div>
            <h2 className="font-serif text-xl font-normal text-[#0f172a]">
              {MULTIPAGE_COPY.results.selectorTitle}
            </h2>
            <p className="text-xs text-[#64748b]">
              {MULTIPAGE_COPY.results.selectorSubtitle}
            </p>
          </div>
          <span className="font-mono text-xs text-[#64748b]">
            Total: {pages.length} {MULTIPAGE_COPY.results.totalLabel}
          </span>
        </div>

        <div className="divide-y divide-[#e2e8f0]">
          {pages.map((page) => {
            const isSelected = page.url === selected?.url;
            return (
              <button
                key={page.url}
                type="button"
                onClick={() => setSelectedPath(page.url)}
                aria-pressed={isSelected}
                className={`flex w-full flex-col items-stretch justify-between gap-4 p-4 text-left transition-colors sm:flex-row sm:items-center sm:p-5 ${
                  isSelected
                    ? "border-l-4 border-l-emerald-600 bg-emerald-50/40"
                    : "border-l-4 border-l-transparent hover:bg-[#f8fafc]"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-[#e2e8f0] bg-white">
                    <span className="font-serif text-xl font-normal leading-none text-[#0f172a]">
                      {Math.round(page.geoScore)}
                    </span>
                    <span className="font-mono text-[9px] text-[#94a3b8]">
                      /100
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-[#0f172a]">
                        {routePath(page.url)}
                      </span>
                      <SeverityBadge
                        band={page.severityBand.toLowerCase() as GeminiBand}
                        size="sm"
                      />
                    </div>
                    <p className="mt-0.5 max-w-sm truncate font-mono text-xs text-[#64748b]">
                      {page.url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end text-xs sm:self-center">
                  <div className="text-right">
                    <p className="text-[#64748b]">
                      {MULTIPAGE_COPY.results.scoreLabel}
                    </p>
                    <p className="font-mono font-bold text-[#0f172a]">
                      {Math.round(page.geoScore)}/100
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[#64748b]">
                      {MULTIPAGE_COPY.results.durationLabel}
                    </p>
                    <p className="font-mono text-[#475569]">
                      {formatDurationMs(page.durationMs)}
                    </p>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 text-[#94a3b8] transition-transform ${
                      isSelected ? "rotate-90 text-emerald-700" : ""
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Per-page inspector */}
      {selected ? (
        <section
          aria-label={MULTIPAGE_COPY.results.inspectorLabel}
          className="animate-in space-y-4 rounded-xl border border-[#e2e8f0] bg-white p-6 fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
            <div>
              <span className="font-mono text-xs text-[#64748b]">
                {MULTIPAGE_COPY.results.inspectorLabel}
              </span>
              <h2 className="font-serif text-2xl font-normal text-[#0f172a]">
                {routePath(selected.url)}
              </h2>
            </div>
            <SeverityBadge
              band={selected.severityBand.toLowerCase() as GeminiBand}
              size="md"
            />
          </div>

          {fullMode && selectedView ? (
            /* Full report of the selected page (A3, MPU-7): the SERVER-resolved
               GeminiView renders the complete report - the light shape is never
               enriched. The selector above (MPU-9) alternates between views. */
            <div className="space-y-8 pt-2">
              <ScoreHero view={selectedView} />
              <DomainScorecard view={selectedView} />
              <PlatformMatrix view={selectedView} />
              <TopFindings view={selectedView} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
              <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <span className="text-xs text-[#64748b]">
                  {MULTIPAGE_COPY.results.scoreLabel}
                </span>
                <p className="mt-1 font-serif text-3xl text-[#0f172a]">
                  {Math.round(selected.geoScore)}/100
                </p>
              </div>
              <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <span className="text-xs text-[#64748b]">
                  {MULTIPAGE_COPY.results.durationLabel}
                </span>
                <p className="mt-1 flex items-center gap-1.5 font-mono text-2xl font-bold text-emerald-800">
                  <Clock className="h-5 w-5" aria-hidden="true" />
                  {formatDurationMs(selected.durationMs)}
                </p>
              </div>
              <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <span className="text-xs text-[#64748b]">URL</span>
                <p className="mt-2 break-all font-sans text-sm font-semibold text-[#0f172a]">
                  {selected.url}
                </p>
              </div>
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
