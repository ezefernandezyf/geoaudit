import type { CheerioAPI } from "cheerio";
import type { CitabilityResult } from "@/lib/contracts/audit-result";
import { COVERAGE_THRESHOLD } from "./constants";
import { extractMainContent } from "./extract";
import { suggestRewrites, type RewriteSuggestion } from "./rewrite";
import { scoreBlock, type DimensionScores, type ScoredBlock } from "./scorer";
import { segmentBlocks } from "./segment";
import { firstSentence } from "./text";

/**
 * Citability engine public surface (RCI-9..RCI-12).
 *
 * Pipeline: extractMainContent -> segmentBlocks -> scoreBlock per block ->
 * page aggregation. `scorePage($)` returns the rich engine-local result
 * (per-block detail, top/bottom summaries, suggestions); `toContractResult`
 * maps it to the shared `CitabilityResult` contract consumed by AuditResult.
 */

export interface BlockSummary {
  id: string;
  heading: string;
  excerpt: string;
  scores: DimensionScores;
  composite: number;
}

export interface CitabilityPageResult {
  /** RCI-9: mean of the validated (non-empty) block composites. */
  pageScore: number;
  /** RCI-11: percentage of blocks scoring >= 70. */
  coverage: number;
  /** RCI-10: top 3 blocks with individual dimension scores and excerpts. */
  top3: BlockSummary[];
  /** RCI-10: bottom 3 blocks with individual dimension scores and excerpts. */
  bottom3: BlockSummary[];
  /** RCI-12: template-based rewrite suggestions for weak blocks. */
  suggestions: RewriteSuggestion[];
  blocks: ScoredBlock[];
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function toSummary(scored: ScoredBlock): BlockSummary {
  return {
    id: scored.block.id,
    heading: scored.block.heading,
    excerpt: firstSentence(scored.block.content).trim(),
    scores: scored.scores,
    composite: scored.composite,
  };
}

/** Top-3 sort: highest composite first; document order breaks ties. */
function byTop(a: ScoredBlock, b: ScoredBlock): number {
  return b.composite - a.composite || Number(a.block.id) - Number(b.block.id);
}

/** Bottom-3 sort: lowest composite first; document order breaks ties. */
function byBottom(a: ScoredBlock, b: ScoredBlock): number {
  return a.composite - b.composite || Number(a.block.id) - Number(b.block.id);
}

export function scorePage($: CheerioAPI): CitabilityPageResult {
  const root = extractMainContent($);
  if (root.length === 0) {
    // RCI-14 empty body: score 0 with no blocks (Zod-valid contract below).
    return {
      pageScore: 0,
      coverage: 0,
      top3: [],
      bottom3: [],
      suggestions: [],
      blocks: [],
    };
  }

  const blocks = segmentBlocks(root, $);
  // RCI-9 "validated" block scores: empty blocks carry no score.
  const scored = blocks
    .filter((block) => block.wordCount > 0)
    .map((block) => scoreBlock(block));

  const pageScore =
    scored.length > 0
      ? round1(
          scored.reduce((sum, entry) => sum + entry.composite, 0) /
            scored.length,
        )
      : 0;
  const covered = scored.filter(
    (entry) => entry.composite >= COVERAGE_THRESHOLD,
  ).length;
  const coverage =
    scored.length > 0 ? Math.round((covered / scored.length) * 100) : 0;

  // RCI-10 (sprint 11 fix): the bottom 3 are derived from the blocks NOT in
  // the top 3, so the two lists are always disjoint. With fewer than 3
  // non-overlapping blocks remaining the bottom list is simply shorter -
  // never a repeated top block.
  const top3 = [...scored].sort(byTop).slice(0, 3);
  const top3Ids = new Set(top3.map((entry) => entry.block.id));
  const bottom3 = scored
    .filter((entry) => !top3Ids.has(entry.block.id))
    .sort(byBottom)
    .slice(0, 3);

  return {
    pageScore,
    coverage,
    top3: top3.map(toSummary),
    bottom3: bottom3.map(toSummary),
    suggestions: suggestRewrites(scored),
    blocks: scored,
  };
}

/**
 * Maps the rich engine output to the shared `CitabilityResult` contract:
 * top/bottom entries become their heading (or first-sentence excerpt when the
 * block has no heading); suggestions keep only block + template key.
 */
export function toContractResult(
  result: CitabilityPageResult,
): CitabilityResult {
  return {
    pageScore: result.pageScore,
    coverage: result.coverage,
    top3: result.top3.map((summary) => summary.heading || summary.excerpt),
    bottom3: result.bottom3.map(
      (summary) => summary.heading || summary.excerpt,
    ),
    suggestions: result.suggestions.map((suggestion) => ({
      block: suggestion.block,
      key: suggestion.key,
    })),
  };
}
