import type { ContentBlock } from "./types";
import {
  ANSWER_BASE_SCORE,
  ANSWER_COPULA,
  ANSWER_DEFINITION_BONUS,
  ANSWER_FIRST_SENTENCE_BONUS,
  ANSWER_FIRST_SENTENCE_PARTIAL_BONUS,
  CITABILITY_WEIGHTS,
  CONJUNCTION_LEAD,
  DEFINITION_PATTERN,
  FIRST_PERSON_LEAD,
  FIRST_SENTENCE_MAX_WORDS,
  PARAGRAPH_SENTENCE_MAX,
  PARAGRAPH_SENTENCE_MIN,
  PRONOUN_LEAD,
  SELF_BAD_LEAD_SCORE,
  SELF_BAND_BONUS,
  SELF_BASE_SCORE,
  SELF_SUBJECT_BONUS,
  STATS_FULL_SCORE_AT_ONE_PER_500,
  STAT_PATTERN,
  STRUCTURE_HEADING_BONUS,
  STRUCTURE_LIST_TABLE_BONUS,
  STRUCTURE_PARAGRAPH_BONUS,
  STRUCTURE_PARTIAL_PARAGRAPH_BONUS,
  STRUCTURE_QUESTION_BONUS,
  UNIQUENESS_FLOOR,
  UNIQUENESS_PER_HIT,
  UNIQUENESS_PHRASES,
  WORD_BAND_MAX,
  WORD_BAND_MIN,
} from "./constants";
import { countSentences, countWords, firstSentence } from "./text";

/**
 * Per-block 5-dimension weighted scorer (RCI-3..RCI-8). Pure function over a
 * ContentBlock - the algorithms are documented step by step below and their
 * constants live in constants.ts. Every dimension returns 0-100.
 */

export interface DimensionScores {
  answer: number;
  selfContainment: number;
  structure: number;
  stats: number;
  uniqueness: number;
}

