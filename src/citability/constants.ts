/**
 * Citability scoring constants (RCI-3..RCI-11).
 *
 * Dimension weights follow the geo-citability rubric: Answer Block Quality
 * 30%, Self-Containment 25%, Structural Readability 20%, Statistical Density
 * 15%, Uniqueness 10%. Sub-scoring constants document the step-by-step
 * algorithms implemented in scorer.ts (heuristic calibration per design R3 —
 * output is labeled "heuristic" downstream).
 */

export const CITABILITY_WEIGHTS = {
  answer: 0.3,
  selfContainment: 0.25,
  structure: 0.2,
  stats: 0.15,
  uniqueness: 0.1,
} as const;

// RCI-3 — Answer Block Quality
export const ANSWER_BASE_SCORE = 10;
/** Bonus when the block contains a definition pattern "X is a/an ...". */
export const ANSWER_DEFINITION_BONUS = 40;
/** Bonus when the first sentence is a complete answer inside the first 60 words. */
export const ANSWER_FIRST_SENTENCE_BONUS = 50;
/** A first sentence longer than this is not a "first-60-words standalone" answer. */
export const FIRST_SENTENCE_MAX_WORDS = 60;
/** Definition pattern (design: /\bis\s+a(n)?\s+/). */
export const DEFINITION_PATTERN = /\bis\s+(?:a|an)\s+/i;
/** Copula that marks a declarative answer sentence ("X is ..."). */
export const ANSWER_COPULA = /\b(?:is|are|was|were)\b/i;

// RCI-4 — Self-Containment
/** Score for a pronoun/conjunction-led block that needs external context. */
export const SELF_BAD_LEAD_SCORE = 10;
export const SELF_BASE_SCORE = 10;
/** Bonus for a lead that names its subject explicitly (not a pronoun). */
export const SELF_SUBJECT_BONUS = 40;
/** Bonus when the block sits in the 50-200 word extraction band. */
export const SELF_BAND_BONUS = 30;
export const WORD_BAND_MIN = 50;
export const WORD_BAND_MAX = 200;
/** Pronoun leads that force reliance on prior context (design regex). */
export const PRONOUN_LEAD = /^(?:it|this|that|these|those)\b/i;
/** Conjunction leads that also imply prior context. */
export const CONJUNCTION_LEAD = /^(?:but|however|and|also|so|yet)\b/i;

// RCI-5 — Structural Readability
export const STRUCTURE_HEADING_BONUS = 20;
/** Bonus when every paragraph is 2-4 sentences long. */
export const STRUCTURE_PARAGRAPH_BONUS = 40;
export const STRUCTURE_LIST_TABLE_BONUS = 20;
export const STRUCTURE_QUESTION_BONUS = 20;
export const PARAGRAPH_SENTENCE_MIN = 2;
export const PARAGRAPH_SENTENCE_MAX = 4;

// RCI-6 — Statistical Density
/** Percentages, currency amounts and 4-digit years (design stat regex). */
export const STAT_PATTERN = /[\d,.]+?\s*%|\$\s*[\d,]+|\b(?:20\d{2}|19\d{2})\b/g;
/** Score reached at exactly one concrete stat per 500 words. */
export const STATS_FULL_SCORE_AT_ONE_PER_500 = 70;

// RCI-7 — Uniqueness (proxy signals: first-party data phrases + first person)
export const FIRST_PERSON_LEAD = /^(?:we|our|i)\b/i;
export const UNIQUENESS_PHRASES = [
  "we surveyed",
  "we interviewed",
  "we analyzed",
  "our analysis",
  "our data",
  "our research",
  "our findings",
  "we found",
  "first-party",
  "in our experience",
] as const;
export const UNIQUENESS_PER_HIT = 35;

// RCI-9 / RCI-11 — page aggregation
/** Blocks scoring at or above this count toward citability coverage (RCI-11). */
export const COVERAGE_THRESHOLD = 70;
/** Blocks below this composite receive rewrite suggestions (RCI-12). */
export const REWRITE_THRESHOLD = 60;
