import { REWRITE_THRESHOLD } from "./constants";
import type { DimensionScores, ScoredBlock } from "./scorer";
import { firstSentence } from "./text";

/**
 * Template-based rewrite suggestions (RCI-12).
 *
 * Every block whose composite is below the rewrite threshold receives exactly
 * one suggestion. The suggestion key is chosen from the FIRST dimension below
 * its weakness threshold, in a fixed priority order (answer, self-containment,
 * stats, structure, uniqueness) - the most actionable fix wins; a block with
 * no single weak dimension falls back to a generic answer-first rewrite.
 */

export interface RewriteSuggestion {
  /** Block identifier: heading text, or the first sentence when no heading. */
  block: string;
  /** Template key consumed by the report layer. */
  key: string;
  reason: string;
}

/** Score below which a dimension counts as a weakness worth fixing. */
const WEAK_DIMENSION_THRESHOLD = 50;

const WEAKNESS_TEMPLATES: ReadonlyArray<{
  dim: keyof DimensionScores;
  key: string;
  reason: string;
}> = [
  {
    dim: "answer",
    key: "define_core_concept",
    reason:
      "Open the passage with a definition pattern (X is ...) so the answer stands in the first sentence.",
  },
  {
    dim: "selfContainment",
    key: "name_subject_early",
    reason:
      "Lead with an explicit subject instead of a pronoun so the passage reads standalone.",
  },
  {
    dim: "stats",
    key: "add_specific_numbers",
    reason:
      "Add a concrete statistic (percentage, currency or dated source) per 500 words.",
  },
  {
    dim: "structure",
    key: "shorten_paragraphs",
    reason:
      "Keep paragraphs to 2-4 sentences and add tables or lists where comparisons exist.",
  },
  {
    dim: "uniqueness",
    key: "add_first_party_data",
    reason:
      "Include original data or first-person findings so the passage is not derivative.",
  },
];

const GENERIC_TEMPLATE = {
  key: "answer_first_rewrite",
  reason: "Restructure the passage around an answer-first opening.",
} as const;

function labelFor(scored: ScoredBlock): string {
  return scored.block.heading || firstSentence(scored.block.content).trim();
}

export function suggestRewrites(scored: ScoredBlock[]): RewriteSuggestion[] {
  return [...scored]
    .filter((entry) => entry.composite < REWRITE_THRESHOLD)
    .sort(
      (a, b) =>
        a.composite - b.composite || Number(a.block.id) - Number(b.block.id),
    )
    .map((entry) => {
      const template =
        WEAKNESS_TEMPLATES.find(
          (candidate) => entry.scores[candidate.dim] < WEAK_DIMENSION_THRESHOLD,
        ) ?? GENERIC_TEMPLATE;
      return {
        block: labelFor(entry),
        key: template.key,
        reason: template.reason,
      };
    });
}
