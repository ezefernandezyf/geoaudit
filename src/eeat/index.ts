import type { CheerioAPI } from "cheerio";
import type { ContentResult } from "@/lib/contracts/audit-result";
import { scoreAuthoritativeness } from "./authoritativeness";
import { scoreExperience } from "./experience";
import { scoreExpertise } from "./expertise";
import { assessFreshness, assessHeadings, assessWordCount } from "./meta";
import { scoreTrustworthiness } from "./trustworthiness";
import type { EeatResult } from "./types";

/**
 * E-E-A-T engine public surface (REE-1..REE-10).
 *
 * `scoreEeat($)` runs the four dimension scorers over the Cheerio DOM and
 * returns the rich engine-local result: per-dimension breakdowns, the
 * composite (plain sum of the four dimensions, capped at 100 — REE-9),
 * informational content meta (word count / headings / freshness) and the
 * Topical Authority placeholder (REE-8: single-page proxy, not measured).
 * `toContractResult` maps it to the shared `ContentResult` contract consumed
 * by AuditResult (T25).
 *
 * Every signal is proxy-based (single-page limitation) — output is labeled
 * "heuristic" downstream (design R3). The engine never throws (REE-10):
 * missing author/citation/contact/date signals produce partial results.
 */

export const TOPICAL_AUTHORITY_RATIONALE =
  "Single-page limit; multi-page crawl required (Sprint 5+)";

export function scoreEeat(
  $: CheerioAPI,
  opts?: { now?: () => number },
): EeatResult {
  const experience = scoreExperience($);
  const expertise = scoreExpertise($);
  const authoritativeness = scoreAuthoritativeness($);
  const trustworthiness = scoreTrustworthiness($);

  const composite = Math.min(
    100,
    experience.score +
      expertise.score +
      authoritativeness.score +
      trustworthiness.score,
  );

  return {
    experience,
    expertise,
    authoritativeness,
    trustworthiness,
    composite,
    wordCount: assessWordCount($),
    headings: assessHeadings($),
    freshness: assessFreshness($, opts?.now),
    topicalAuthority: "not_measured",
    topicalAuthorityRationale: TOPICAL_AUTHORITY_RATIONALE,
  };
}

/**
 * Maps the rich engine output to the shared `ContentResult` contract:
 * dimensions and composite as numbers, `wordCount`/`headings` as counts, and
 * the freshness object plus topicalAuthority placeholder as-is.
 */
export function toContractResult(result: EeatResult): ContentResult {
  return {
    experience: result.experience.score,
    expertise: result.expertise.score,
    authoritativeness: result.authoritativeness.score,
    trustworthiness: result.trustworthiness.score,
    composite: result.composite,
    wordCount: result.wordCount.count,
    headings: result.headings.count,
    freshness: {
      datePublished: result.freshness.datePublished,
      dateModified: result.freshness.dateModified,
      daysSinceModification: result.freshness.daysSinceModification,
      finding: result.freshness.finding,
    },
    topicalAuthority: result.topicalAuthority,
  };
}
