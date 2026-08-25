import { Check } from "lucide-react";
import { REPORT_COPY } from "@/lib/copy";
import type { GeminiView } from "@/report/presenters/types";

/**
 * Platform matrix (U5.7, ARU-12, design U5). The pure derivation
 * (`buildPlatformRows`, no React — fully unit-testable) lives here; the
 * presentational `<PlatformMatrix>` component is a pure presenter of the
 * Gemini view model (`view.platforms`).
 *
 * Rows derive from the REAL contract shapes — never a mock:
 * - `platform.perPlatform` (5 ids: aio/chatgpt/perplexity/gemini/copilot) →
 *   each platform's readiness score.
 * - `crawlers.perBot` access map → each platform's bot access state.
 *
 * Claude has no `perPlatform` id (the engine does not measure it), so its
 * readiness is `null` → the UI renders "No medido"; its access still comes
 * from `perBot["Claude-Web"]`.
 */

/** Bot access state from `crawlers.perBot` (contract enum). */
export type CrawlerAccess = "allowed" | "blocked" | "unknown";

/** A single matrix row: platform name, its crawler bot and measured state. */
export type PlatformRow = {
  /** Stable id for React keys. */
  id: string;
  /** Display name (Spanish UI). */
  name: string;
  /** Crawler bot identifier (mono, e.g. GPTBot / Claude-Web). */
  bot: string;
  /** Readiness score 0-100 from perPlatform, or null when not measured. */
  readiness: number | null;
  /** Bot access from crawlers.perBot. */
  access: CrawlerAccess;
};

/** Platform → bot mapping (design PLATFORM_ROWS). `platformKey` null = Claude. */
const PLATFORM_ROWS = [
  { id: "chatgpt", name: "ChatGPT", bot: "GPTBot", platformKey: "chatgpt" },
  { id: "claude", name: "Claude", bot: "Claude-Web", platformKey: null },
  {
    id: "perplexity",
    name: "Perplexity",
    bot: "PerplexityBot",
    platformKey: "perplexity",
  },
  {
    id: "gemini",
    name: "Gemini",
    bot: "Google-Extended",
    platformKey: "gemini",
  },
  {
    id: "aio",
    name: "Google AI Overviews",
    bot: "Googlebot",
    platformKey: "aio",
  },
  {
    id: "copilot",
    name: "Bing Copilot",
    bot: "Bingbot",
    platformKey: "copilot",
  },
] as const;

/** Reads the numeric 0-100 `score` from a contract `unknown` perPlatform entry. */
function readScore(value: unknown): number | null {
  if (value === null || typeof value !== "object") return null;
  const { score } = value as { score?: unknown };
  return typeof score === "number" && score >= 0 && score <= 100 ? score : null;
}

/**
 * Builds the six matrix rows. `perPlatform` maps to readiness; `perBot` maps
 * to access. A platform without a `perPlatform` entry (Claude) yields
 * `readiness: null`.
 */
export function buildPlatformRows(
  perPlatform: Record<string, unknown>,
  perBot: Record<string, CrawlerAccess>,
): PlatformRow[] {
  return PLATFORM_ROWS.map((row) => {
    const readiness =
      row.platformKey === null ? null : readScore(perPlatform[row.platformKey]);
    return {
      id: row.id,
      name: row.name,
      bot: row.bot,
      readiness,
      access: perBot[row.bot] ?? "unknown",
    };
  });
}

/** Spanish access label per bot state. */
const ACCESS_LABEL: Record<CrawlerAccess, string> = {
  allowed: REPORT_COPY.matrix.access.allowed,
  blocked: REPORT_COPY.matrix.access.blocked,
  unknown: REPORT_COPY.matrix.access.unknown,
};

/** Badge styling per bot state (emerald / red / muted — Gemini hex). */
const ACCESS_BADGE: Record<CrawlerAccess, string> = {
  allowed: "text-emerald-800 bg-emerald-50 border border-emerald-200",
  blocked: "text-red-700 bg-red-50 border border-red-200",
  unknown: "text-[#64748b] bg-[#f8fafc] border border-[#e2e8f0]",
};

/**
 * PlatformMatrix (ARU-12): the six-platform readiness matrix as a pure
 * presenter of `view.platforms` (built by `buildPlatformRows` inside the
 * adapter). Claude has no `perPlatform` measurement → its readiness renders
 * "No medido". Gemini AuditDetailPage table composition verbatim with the
 * HONEST columns the view model actually carries (Plataforma / Bot /
 * Acceso / Readiness — no fabricated citation-rate or last-crawled, APT-10).
 * Pure SSR Server Component.
 */
export function PlatformMatrix({ view }: { view: GeminiView }) {
  return (
    <section
      aria-label="Matriz de plataformas de IA"
      className="rounded-xl border border-[#e2e8f0] bg-white p-6"
    >
      <div className="mb-4">
        <h2 className="font-serif text-2xl font-normal text-[#0f172a]">
          {REPORT_COPY.matrix.title}
        </h2>
        <p className="text-xs text-[#64748b]">{REPORT_COPY.matrix.subtitle}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-sans text-xs">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
              <th className="px-4 py-3">Plataforma</th>
              <th className="px-4 py-3">Bot / User-Agent</th>
              <th className="px-4 py-3">Acceso robots.txt</th>
              <th className="px-4 py-3">Readiness</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {view.platforms.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-[#f8fafc]">
                <td className="px-4 py-3 font-medium text-[#0f172a]">
                  {row.name}
                </td>
                <td className="px-4 py-3 font-mono text-[#64748b]">
                  {row.bot}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ACCESS_BADGE[row.access]}`}
                  >
                    {row.access === "allowed" ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : null}
                    {ACCESS_LABEL[row.access]}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-[#0f172a]">
                  {row.readiness === null ? (
                    <span className="font-sans font-normal text-[#94a3b8]">
                      {REPORT_COPY.matrix.notMeasured}
                    </span>
                  ) : (
                    `${row.readiness}`
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
