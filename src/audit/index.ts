import { load } from "cheerio";
import type {
  AuditResult,
  CitabilityResult,
  ContentResult,
  CrawlerResult,
  PlatformResult,
  SchemaResult,
} from "@/lib/contracts/audit-result";
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
import type { CrawlerAccessResult } from "@/crawlers/types";
import {
  scorePage,
  toContractResult as citabilityToContract,
  type CitabilityPageResult,
} from "@/citability/index";
import { scoreEeat, toContractResult as eeatToContract } from "@/eeat/index";
import type { EeatResult } from "@/eeat/types";
import {
  scoreSchema,
  toContractResult as schemaToContract,
} from "@/schema/index";
import type { SchemaEngineResult } from "@/schema/types";
import {
  scorePlatform,
  toContractResult as platformToContract,
} from "@/platform/index";
import type { PlatformEngineResult } from "@/platform/types";
import { applyBrandCriteria } from "@/platform/per-platform";
import {
  scoreBrand,
  toContractResult as brandToContract,
  emptyBrandResult,
} from "@/brand/index";
import type { BrandEngineResult } from "@/brand/types";
import {
  computeGeoScore,
  GEO_SCORE_V3_WEIGHTS,
  type DimensionKey,
} from "@/scoring/index";

/**
 * Audit orchestrator (T25) - the core product behavior. `runAudit(url)` runs
 * the whole pipeline: Zod-validate the URL (RAO-1), normalize http -> https,
 * parallel bounded fetches (RAO-2), a single shared Cheerio load passed to
 * every content engine (RAO-3), all six engines (RAO-4..RAO-8 + RAO-15), the
 * weighted GEO Score (RAO-9), and a fully typed `AuditResult` (RAO-10).
 *
 * Testability (RAO-11): `fetcher`, `lookup`, `now` and every engine entry
 * point are injectable so each fetch, DNS resolution, timing and engine can
 * be mocked - zero network in tests.
 *
 * Edge cases (part B):
 * - RAO-1: an invalid URL returns a degraded AuditResult (score 0 / Critical,
 *   the Zod failure in `meta.errors`) - never a throw, never a fetch.
 * - RAO-12: every engine is wrapped in try/catch; a throwing engine degrades
 *   only its section (zeroed contract shape) and is recorded in `meta.errors`,
 *   while the other engines and the GEO Score (weight-rebalanced, RGS-9)
 *   still complete - never rethrown.
 * - RAO-13: a non-HTML page (`unsupported_content_type`) skips the HTML parse
 *   and the four content engines report unsupported (zeroed sections + shared
 *   reason in `meta.errors`), while the crawler and brand engines still run.
 * - RAO-15: the brand engine runs on every audit (anonymous included) with the
 *   audited domain, never the DOM; a failure degrades to `emptyBrandResult`
 *   and is recorded as `brand: {reason}` in `meta.errors`.
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
  /** Engine overrides (RAO-12 isolation tests); default to the real engines. */
  scoreAccess?: typeof scoreAccess;
  scorePage?: typeof scorePage;
  scoreEeat?: typeof scoreEeat;
  scoreSchema?: typeof scoreSchema;
  scorePlatform?: typeof scorePlatform;
  scoreBrand?: typeof scoreBrand;
}

/** The six engines run by the orchestrator, keyed by their AuditResult section. */
type EngineName =
  "crawler" | "citability" | "content" | "schema" | "platform" | "brand";

