import type { CheerioAPI } from "cheerio";
import type { PlatformResult } from "@/lib/contracts/audit-result";
import { PROBE_TIMEOUT_MS } from "@/lib/fetch";
import { analyzeHeaders } from "./headers";
import { analyzeMeta, analyzeOpenGraph, analyzeTwitter } from "./meta";
import { extractStructure, scorePlatforms } from "./per-platform";
export { applyBrandCriteria, NOT_MEASURED_NOTE } from "./per-platform";
export type { BrandCriteriaSignals } from "./per-platform";
import { probeSite } from "./probes";
import type { ProbeFn } from "./probes";
import { analyzeSsr } from "./ssr";
import type { PlatformEngineResult } from "./types";

/**
 * Platform readiness engine public surface (RPL-1..RPL-11).
 *
 * `scorePlatform(input, opts?)` runs header checks (RPL-1), meta/OG/Twitter
 * analysis (RPL-2..RPL-4), SSR + question/answer detection (RPL-5/RPL-8/RPL-9),
 * the sitemap/llms.txt presence probes (RPL-6/RPL-7 - the only network touch,
 * via an injectable fetcher) and the per-platform on-page readiness rubrics
 * (RPL-10/RPL-11). `toContractResult` maps the rich engine-local result to the
 * shared `PlatformResult` contract consumed by AuditResult (T25).
 *
 * The engine never throws: missing headers, meta, probes or shell pages
 * produce partial results with typed findings.
 */

export interface PlatformInput {
  $: CheerioAPI;
  html: string;
  headers: Headers;
  /** Origin used to derive the /sitemap.xml and /llms.txt probe URLs. */
  origin: string;
}

export interface PlatformOptions {
  /** Injectable probe fetcher - defaults to global fetch; tests inject a mock. */
  fetcher?: ProbeFn;
}

export async function scorePlatform(
  input: PlatformInput,
  opts?: PlatformOptions,
): Promise<PlatformEngineResult> {
  const headers = analyzeHeaders(input.headers);
  const meta = analyzeMeta(input.$);
  const og = analyzeOpenGraph(input.$);
  const twitter = analyzeTwitter(input.$);
  const ssr = analyzeSsr(input.$, input.html);
  const probes = await probeSite(
    input.origin,
    opts?.fetcher,
    // ARU-9: bound the probes with the fetch layer's probe timeout so a hung
    // host cannot exceed the function limit.
    AbortSignal.timeout(PROBE_TIMEOUT_MS),
  );
  const structure = extractStructure(input.$, ssr, meta);
  const platforms = scorePlatforms(structure);

  return {
    headers,
    meta,
    og,
    twitter,
    ssr,
    probes,
    perPlatform: { platforms, structure },
  };
}

/**
 * Maps the rich engine output to the shared `PlatformResult` contract:
 * headers as a summary record + finding records, meta/og/twitter/ssr as
 * detail records, probes as presence records and perPlatform as one record
 * per platform id (score + criteria).
 */
export function toContractResult(result: PlatformEngineResult): PlatformResult {
  return {
    headers: [
      {
        key: "summary",
        contentType: result.headers.contentType,
        contentTypeValidHtml: result.headers.contentTypeValidHtml,
        xRobotsTag: result.headers.xRobotsTag,
        hasNoindex: result.headers.hasNoindex,
        canonicalLink: result.headers.canonicalLink,
        hasHsts: result.headers.hasHsts,
        hasCsp: result.headers.hasCsp,
      },
      ...result.headers.findings.map((finding) => ({
        key: finding.key,
        severity: finding.severity,
        message: finding.message,
      })),
    ],
    meta: {
      title: result.meta.title,
      titleLength: result.meta.titleLength,
      description: result.meta.description,
      descriptionLength: result.meta.descriptionLength,
      hasViewport: result.meta.hasViewport,
      score: result.meta.score,
      findings: result.meta.findings,
    },
    og: {
      properties: result.og.properties,
      presentCount: result.og.presentCount,
      score: result.og.score,
      findings: result.og.findings,
    },
    twitter: {
      properties: result.twitter.properties,
      presentCount: result.twitter.presentCount,
      score: result.twitter.score,
      findings: result.twitter.findings,
    },
    ssr: {
      status: result.ssr.status,
      visibleTextLength: result.ssr.visibleTextLength,
      htmlLength: result.ssr.htmlLength,
      textHtmlRatio: result.ssr.textHtmlRatio,
      questionHeadingCount: result.ssr.questionHeadingCount,
      directAnswerCount: result.ssr.directAnswerCount,
      findings: result.ssr.findings,
    },
    probes: {
      sitemap: result.probes.sitemap,
      llmsTxt: result.probes.llmsTxt,
    },
    perPlatform: Object.fromEntries(
      Object.entries(result.perPlatform.platforms).map(([id, platform]) => [
        id,
        { score: platform.score, criteria: platform.criteria },
      ]),
    ),
  };
}
