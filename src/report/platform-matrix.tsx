import type { AuditResult } from "@/lib/contracts/audit-result";

/**
 * Platform matrix (ADP-6, design PlatformMatrix). Both the pure derivation
 * (`buildPlatformRows`, no React — fully unit-testable) and the presentational
 * `<PlatformMatrix>` component live here, in ONE file, so the module path
 * `@/report/platform-matrix` is unambiguous.
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
  allowed: "Permitido",
  blocked: "Bloqueado",
  unknown: "Desconocido",
};

/** Badge styling per bot state (emerald / red / muted). */
const ACCESS_BADGE: Record<CrawlerAccess, string> = {
  allowed: "bg-emerald/10 text-emerald-700",
  blocked: "bg-red/10 text-red-700",
  unknown: "bg-surface-muted text-text-secondary",
};

/**
 * PlatformMatrix (ADP-6): the six-platform readiness matrix derived from the
 * REAL `platform.perPlatform` + `crawlers.perBot` (never a mock shape). Claude
 * has no `perPlatform` measurement → its readiness renders "No medido". Pure
 * SSR Server Component.
 */
export function PlatformMatrix({ result }: { result: AuditResult }) {
  const rows = buildPlatformRows(
    result.platform.perPlatform,
    result.crawlers.perBot,
  );

  return (
    <section aria-label="Matriz de plataformas de IA" className="w-full">
      <h2 className="font-display text-2xl tracking-tight text-navy">
        Visibilidad por plataforma de IA
      </h2>
      <div className="mt-4 overflow-x-auto rounded-md border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
              <th scope="col" className="px-4 py-3">
                Plataforma
              </th>
              <th scope="col" className="px-4 py-3">
                Bot
              </th>
              <th scope="col" className="px-4 py-3">
                Acceso
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Readiness
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="align-middle">
                <td className="px-4 py-3 font-medium text-text-primary">
                  {row.name}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                  {row.bot}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ACCESS_BADGE[row.access]}`}
                  >
                    {ACCESS_LABEL[row.access]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium text-navy">
                  {row.readiness === null ? (
                    <span className="text-text-secondary">No medido</span>
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
