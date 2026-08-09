import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode } from "./types";

/**
 * Shared E-E-A-T DOM/text helpers.
 *
 * All helpers are pure over the Cheerio DOM: they read and clone, never mutate
 * the caller's document (the shared single-load DOM per RAO-3).
 */

/** Regions stripped from the visible-page text (boilerplate, not content). */
const BOILERPLATE_SELECTOR =
  "script, style, noscript, nav, footer, aside, .sidebar, .ads";

/** Clone of <body> with boilerplate regions removed. The shared DOM is untouched. */
export function pageBodyClone($: CheerioAPI): Cheerio<AnyNode> {
  const body = $("body").clone();
  body.find(BOILERPLATE_SELECTOR).remove();
  return body;
}

/** Visible page text (boilerplate stripped) for phrase/term scans. */
export function pageText($: CheerioAPI): string {
  return pageBodyClone($).text();
}

/** Trimmed <p> texts in document order, for first-person lead detection. */
export function paragraphTexts($: CheerioAPI): string[] {
  const texts: string[] = [];
  pageBodyClone($)
    .find("p")
    .each((_index, element) => {
      const text = $(element).text().trim();
      if (text.length > 0) texts.push(text);
    });
  return texts;
}

/**
 * Absolute `http(s)` hrefs anywhere in the document — the external-citation
 * proxy (REE-3). Relative and anchor-only links are not citations.
 */
export function externalLinkUrls($: CheerioAPI): string[] {
  const urls: string[] = [];
  $("a[href]").each((_index, element) => {
    const href = ($(element).attr("href") ?? "").trim();
    if (/^https?:\/\//i.test(href)) urls.push(href);
  });
  return urls;
}

/** Safely parses every `<script type="application/ld+json">` block. */
export function parseJsonLdBlocks($: CheerioAPI): unknown[] {
  const blocks: unknown[] = [];
  $('script[type="application/ld+json"]').each((_index, element) => {
    const raw = $(element).text().trim();
    if (raw.length === 0) return;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // Invalid JSON-LD is ignored (REE-10: graceful absence, never throw).
    }
  });
  return blocks;
}

/**
 * Collects every node (recursively, through @graph/arrays) whose `@type`
 * matches `wanted` (case-insensitive; handles string or array @type).
 */
export function collectTypeNodes(
  value: unknown,
  wanted: string,
  out: unknown[],
): void {
  if (Array.isArray(value)) {
    for (const item of value) collectTypeNodes(item, wanted, out);
    return;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const type = record["@type"];
    const types = Array.isArray(type) ? type : [type];
    const needle = wanted.toLowerCase();
    if (
      types.some((t) => typeof t === "string" && t.toLowerCase() === needle)
    ) {
      out.push(value);
    }
    for (const child of Object.values(record)) {
      collectTypeNodes(child, wanted, out);
    }
  }
}
