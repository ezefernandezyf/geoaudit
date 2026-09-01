/**
 * Shared text measurement helpers for the citability engine (used by segment
 * and scorer). Pure functions over strings - no DOM or network.
 */

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Counts sentences by terminal punctuation (`.`, `!`, `?`) followed by
 * whitespace or end-of-string, so decimals ("12.5") are not counted.
 */
export function countSentences(text: string): number {
  const matches = text.match(/[.!?]+(?=\s|$)/g);
  return matches ? matches.length : 0;
}

/** Returns the first sentence of `text` (up to the first terminal period). */
export function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]*[.!?]+/);
  return match ? match[0] : text;
}
