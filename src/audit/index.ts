import type { AuditResult } from "@/lib/contracts/audit-result";
import type { FetchResult, RobotsTxt } from "@/lib/contracts/fetch-types";
import { urlInputSchema } from "@/lib/contracts/url-input";
import {
  fetchAuditResource,
  PAGE_TIMEOUT_MS,
  PROBE_TIMEOUT_MS,
} from "@/lib/fetch/index";
import type { FetchImpl } from "@/lib/fetch/redirect";
import type { LookupFn } from "@/lib/fetch/ssrf";
import {
  parseRobotsTxt,
  scoreAccess,
  toContractResult as crawlerToContract,
} from "@/crawlers/index";
import {
  scorePage,
  toContractResult as citabilityToContract,
} from "@/citability/index";
import { scoreEeat, toContractResult as eeatToContract } from "@/eeat/index";
import {
  scoreSchema,
  toContractResult as schemaToContract,
} from "@/schema/index";
import {
  scorePlatform,
  toContractResult as platformToContract,
} from "@/platform/index";
import { computeGeoScore, SPRINT_1_WEIGHTS } from "@/scoring/index";

/**
 * Audit orchestrator (T25) — the core product behavior. `runAudit(url)` runs
 * the whole pipeline: Zod-validate the URL (RAO-1), normalize http -> https,
 * parallel bounded fetches (RAO-2), a single shared Cheerio load passed to
 * every engine (RAO-3), all five engines (RAO-4..RAO-8), the weighted GEO
 * Score (RAO-9), and a fully typed `AuditResult` (RAO-10).
 *
 * Testability (RAO-11): `fetcher` and `lookup` are injectable so every fetch
 * and every DNS resolution can be mocked — zero network in tests. `now` makes
 * timing + freshness deterministic.
 *
 * Happy path only (part A): the page fetch is assumed to succeed; non-ok page
 * results throw here and the RAO-13 unsupported-content-type handling, RAO-12
 * per-engine isolation and the invalid-URL rejection surface land in part B.
 */

export const AUDIT_VERSION = "0.1.0";

/** P4/R5 decoded-body cap for the audited page (~5MB). */
export const PAGE_MAX_BYTES = 5 * 1024 * 1024;
/** Decoded-body cap for the robots.txt probe (small file). */
export const ROBOTS_MAX_BYTES = 512 * 1024;

export interface AuditDeps {
  /** Injectable fetch implementation (RAO-11); defaults to global fetch. */
  fetcher?: FetchImpl;
  /** Injectable DNS resolver for the SSRF guard; defaults to node:dns. */
  lookup?: LookupFn;
  /** Injectable clock (ms) used for timing and freshness; defaults to Date.now. */
  now?: () => number;
}

/** RCR-10: a missing/404/gated robots.txt means every bot is allowed. */
function emptyRobots(): RobotsTxt {
  return parseRobotsTxt("");
}

/** The two failure branches of the FetchResult union (typed for narrowing). */
type FailedFetch = Extract<FetchResult, { ok: false }>;

function describePageFailure(fetched: FailedFetch): string {
  if ("error" in fetched) {
    return `${fetched.error.code}: ${fetched.error.message}`;
  }
  return `unsupported_content_type (${fetched.contentType ?? "no content-type"})`;
}

