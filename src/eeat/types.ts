import { load } from "cheerio";

/**
 * Engine-local E-E-A-T I/O types (design: engine-local types keep engines
 * self-contained and avoid contract-bloat). Cross-engine shapes live in
 * `src/lib/contracts/` - this engine maps to `ContentResult` there via
 * `toContractResult` (see index.ts).
 *
 * Every dimension scores 0-25 (REE-1..REE-4); the composite is the plain sum
 * of the four dimensions, capped at 100 (REE-9). Meta signals (word count,
 * heading hierarchy, freshness) are reported but NOT added to the composite:
 * they feed the shared ContentResult contract as informational fields and the
 * freshness findings act as a documented Trust-dimension indicator (REE-7).
 */

/**
 * Cheerio does not re-export its node types and `domhandler` is not a direct
 * dependency (pnpm strict layout), so the element type is derived from the
 * `load()` signature instead of a transitive import (same pattern as
 * `src/citability/types.ts`).
 */
export type AnyNode = Exclude<
  NonNullable<Parameters<typeof load>[0]>,
  string | Buffer | unknown[]
>;

/** One granular signal that contributed to (or explains) a dimension score. */
export interface EeatFinding {
  /** Stable machine key, e.g. "no_author_detected", "missing_privacy_policy". */
  key: string;
  /** Human-readable label for report output. */
  label: string;
  /** Optional supporting detail (counts, matched domains, ...). */
  detail?: string;
}

/** Shared shape for all four 0-25 dimension scorers (REE-1..REE-4). */
export interface DimensionResult {
  score: number;
  findings: EeatFinding[];
}

/** Page-type classification for the word-count benchmark (REE-5). */
export type EeatPageType = "article" | "faq" | "product" | "page";

export interface WordCountInfo {
  count: number;
  pageType: EeatPageType;
  /** Minimum words for the detected page type (geo-content benchmarks). */
  benchmark: number;
  status: "above_benchmark" | "below_benchmark";
}

export interface HeadingMeta {
  count: number;
  /** Informational 0-100 hierarchy score (depth bonus - skip penalties). */
  score: number;
  /** Skipped-level warnings, e.g. ["H2_skipped"] (REE-6). */
  warnings: string[];
  levels: number[];
}

export interface FreshnessInfo {
  datePublished: string | null;
  dateModified: string | null;
  /** Whole days between `now` and the last modification date (REE-7). */
  daysSinceModification: number | null;
  source: "json_ld" | "meta" | "dom" | null;
  finding: "date_detected" | "no_date_detected";
}

export interface EeatResult {
  experience: DimensionResult;
  expertise: DimensionResult;
  authoritativeness: DimensionResult;
  trustworthiness: DimensionResult;
  /** REE-9: sum of the four dimensions, capped at 100. */
  composite: number;
  wordCount: WordCountInfo;
  headings: HeadingMeta;
  freshness: FreshnessInfo;
  /** REE-8: single-page proxy cannot measure topical authority. */
  topicalAuthority: "not_measured";
  topicalAuthorityRationale: string;
}
