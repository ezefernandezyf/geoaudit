/**
 * Engine-local platform readiness I/O types (design: engine-local types keep
 * engines self-contained and avoid contract-bloat). Cross-engine shapes live in
 * `src/lib/contracts/` — this engine maps to `PlatformResult` there via
 * `toContractResult` (see index.ts).
 *
 * Pipeline: headers (RPL-1) -> meta (RPL-2) -> OG/Twitter (RPL-3/RPL-4) ->
 * SSR + question/answer detection (RPL-5/RPL-8/RPL-9) -> probes (RPL-6/RPL-7)
 * -> per-platform readiness scoring (RPL-10/RPL-11).
 */

import { load } from "cheerio";

/**
 * Cheerio does not re-export its node types and `domhandler` is not a direct
 * dependency (pnpm strict layout), so the element type is derived from the
 * `load()` signature instead of a transitive import (same pattern as
 * `src/citability/types.ts` and `src/eeat/types.ts`).
 */
export type PlatformNode = Exclude<
  NonNullable<Parameters<typeof load>[0]>,
  string | Buffer | unknown[]
>;

export type FindingSeverity = "Critical" | "High" | "Medium" | "Low" | "Info";

/** A single platform-readiness finding (never thrown, always collected). */
export interface PlatformFinding {
  /** Stable machine key: `missing_canonical_header`, `missing_open_graph`, ... */
  key: string;
  severity: FindingSeverity;
  message: string;
}

/** HTTP header checks (RPL-1). */
export interface HeaderAnalysis {
  contentType: string | null;
  contentTypeValidHtml: boolean;
  xRobotsTag: string | null;
  hasNoindex: boolean;
  /** Canonical URL extracted from the `Link: <url>; rel="canonical"` header. */
  canonicalLink: string | null;
  hasHsts: boolean;
  hasCsp: boolean;
  findings: PlatformFinding[];
}

/** Core meta tag analysis (RPL-2). Score: title 40 + description 40 + viewport 20. */
export interface MetaAnalysis {
  title: string | null;
  titleLength: number;
  description: string | null;
  descriptionLength: number;
  hasViewport: boolean;
  score: number;
  findings: PlatformFinding[];
}

export type OgPropertyKey =
  "og:title" | "og:description" | "og:image" | "og:url" | "og:type";

export type TwitterPropertyKey =
  "twitter:card" | "twitter:title" | "twitter:description" | "twitter:image";

export interface TagPresence {
  present: boolean;
  value: string | null;
}

/** Open Graph tag analysis (RPL-3). Score = present count / 5 * 100. */
export interface OpenGraphAnalysis {
  properties: Record<OgPropertyKey, TagPresence>;
  presentCount: number;
  score: number;
  findings: PlatformFinding[];
}

/** Twitter Card tag analysis (RPL-4). Score = present count / 4 * 100. */
export interface TwitterAnalysis {
  properties: Record<TwitterPropertyKey, TagPresence>;
  presentCount: number;
  score: number;
  findings: PlatformFinding[];
}

export type SsrStatus = "ssr_present" | "client_side_shell";

/** SSR detection + question/answer structure (RPL-5, RPL-8, RPL-9). */
export interface SsrAnalysis {
  status: SsrStatus;
  /** Visible text characters after stripping script/style/noscript/template. */
  visibleTextLength: number;
  htmlLength: number;
  /** visibleTextLength / htmlLength, 0-1. */
  textHtmlRatio: number;
  /** H2/H3 headings matching question patterns (RPL-8). */
  questionHeadingCount: number;
  /** First-<p>-after-question-heading direct answers (RPL-9). */
  directAnswerCount: number;
  findings: PlatformFinding[];
}

/** One HEAD-probe result (RPL-6/RPL-7) — presence only, never parsed. */
export interface ProbeResult {
  url: string;
  run: boolean;
  present: boolean;
  statusCode: number | null;
  error: string | null;
}

export interface SiteProbes {
  sitemap: ProbeResult;
  llmsTxt: ProbeResult;
}

/**
 * On-page structure signals consumed by the per-platform rubrics (RPL-10).
 * Computed from the shared DOM + SSR/meta analysis — all engine-local.
 */
export interface PlatformStructure {
  questionHeadings: number;
  directAnswers: number;
  hasTables: boolean;
  hasLists: boolean;
  hasFaqSection: boolean;
  /** Question headings found inside a FAQ section (or total question count). */
  faqQuestions: number;
  hasDates: boolean;
  hasAuthorByline: boolean;
  hasAboutSection: boolean;
  hasMetaDescription: boolean;
  metaDescriptionLength: number;
  hasStructuredData: boolean;
  isSsrPresent: boolean;
  wordCount: number;
  headingHierarchyClean: boolean;
  imageAltCoverage: number;
  hasImages: boolean;
}

export type PlatformId =
  "aio" | "chatgpt" | "perplexity" | "gemini" | "copilot";

export interface PlatformCriterion {
  key: string;
  label: string;
  /** "not_measured" for external-presence criteria (RPL-11). */
  status: "measured" | "not_measured";
  points: number;
  max: number;
  /** Mandated explanation on not_measured criteria; null on measured ones. */
  note: string | null;
}

export interface PlatformScore {
  platform: PlatformId;
  score: number;
  criteria: PlatformCriterion[];
}

export interface PerPlatformResult {
  platforms: Record<PlatformId, PlatformScore>;
  structure: PlatformStructure;
}

/** Rich engine-local result (mapped to the shared PlatformResult contract). */
export interface PlatformEngineResult {
  headers: HeaderAnalysis;
  meta: MetaAnalysis;
  og: OpenGraphAnalysis;
  twitter: TwitterAnalysis;
  ssr: SsrAnalysis;
  probes: SiteProbes;
  perPlatform: PerPlatformResult;
}