export async function runAudit(
  url: string,
  deps: AuditDeps = {},
): Promise<AuditResult> {
  const clock = deps.now ?? Date.now;
  const startedAt = clock();

  // RAO-1: shared Zod contract. The invalid-URL rejection is surfaced as a
  // thrown ZodError here; part B (U8b) refines this into its own path.
  const input = urlInputSchema.safeParse({ url });
  if (!input.success) {
    throw input.error;
  }

  // RAO-1: normalize http -> https before any fetch (the fetch layer also
  // upgrades, but the summary reports the normalized URL we actually target).
  const target = new URL(input.data.url);
  if (target.protocol === "http:") {
    target.protocol = "https:";
  }
  const pageUrl = target.toString();
  const robotsUrl = new URL("/robots.txt", target).toString();
  const origin = target.origin;
  const pagePath = target.pathname;

  // RAO-2: parallel bounded fetches — page HTML + robots.txt. The fetch layer
  // never rejects (RFL-11), so Promise.allSettled results are always fulfilled.
  const [pageResult, robotsResult] = await Promise.allSettled([
    fetchAuditResource(pageUrl, {
      kind: "page",
      timeoutMs: PAGE_TIMEOUT_MS,
      maxBytes: PAGE_MAX_BYTES,
      fetcher: deps.fetcher,
      lookup: deps.lookup,
    }),
    fetchAuditResource(robotsUrl, {
      kind: "probe",
      timeoutMs: PROBE_TIMEOUT_MS,
      maxBytes: ROBOTS_MAX_BYTES,
      fetcher: deps.fetcher,
      lookup: deps.lookup,
    }),
  ]);

  const pageFetched =
    pageResult.status === "fulfilled" ? pageResult.value : null;
  if (pageFetched === null || !pageFetched.ok) {
    const reason =
      pageFetched === null
        ? "fetch rejected"
        : describePageFailure(pageFetched);
    throw new Error(`audit page fetch failed for ${pageUrl}: ${reason}`);
  }

  // RAO-3: single shared Cheerio load. The fetch layer already parsed the HTML
  // once and returns `parsed.$`; it is passed as-is to every engine — this
  // module never re-parses the HTML.
  const { $, html, headers } = pageFetched.parsed;

  // RAO-4 robots: parse when the probe succeeded; RCR-2/RCR-10 treat a missing
  // or 404 robots.txt as "all allowed" (empty RobotsTxt).
  const robotsFetched =
    robotsResult.status === "fulfilled" ? robotsResult.value : null;
  const robots =
    robotsFetched !== null && robotsFetched.ok
      ? parseRobotsTxt(robotsFetched.parsed.html)
      : emptyRobots();

  // RAO-4..RAO-8: run the five engines over the shared DOM. Engines are
  // documented to never throw; RAO-12 per-engine isolation lands in part B.
  const crawlerRich = scoreAccess(robots, headers, $, pagePath);
  const citabilityRich = scorePage($);
  const contentRich = scoreEeat($, { now: deps.now });
  const schemaRich = scoreSchema($);
  const platformRich = await scorePlatform(
    { $, html, headers, origin },
    { fetcher: deps.fetcher },
  );

  // RAO-9: composite the GEO Score. `platform` onPageScore decision: the Google
  // AI Overviews per-platform score represents the most representative AI-answer
  // surface and its rubric carries the most measured on-page criteria (70/100),
  // so the AIO score is wired as the platform dimension (RGS-2 composes the
  // technical dimension from crawler + platform from these values).
  const scored = computeGeoScore(
    {
      citability: citabilityRich.pageScore,
      eeat: contentRich.composite,
      schema: schemaRich.score,
      crawler: crawlerRich.compositeScore,
      platform: platformRich.perPlatform.platforms.aio.score,
    },
    SPRINT_1_WEIGHTS,
  );

  const completedAt = clock();

  // RAO-10: assemble the fully typed contract shape. `scored.scoringModelVersion`
  // is the SPRINT_1_WEIGHTS version string, which the contract pins to the
  // literal "1.0.0" (RAO-10 scenario) — narrowed here for the return type.
  const scoringModelVersion = scored.scoringModelVersion as "1.0.0";

  return {
    summary: {
      url: pageUrl,
      geoScore: scored.geoScore,
      severityBand: scored.severityBand,
      durationMs: completedAt - startedAt,
    },
    crawlers: crawlerToContract(crawlerRich),
    citability: citabilityToContract(citabilityRich),
    schema: schemaToContract(schemaRich),
    platform: platformToContract(platformRich),
    content: eeatToContract(contentRich),
    scoringModelVersion,
    meta: {
      auditVersion: AUDIT_VERSION,
      startedAt,
      completedAt,
      errors: [],
    },
  };
}
