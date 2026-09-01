import { load } from "cheerio";
import { runAudit, ROBOTS_MAX_BYTES, type AuditDeps } from "@/audit/index";
import type { AuditResult, SeverityBand } from "@/lib/contracts/audit-result";
import { urlInputSchema } from "@/lib/contracts/url-input";
import { fetchAuditResource, PROBE_TIMEOUT_MS } from "@/lib/fetch/index";
import { parseRobotsTxt } from "@/crawlers/index";
import { severityForScore } from "@/scoring/index";

/**
 * Multi-page audit engine (MPA-1..MPA-5, D3/D6) - the PRO-gated sitemap-driven
 * orchestrator. `runMultiPageAudit(url, deps)` discovers page URLs from the
 * sitemap (robots.txt `Sitemap:` first, `/sitemap.xml` fallback - MPA-4),
 * slices to the page cap (MPA-2), audits each URL by REUSING the single-page
 * `runAudit` (MPA-1/MPA-9) through a hand-rolled bounded worker (D6, MPA-3),
 * and returns one composite result: a light aggregate plus per-page results.
 *
 * Security (threat matrix): every sitemap hop passes the fetch layer's
 * `assertPublicHost` SSRF guard (RFL-2/3) - a robots.txt-declared sitemap
 * pointing at a private host is blocked before any request. The XML
 * content-type relaxation (MPA-5, D5) is scoped to the `"sitemap"` kind.
 *
 * Isolation (MPA-1): a failing page (runAudit throws on page-fetch errors) is
 * recorded with its error - `{ url, result: null, error }` - and the other
 * pages still complete. The aggregate is the mean of the SUCCESSFUL page
 * scores (0 / Critical when none succeeded). Failed pages carry no AuditResult,
 * so they are absent from the persisted master light shape (D3) - the
 * persistence layer keeps only auditable pages (see multi-page-persist.ts).
 */

/** One audited page: full AuditResult or the isolated error. */
export interface PerPageAudit {
  url: string;
  result: AuditResult | null;
  error: string | null;
}

/** Light aggregate of the successful pages (D3 master `result.aggregate`). */
export interface MultiPageAggregate {
  url: string;
  geoScore: number;
  severityBand: SeverityBand;
  durationMs: number;
}

/** Composite engine result - what the persistence layer and report consume. */
export interface MultiPageEngineResult {
  aggregate: MultiPageAggregate;
  pages: PerPageAudit[];
}

/**
 * Injectable deps: mirrors `AuditDeps` (fetcher/lookup/now/engines flow
 * through to each `runAudit` call, so tests mock zero network) plus the
 * orchestration knobs `concurrency` (MPA-3, default 3) and `maxPages`
 * (MPA-2, default 5).
 */
export interface MultiPageDeps extends AuditDeps {
  concurrency?: number;
  maxPages?: number;
}

/** Decoded-body cap for a sitemap document (larger than robots.txt). */
export const SITEMAP_MAX_BYTES = 2 * 1024 * 1024;

export const DEFAULT_CONCURRENCY = 3;
export const DEFAULT_MAX_PAGES = 5;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Extracts every <loc> URL from a sitemap XML document (cheerio xmlMode). */
export function extractSitemapUrls(xml: string): string[] {
  const $ = load(xml, { xmlMode: true });
  const urls: string[] = [];
  $("loc").each((_index, element) => {
    const text = $(element).text().trim();
    if (text.length > 0) urls.push(text);
  });
  return urls;
}

/**
 * MPA-4 sitemap discovery: robots.txt `Sitemap:` entry first; when absent (or
 * when the declared sitemap is unreachable/blocked/empty) the same-origin
 * `/sitemap.xml` is tried. Both fetches are SSRF-guarded per hop (RFL-2/3).
 */