/** Rich engine results keyed by engine; a missing key means that engine failed. */
interface EngineRun {
  crawler?: CrawlerAccessResult;
  citability?: CitabilityPageResult;
  content?: EeatResult;
  schema?: SchemaEngineResult;
  platform?: PlatformEngineResult;
  brand?: BrandEngineResult;
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Zeroed contract shapes for a degraded engine section (RAO-12 failure or
 * RAO-13 unsupported). The shared AuditResult contract has no per-engine
 * status/reason field (its sections only carry numeric scores and lists), so
 * a degraded engine is represented as an empty/zeroed contract section PLUS a
 * `meta.errors` entry with the reason - the composite GEO Score excludes the
 * degraded dimension and rebalances weights (RGS-9).
 */
function emptyCrawlerResult(): CrawlerResult {
  return { compositeScore: 0, perBot: {} };
}

function emptyCitabilityResult(): CitabilityResult {
  return { pageScore: 0, coverage: 0, top3: [], bottom3: [], suggestions: [] };
}

function emptySchemaResult(): SchemaResult {
  return {
    detected: [],
    issues: [],
    generated: null,
    businessType: "hybrid",
    // RSC-14: degraded engine path defaults to 0, never a reconstructed proxy.
    score: 0,
  };
}

function emptyPlatformResult(): PlatformResult {
  return {
    headers: [],
    meta: {},
    og: {},
    twitter: {},
    ssr: {},
    probes: {},
    perPlatform: {},
  };
}

function emptyContentResult(): ContentResult {
  return {
    experience: 0,
    expertise: 0,
    authoritativeness: 0,
    trustworthiness: 0,
    composite: 0,
    wordCount: 0,
    headings: 0,
    freshness: {},
    topicalAuthority: "not_measured",
  };
}

export async function runAudit(
  url: string,
  deps: AuditDeps = {},
): Promise<AuditResult> {
  const clock = deps.now ?? Date.now;
  const startedAt = clock();

  const scoreAccessEngine = deps.scoreAccess ?? scoreAccess;
  const scorePageEngine = deps.scorePage ?? scorePage;
  const scoreEeatEngine = deps.scoreEeat ?? scoreEeat;
  const scoreSchemaEngine = deps.scoreSchema ?? scoreSchema;
  const scorePlatformEngine = deps.scorePlatform ?? scorePlatform;
  const scoreBrandEngine = deps.scoreBrand ?? scoreBrand;

  // RAO-1: shared Zod contract. Part B decision: an invalid URL is NOT thrown.
  // The orchestrator returns a degraded AuditResult (score 0 / Critical) with
  // the validation failure in meta.errors, and NO fetch or engine work starts.
  // `summary.url` keeps the raw input; a failed audit has no canonical URL, so
  // this degraded result is intentionally not Zod-valid - consumers detect the
  // failure via meta.errors + the Critical band instead.
  const input = urlInputSchema.safeParse({ url });
  if (!input.success) {
    const message = input.error.issues[0]?.message ?? "Invalid URL format";
    const completedAt = clock();
    return {
      summary: {
        url,
        geoScore: 0,
        severityBand: "Critical",
        durationMs: completedAt - startedAt,
      },
      crawlers: emptyCrawlerResult(),
      citability: emptyCitabilityResult(),
      schema: emptySchemaResult(),
      platform: emptyPlatformResult(),
      content: emptyContentResult(),
      scoringModelVersion: "2.0.0",
      meta: {
        auditVersion: AUDIT_VERSION,
        startedAt,
        completedAt,
        errors: [`invalid URL (${url}): ${message}`],
      },
    };
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

  // RAO-2: parallel bounded fetches - page HTML + robots.txt. The fetch layer
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

  // RAO-13: a non-HTML page (Content-Type gated as unsupported_content_type by
  // the fetch layer, RFL-8) skips the HTML parse and the four content engines
  // report unsupported, while the crawler engine still runs (robots.txt is
  // independent of the page). Other page failures keep the part-A throw.
  if (
    pageFetched !== null &&
    !pageFetched.ok &&
    "reason" in pageFetched &&
    pageFetched.reason === "unsupported_content_type"
  ) {
    return auditUnsupportedPage({
      pageUrl,
      pagePath,
      robotsResult,
      scoreAccessEngine,
      scoreBrandEngine,
      brandDeps: { fetcher: deps.fetcher, lookup: deps.lookup },
      startedAt,
      clock,
    });
  }
  if (pageFetched === null || !pageFetched.ok) {
    const reason =
      pageFetched === null
        ? "fetch rejected"
        : describePageFailure(pageFetched);
    throw new Error(`audit page fetch failed for ${pageUrl}: ${reason}`);
  }

  // RAO-3: single shared Cheerio load. The fetch layer already parsed the HTML
  // once and returns `parsed.$`; it is passed as-is to every engine - this
  // module never re-parses the HTML.
  const { $, html, headers } = pageFetched.parsed;

  // RAO-4 robots: parse when the probe succeeded; RCR-2/RCR-10 treat a missing
  // or 404 robots.txt as "all allowed" (empty RobotsTxt). DECISION (documented):
  // a gated robots.txt - the fetch layer only accepts text/html (RFL-8) while
  // real robots.txt is text/plain - also flows through this missing path.
  const robotsFetched =
    robotsResult.status === "fulfilled" ? robotsResult.value : null;
  const robots =
    robotsFetched !== null && robotsFetched.ok
      ? parseRobotsTxt(robotsFetched.parsed.html)
      : emptyRobots();

  // RAO-12: run the five engines with per-engine failure isolation. A throwing
  // engine degrades only its section (recorded below) - the audit completes,
  // the other engines produce results, and the GEO Score rebalances weights
  // over the available engines (RGS-9). The failure is NEVER rethrown.
  const engineFailures: Partial<Record<EngineName, string>> = {};
  const engines: EngineRun = {};

  try {
    engines.crawler = scoreAccessEngine(robots, headers, $, pagePath);
  } catch (error) {
    engineFailures.crawler = errorMessage(error);
  }
  try {
    engines.citability = scorePageEngine($);
  } catch (error) {
    engineFailures.citability = errorMessage(error);
  }
  try {
    engines.content = scoreEeatEngine($, { now: deps.now });
  } catch (error) {
    engineFailures.content = errorMessage(error);
  }
  try {
    engines.schema = scoreSchemaEngine($);
  } catch (error) {
    engineFailures.schema = errorMessage(error);
  }
  try {
    engines.platform = await scorePlatformEngine(
      { $, html, headers, origin },
      { fetcher: deps.fetcher },
    );
  } catch (error) {
    engineFailures.platform = errorMessage(error);
  }
  // RAO-3/RAO-15: the brand engine consumes the audited DOMAIN, never the
  // shared DOM. BRA-7 guarantees it never throws (probe failures return a
  // typed error result), but the try/catch still isolates unexpected bugs
  // (RAO-12) - a throwing brand degrades exactly like a probe failure.
  try {
    engines.brand = await scoreBrandEngine(target.hostname, {
      fetcher: deps.fetcher,
      lookup: deps.lookup,
    });
  } catch (error) {
    engineFailures.brand = errorMessage(error);
  }
  // RAO-15: a status "error" brand result (rate_limit/timeout/block, BRA-7)
  // is a failure for scoring purposes - same isolation as a throw.
  if (engines.brand !== undefined && engines.brand.status === "error") {
    engineFailures.brand = engines.brand.reason ?? "brand engine error";
  }

  // RPL-11/design D8: wire the brand signals into the per-platform rubrics
  // BEFORE platformToContract so the contract carries the measured
  // Wikipedia/Wikidata criteria. Only a successful brand run flips the 4
  // keys; a failed brand leaves them not_measured (honest).
  if (engines.platform !== undefined && engines.brand?.status === "success") {
    engines.platform.perPlatform.platforms = applyBrandCriteria(
      engines.platform.perPlatform.platforms,
      {
        entityPresence: engines.brand.signals.entityPresence,
        entityConsistency: engines.brand.signals.entityConsistency,
        wikidataId: engines.brand.entity.wikidataId,
      },
    );
  }

  const errors = Object.entries(engineFailures).map(
    ([name, message]) => `${name}: ${message}`,
  );

  // RAO-9: composite the GEO Score. `platform` onPageScore decision: the Google
  // AI Overviews per-platform score represents the most representative AI-answer
  // surface and its rubric carries the most measured on-page criteria (70/100),
  // so the AIO score is wired as the platform dimension (RGS-2 composes the
  // technical dimension from crawler + platform from these values). Failed
  // engines pass null so the calculator rebalances weights (RGS-9).
  const failures: Partial<Record<DimensionKey, string>> = {};
  if (engineFailures.citability !== undefined)
    failures.citability = engineFailures.citability;
  if (engineFailures.content !== undefined)
    failures.eeat = engineFailures.content;
  if (engineFailures.schema !== undefined)
    failures.schema = engineFailures.schema;
  if (engineFailures.platform !== undefined)
    failures.platform = engineFailures.platform;
  if (engineFailures.brand !== undefined)
    failures.brand_authority = engineFailures.brand;

  // RAO-9/RAO-15: composite the GEO Score with the six dimensions (v3.0.0).
  // `platform` onPageScore decision: the Google AI Overviews per-platform
  // score represents the most representative AI-answer surface and its rubric
  // carries the most measured on-page criteria (70/100), so the AIO score is
  // wired as the platform dimension (RGS-2 composes the technical dimension
  // from crawler + platform from these values). Brand Authority passes its
  // measured score - a real measured 0 penalizes the 20% weight (RGS-11), a
  // failed brand passes null so the calculator rebalances (RGS-9).
  const scored = computeGeoScore(
    {
      citability: engines.citability ? engines.citability.pageScore : null,
      eeat: engines.content ? engines.content.composite : null,
      schema: engines.schema ? engines.schema.score : null,
      crawler: engines.crawler ? engines.crawler.compositeScore : null,
      platform: engines.platform
        ? engines.platform.perPlatform.platforms.aio.score
        : null,
      brand_authority:
        engines.brand?.status === "success" ? engines.brand.score : null,
      failures,
    },
    GEO_SCORE_V3_WEIGHTS,
  );

  const completedAt = clock();

  // RAO-10: assemble the fully typed contract shape. `scored.scoringModelVersion`
  // is the GEO_SCORE_V3_WEIGHTS version string, which the contract pins to the
  // literal "3.0.0" (RAO-10 scenario) - narrowed here for the return type.
  const scoringModelVersion = scored.scoringModelVersion as "3.0.0";

  return {
    summary: {
      url: pageUrl,
      geoScore: scored.geoScore,
      severityBand: scored.severityBand,
      durationMs: completedAt - startedAt,
    },
    crawlers: engines.crawler
      ? crawlerToContract(engines.crawler)
      : emptyCrawlerResult(),
    citability: engines.citability
      ? citabilityToContract(engines.citability)
      : emptyCitabilityResult(),
    schema: engines.schema
      ? schemaToContract(engines.schema)
      : emptySchemaResult(),
    platform: engines.platform
      ? platformToContract(engines.platform)
      : emptyPlatformResult(),
    content: engines.content
      ? eeatToContract(engines.content)
      : emptyContentResult(),
    // RAO-15: a successful brand maps to the contract; a failed brand (probe
    // error or throw) falls back to the empty error shape - never absent in a
    // v3 audit (absence is reserved for legacy 2.0.0 rows, RAO-16).
    brandAuthority:
      engines.brand?.status === "success"
        ? brandToContract(engines.brand)
        : emptyBrandResult(engineFailures.brand ?? "brand engine error"),
    scoringModelVersion,
    meta: {
      auditVersion: AUDIT_VERSION,
      startedAt,
      completedAt,
      errors,
    },
  };
}

interface UnsupportedPageArgs {
  pageUrl: string;
  pagePath: string;
  robotsResult: PromiseSettledResult<FetchResult>;
  scoreAccessEngine: typeof scoreAccess;
  scoreBrandEngine: typeof scoreBrand;
  /** Brand network deps (RAO-11): flows the audit fetcher/lookup through. */
  brandDeps: { fetcher?: FetchImpl; lookup?: LookupFn };
  startedAt: number;
  clock: () => number;
}

/**
 * RAO-13 non-HTML page: the four content engines cannot run (no DOM to parse),
 * so they report unsupported - zeroed contract sections + one `meta.errors`
 * entry each with the shared reason. The crawler engine still runs over the
 * independent robots.txt: it receives an empty DOM and empty headers so the
 * page-level signals (meta robots, llms.txt link) default to absent.
 *
 * The brand engine also still runs (RAO-15): it only consumes the audited
 * DOMAIN, so a non-HTML page does not stop it. A successful brand run enters
 * the composite (a brand with external presence keeps the score honest even
 * when the page cannot be parsed); a failed brand degrades to the empty
 * error shape like any other engine. The GEO Score is computed from the
 * available engines only (RGS-9).
 */
async function auditUnsupportedPage(
  args: UnsupportedPageArgs,
): Promise<AuditResult> {
  const {
    pageUrl,
    pagePath,
    robotsResult,
    scoreAccessEngine,
    scoreBrandEngine,
    brandDeps,
    startedAt,
    clock,
  } = args;

  const robotsFetched =
    robotsResult.status === "fulfilled" ? robotsResult.value : null;
  const robots =
    robotsFetched !== null && robotsFetched.ok
      ? parseRobotsTxt(robotsFetched.parsed.html)
      : emptyRobots();

  const crawlerRich = scoreAccessEngine(
    robots,
    new Headers(),
    load(""),
    pagePath,
  );

  // RAO-15: run the brand engine on the audited domain with the same failure
  // isolation as the main pipeline (BRA-7 never throws, but catch anyway).
  let brandRun: BrandEngineResult | null = null;
  let brandFailure: string | null = null;
  try {
    const result = await scoreBrandEngine(new URL(pageUrl).hostname, brandDeps);
    if (result.status === "error") {
      brandFailure = result.reason ?? "brand engine error";
    } else {
      brandRun = result;
    }
  } catch (error) {
    brandFailure = errorMessage(error);
  }

  const scored = computeGeoScore(
    {
      citability: null,
      eeat: null,
      schema: null,
      crawler: crawlerRich.compositeScore,
      platform: null,
      brand_authority: brandRun?.score ?? null,
      failures: {
        citability: "unsupported_content_type",
        eeat: "unsupported_content_type",
        schema: "unsupported_content_type",
        platform: "unsupported_content_type",
        ...(brandFailure !== null ? { brand_authority: brandFailure } : {}),
      },
    },
    GEO_SCORE_V3_WEIGHTS,
  );

  const completedAt = clock();

  return {
    summary: {
      url: pageUrl,
      geoScore: scored.geoScore,
      severityBand: scored.severityBand,
      durationMs: completedAt - startedAt,
    },
    crawlers: crawlerToContract(crawlerRich),
    citability: emptyCitabilityResult(),
    schema: emptySchemaResult(),
    platform: emptyPlatformResult(),
    content: emptyContentResult(),
    brandAuthority:
      brandRun !== null
        ? brandToContract(brandRun)
        : emptyBrandResult(brandFailure ?? "brand engine error"),
    scoringModelVersion: scored.scoringModelVersion as "3.0.0",
    meta: {
      auditVersion: AUDIT_VERSION,
      startedAt,
      completedAt,
      errors: [
        "citability: unsupported_content_type",
        "schema: unsupported_content_type",
        "content: unsupported_content_type",
        "platform: unsupported_content_type",
        ...(brandFailure !== null ? [`brand: ${brandFailure}`] : []),
      ],
    },
  };
}