export interface ScoredBlock {
  block: ContentBlock;
  scores: DimensionScores;
  composite: number;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * RCI-3 - Answer Block Quality (30%) - partial-credit tiers (WU-3).
 * Step 1: start from a small structural base (softened floor).
 * Step 2: add the definition-pattern bonus when the content contains
 *         "X is a/an ..." (regex from design) - a definition earns credit
 *         even when the answer is buried, not all-or-nothing.
 * Step 3: add the answer-first bonus when the FIRST sentence is a complete
 *         sentence (ends in .!?) and contains a copula (is/are/was/were):
 *         full bonus inside the first 60 words (standalone answer), half
 *         bonus when the answer exists but is not standalone.
 */
export function scoreAnswer(block: ContentBlock): number {
  const lead = block.paragraphs.join(" ").trim();
  let score = ANSWER_BASE_SCORE;
  if (DEFINITION_PATTERN.test(lead)) score += ANSWER_DEFINITION_BONUS;
  score += firstSentenceAnswerBonus(lead);
  return Math.min(100, score);
}

function firstSentenceAnswerBonus(lead: string): number {
  const first = firstSentence(lead);
  const complete = /[.!?]$/.test(first);
  if (!complete) return 0;
  const declarative = ANSWER_COPULA.test(first);
  if (!declarative) return 0;
  return countWords(first) <= FIRST_SENTENCE_MAX_WORDS
    ? ANSWER_FIRST_SENTENCE_BONUS
    : ANSWER_FIRST_SENTENCE_PARTIAL_BONUS;
}

/**
 * RCI-4 - Self-Containment (25%).
 * Step 1: a lead that starts with a pronoun (It/This/That/These/Those) or a
 *         conjunction (But/However/And/...) requires external context - score
 *         stays at the bad-lead floor (spec: pronoun-led < 30).
 * Step 2: an explicit-subject lead earns the subject bonus.
 * Step 3: content inside the 50-200 word extraction band earns the band bonus.
 */
export function scoreSelfContainment(block: ContentBlock): number {
  const lead = block.paragraphs.join(" ").trim();
  if (PRONOUN_LEAD.test(lead) || CONJUNCTION_LEAD.test(lead)) {
    return SELF_BAD_LEAD_SCORE;
  }
  let score = SELF_BASE_SCORE + SELF_SUBJECT_BONUS;
  if (block.wordCount >= WORD_BAND_MIN && block.wordCount <= WORD_BAND_MAX) {
    score += SELF_BAND_BONUS;
  }
  return score;
}

/**
 * RCI-5 - Structural Readability (20%) - partial-credit tiers (WU-3).
 * Step 1: a block that has a heading (H2/H3) is structured (+heading bonus).
 * Step 2: every paragraph with 2-4 sentences earns the full paragraph bonus;
 *         SOME paragraphs in the band earn the partial bonus (wall-of-text
 *         blocks with a readable paragraph are no longer all-or-nothing).
 * Step 3: tables or lists earn their bonus (AI extraction targets).
 * Step 4: question-form headings earn their bonus (query-matchable).
 */
export function scoreStructure(block: ContentBlock): number {
  let score = 0;
  if (block.headingLevel !== 0) score += STRUCTURE_HEADING_BONUS;
  if (hasParagraphsInSentenceBand(block)) {
    score += STRUCTURE_PARAGRAPH_BONUS;
  } else if (hasPartialParagraphBand(block)) {
    score += STRUCTURE_PARTIAL_PARAGRAPH_BONUS;
  }
  if (block.hasTable || block.hasList) score += STRUCTURE_LIST_TABLE_BONUS;
  if (block.hasQuestionHeading) score += STRUCTURE_QUESTION_BONUS;
  return score;
}

function hasParagraphsInSentenceBand(block: ContentBlock): boolean {
  if (block.paragraphs.length === 0) return false;
  return block.paragraphs.every((paragraph) => {
    const sentences = countSentences(paragraph);
    return (
      sentences >= PARAGRAPH_SENTENCE_MIN && sentences <= PARAGRAPH_SENTENCE_MAX
    );
  });
}

/** Some (but not all) paragraphs sit in the 2-4 sentence band. */
function hasPartialParagraphBand(block: ContentBlock): boolean {
  if (block.paragraphs.length === 0) return false;
  const inBand = block.paragraphs.filter((paragraph) => {
    const sentences = countSentences(paragraph);
    return (
      sentences >= PARAGRAPH_SENTENCE_MIN && sentences <= PARAGRAPH_SENTENCE_MAX
    );
  }).length;
  return inBand > 0 && inBand < block.paragraphs.length;
}

/**
 * RCI-6 - Statistical Density (15%).
 * Step 1: count concrete stats (percentages, currency, 4-digit years) via the
 *         design regex over the block content.
 * Step 2: normalize per 500 words: per500 = stats / (wordCount / 500).
 * Step 3: score = min(100, per500 * 70) so one stat per 500 words scores 70.
 */
export function scoreStats(block: ContentBlock): number {
  if (block.wordCount === 0) return 0;
  const matches = block.content.match(STAT_PATTERN) ?? [];
  const per500 = matches.length / (block.wordCount / 500);
  return round1(Math.min(100, per500 * STATS_FULL_SCORE_AT_ONE_PER_500));
}

/**
 * RCI-7 - Uniqueness (10%) - proxy signals.
 * Step 1: count distinct original-data phrases ("we surveyed", "our analysis",
 *         ...) in the block content.
 * Step 2: a first-person lead (we/our/I) counts as one more hit.
 * Step 3: score = min(100, FLOOR + hits * 35) - the 35 base floor credits every
 *         extractable self-contained passage; hits add 35 each, capped at 100
 *         (design D4 - previously zero hits scored 0, compressing the dimension).
 */
export function scoreUniqueness(block: ContentBlock): number {
  const lead = block.paragraphs.join(" ").trim().toLowerCase();
  let hits = 0;
  for (const phrase of UNIQUENESS_PHRASES) {
    if (lead.includes(phrase)) hits += 1;
  }
  if (FIRST_PERSON_LEAD.test(lead)) hits += 1;
  return Math.min(100, UNIQUENESS_FLOOR + hits * UNIQUENESS_PER_HIT);
}

/**
 * RCI-8 - Block composite: weighted average of the five dimensions
 * (30/25/20/15/10), rounded to one decimal.
 */
export function scoreBlock(block: ContentBlock): ScoredBlock {
  const scores: DimensionScores = {
    answer: scoreAnswer(block),
    selfContainment: scoreSelfContainment(block),
    structure: scoreStructure(block),
    stats: scoreStats(block),
    uniqueness: scoreUniqueness(block),
  };
  const composite = round1(
    scores.answer * CITABILITY_WEIGHTS.answer +
      scores.selfContainment * CITABILITY_WEIGHTS.selfContainment +
      scores.structure * CITABILITY_WEIGHTS.structure +
      scores.stats * CITABILITY_WEIGHTS.stats +
      scores.uniqueness * CITABILITY_WEIGHTS.uniqueness,
  );
  return { block, scores, composite };
}