async function discoverSitemapUrls(
  target: URL,
  deps: MultiPageDeps,
): Promise<string[]> {
  const robotsUrl = new URL("/robots.txt", target).toString();
  const robotsResult = await fetchAuditResource(robotsUrl, {
    kind: "probe",
    timeoutMs: PROBE_TIMEOUT_MS,
    maxBytes: ROBOTS_MAX_BYTES,
    fetcher: deps.fetcher,
    lookup: deps.lookup,
  });

  let declared: string | null = null;
  if (robotsResult.ok) {
    const robots = parseRobotsTxt(robotsResult.parsed.html);
    declared = robots.sitemaps[0] ?? null;
  }

  const fallback = new URL("/sitemap.xml", target).toString();
  const candidates = declared !== null ? [declared, fallback] : [fallback];

  for (const candidate of candidates) {
    const result = await fetchAuditResource(candidate, {
      kind: "sitemap",
      timeoutMs: PROBE_TIMEOUT_MS,
      maxBytes: SITEMAP_MAX_BYTES,
      fetcher: deps.fetcher,
      lookup: deps.lookup,
    });
    if (result.ok) {
      const urls = extractSitemapUrls(result.parsed.html);
      if (urls.length > 0) return urls;
    }
  }
  return [];
}

/**
 * Hand-rolled bounded worker (D6, MPA-3): at most `concurrency` audits run in
 * flight at any instant - never all pages in parallel. Each failure is
 * isolated into its `PerPageAudit.error` (MPA-1); the worker never throws.
 */
async function runBounded(
  urls: string[],
  concurrency: number,
  audit: (url: string) => Promise<AuditResult>,
): Promise<PerPageAudit[]> {
  const results: PerPageAudit[] = new Array(urls.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = next;
      next += 1;
      if (index >= urls.length) return;
      const url = urls[index];
      try {
        const result = await audit(url);
        results[index] = { url, result, error: null };
      } catch (error) {
        results[index] = { url, result: null, error: errorMessage(error) };
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, urls.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

/** Mean of the successful page scores, band-mapped; 0 / Critical when none. */
function computeAggregate(
  url: string,
  pages: PerPageAudit[],
  startedAt: number,
  completedAt: number,
): MultiPageAggregate {
  const scores = pages
    .filter(
      (page): page is PerPageAudit & { result: AuditResult } =>
        page.result !== null,
    )
    .map((page) => page.result.summary.geoScore);
  const geoScore =
    scores.length > 0
      ? Math.round(
          scores.reduce((sum, score) => sum + score, 0) / scores.length,
        )
      : 0;
  return {
    url,
    geoScore,
    severityBand: severityForScore(geoScore),
    durationMs: completedAt - startedAt,
  };
}

/**
 * MPA-1..MPA-5 entry point. Validates + normalizes the input URL (RAO-1
 * pattern: invalid input degrades to 0 / Critical, never throws), discovers
 * page URLs from the sitemap, audits them with bounded concurrency through
 * the single-page engine, and returns the composite result.
 */
export async function runMultiPageAudit(
  url: string,
  deps: MultiPageDeps = {},
): Promise<MultiPageEngineResult> {
  const clock = deps.now ?? Date.now;
  const startedAt = clock();

  const input = urlInputSchema.safeParse({ url });
  if (!input.success) {
    return {
      aggregate: {
        url,
        geoScore: 0,
        severityBand: "Critical",
        durationMs: clock() - startedAt,
      },
      pages: [],
    };
  }

  const target = new URL(input.data.url);
  if (target.protocol === "http:") target.protocol = "https:";

  const discovered = await discoverSitemapUrls(target, deps);
  const pageUrls = discovered.slice(0, deps.maxPages ?? DEFAULT_MAX_PAGES);
  const concurrency = Math.max(1, deps.concurrency ?? DEFAULT_CONCURRENCY);

  const pages = await runBounded(pageUrls, concurrency, (pageUrl) =>
    runAudit(pageUrl, deps),
  );

  return {
    aggregate: computeAggregate(target.toString(), pages, startedAt, clock()),
    pages,
  };
}
