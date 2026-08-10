import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode } from "./types";

/**
 * Main content extraction (RCI-1, RCI-14).
 *
 * Strategy, in priority order:
 * 1. Pick the first semantic container in document order among
 *    `article, main, [role="main"], .content` (design selector list).
 * 2. If none exists (div-only page), fall back to the largest text-bearing
 *    `<div>`; empty / minimal-text divs are excluded (RCI-1).
 * 3. Known non-content regions (`nav, footer, aside, .sidebar, .ads`) are
 *    stripped from the chosen container so they never leak into blocks.
 *
 * Malformed HTML never throws: Cheerio recovers unclosed tags (RCI-14) and an
 * empty body yields an empty selection, which downstream stages (segment /
 * score) translate into a 0 score with no blocks.
 *
 * The result is a CLONE of the candidate: the caller's DOM (shared by the
 * other engines) is never mutated.
 */

const CONTENT_SELECTOR = 'article, main, [role="main"], .content';
const EXCLUDE_SELECTOR = "nav, footer, aside, .sidebar, .ads";
/** Divs with less text than this are "minimal" and never selected (RCI-1). */
const MIN_DIV_TEXT_CHARS = 20;

function stripExcluded<T extends AnyNode>(root: Cheerio<T>): Cheerio<T> {
  root.find(EXCLUDE_SELECTOR).remove();
  return root;
}

function largestTextDiv($: CheerioAPI): Cheerio<AnyNode> | null {
  let best: Cheerio<AnyNode> | null = null;
  let bestTextLength = -1;
  $("div").each((_index, element) => {
    const text = $(element).text().trim();
    if (text.length >= MIN_DIV_TEXT_CHARS && text.length > bestTextLength) {
      best = $(element).clone();
      bestTextLength = text.length;
    }
  });
  return best;
}

export function extractMainContent($: CheerioAPI): Cheerio<AnyNode> {
  const candidates = $(CONTENT_SELECTOR);
  if (candidates.length > 0) {
    return stripExcluded(candidates.first().clone());
  }
  const fallback = largestTextDiv($);
  return fallback ? stripExcluded(fallback) : $();
}
