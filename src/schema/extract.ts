import type { CheerioAPI } from "cheerio";
import type { RawBlock } from "./types";

/**
 * JSON-LD extraction (RSC-1).
 *
 * Finds every `<script type="application/ld+json">` element and returns its
 * exact text content with its 0-based document index.
 *
 * Text is read per element, never on the multi-element selection: `.text()` on
 * a selection concatenates the content of all matched elements without
 * separators, which would corrupt the JSON. Reading element by element keeps
 * each block's original string intact (RSC-1 scenario "preserves its original
 * string exactly").
 */

export const JSON_LD_SELECTOR = 'script[type="application/ld+json"]';

export function extractJsonLd($: CheerioAPI): RawBlock[] {
  const blocks: RawBlock[] = [];
  $(JSON_LD_SELECTOR).each((index, element) => {
    blocks.push({ index, raw: $(element).text() });
  });
  return blocks;
}
