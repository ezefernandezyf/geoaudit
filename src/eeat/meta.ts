import type { CheerioAPI } from "cheerio";
import type {
  EeatPageType,
  FreshnessInfo,
  HeadingMeta,
  WordCountInfo,
} from "./types";
import { collectTypeNodes, pageText, parseJsonLdBlocks } from "./text";
import { AUTHOR_SELECTOR } from "./expertise";

/**
 * Content meta assessment (REE-5..REE-7). Informational signals reported
 * alongside the four dimensions; they are NOT added to the composite
 * (REE-9: composite is the plain sum of the four dimensions). Freshness
 * findings act as a documented Trust-dimension indicator (REE-7).
 */

/** Minimum words per detected page type (geo-content benchmarks). */
export const WORD_BENCHMARKS = {
  article: 1500,
  faq: 500,
  product: 300,
  page: 500,
} as const;

export const HEADING_H1_BONUS = 30;
export const HEADING_H2_BONUS = 20;
export const HEADING_H3_BONUS = 20;
export const HEADING_H4_BONUS = 10;
export const HEADING_SKIP_PENALTY = 40;
export const HEADING_MAX = 100;
export const DAY_MS = 86_400_000;

const QUESTION_HEADING = /\?\s*$/;
const PRICE_SELECTOR =
  '[itemprop="price"], .price, [data-price], .product-price';
const CART_PATTERN = /\badd to cart\b|\bbuy now\b/i;
const DATE_CARRYING_TYPES = [
  "Article",
  "NewsArticle",
  "BlogPosting",
  "WebPage",
];

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

function hasFaqSignals($: CheerioAPI): boolean {
  for (const block of parseJsonLdBlocks($)) {
    const nodes: unknown[] = [];
    collectTypeNodes(block, "FAQPage", nodes);
    if (nodes.length > 0) return true;
  }
  let questionHeadings = 0;
  $("h2, h3").each((_index, element) => {
    if (QUESTION_HEADING.test($(element).text().trim())) questionHeadings += 1;
  });
  return questionHeadings >= 2;
}

function hasProductSignals($: CheerioAPI): boolean {
  if ($(PRICE_SELECTOR).length > 0) return true;
  return CART_PATTERN.test(pageText($));
}

/** Best-effort page-type classification from on-page signals (REE-5). */
export function pageTypeOf($: CheerioAPI): EeatPageType {
  if (hasFaqSignals($)) return "faq";
  if (hasProductSignals($)) return "product";
  if ($("article").length > 0 || $(AUTHOR_SELECTOR).length > 0) {
    return "article";
  }
  return "page";
}

export function assessWordCount($: CheerioAPI): WordCountInfo {
  const count = countWords(pageText($));
  const pageType = pageTypeOf($);
  const benchmark = WORD_BENCHMARKS[pageType];
  return {
    count,
    pageType,
    benchmark,
    status: count >= benchmark ? "above_benchmark" : "below_benchmark",
  };
}

/**
 * Heading hierarchy check (REE-6). Walks headings in document order; a level
 * jump deeper than +1 (e.g. H1 -> H3) raises a `H{prev+1}_skipped` warning.
 * `score` is informational: presence bonuses for H1/H2/H3/H4+ minus 40 per
 * skip warning, clamped to 0-100 — a clean hierarchy scores higher than a
 * skipped one.
 */
export function assessHeadings($: CheerioAPI): HeadingMeta {
  const levels: number[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_index, element) => {
    const tagName = ($(element).prop("tagName") ?? "").toUpperCase();
    levels.push(Number(tagName.replace("H", "")));
  });

  const warnings: string[] = [];
  let previous = 0;
  for (const level of levels) {
    if (previous > 0 && level > previous + 1) {
      warnings.push(`H${previous + 1}_skipped`);
    }
    previous = level;
  }

  const present = new Set(levels);
  let score = 0;
  if (present.has(1)) score += HEADING_H1_BONUS;
  if (present.has(2)) score += HEADING_H2_BONUS;
  if (present.has(3)) score += HEADING_H3_BONUS;
  if (levels.some((level) => level >= 4)) score += HEADING_H4_BONUS;
  score -= warnings.length * HEADING_SKIP_PENALTY;
  score = Math.max(0, Math.min(HEADING_MAX, score));

  return { count: levels.length, score, warnings, levels };
}

interface DatePair {
  datePublished?: string;
  dateModified?: string;
}

function readLdDates($: CheerioAPI): DatePair | null {
  for (const block of parseJsonLdBlocks($)) {
    const nodes: unknown[] = [];
    for (const type of DATE_CARRYING_TYPES) {
      collectTypeNodes(block, type, nodes);
    }
    for (const node of nodes) {
      const record = node as Record<string, unknown>;
      const datePublished =
        typeof record.datePublished === "string"
          ? record.datePublished
          : undefined;
      const dateModified =
        typeof record.dateModified === "string"
          ? record.dateModified
          : undefined;
      if (datePublished || dateModified) return { datePublished, dateModified };
    }
  }
  return null;
}

/** First non-empty content attribute among the given meta selectors. */
function firstMetaContent($: CheerioAPI, selectors: string[]): string | null {
  for (const selector of selectors) {
    const value = ($(selector).first().attr("content") ?? "").trim();
    if (value.length > 0) return value;
  }
  return null;
}

function readMetaDates($: CheerioAPI): DatePair {
  const datePublished = firstMetaContent($, [
    'meta[property="article:published_time"]',
    'meta[property="og:article:published_time"]',
    'meta[name="date"]',
    'meta[name="pubdate"]',
    'meta[name="publishdate"]',
    'meta[name="dc.date"]',
  ]);
  const dateModified = firstMetaContent($, [
    'meta[property="article:modified_time"]',
    'meta[name="last-modified"]',
    'meta[name="dc.modified"]',
  ]);
  return {
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
  };
}

function readDomDates($: CheerioAPI): DatePair {
  const datePublished = firstMetaContent($, [
    "time[datetime]",
    '[class*="datePublished"]',
    '[class*="post-date"]',
  ]);
  const dateModified = firstMetaContent($, ['[class*="dateModified"]']);
  return {
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
  };
}

/** Returns the date string only when it parses to a valid timestamp. */
function parseDate(value: string | undefined): string | null {
  if (!value) return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

/**
 * Freshness extraction (REE-7), source priority JSON-LD -> meta -> DOM.
 * `now` is injectable so tests are deterministic; default is the wall clock.
 * Days-since uses the last modification date (falling back to publication).
 */
export function assessFreshness(
  $: CheerioAPI,
  now: () => number = () => Date.now(),
): FreshnessInfo {
  const ld = readLdDates($);
  const meta = readMetaDates($);
  const dom = readDomDates($);
  const datePublished = parseDate(
    ld?.datePublished ?? meta.datePublished ?? dom.datePublished,
  );
  const dateModified = parseDate(
    ld?.dateModified ??
      meta.dateModified ??
      dom.dateModified ??
      datePublished ??
      undefined,
  );

  if (!datePublished && !dateModified) {
    return {
      datePublished: null,
      dateModified: null,
      daysSinceModification: null,
      source: null,
      finding: "no_date_detected",
    };
  }

  const source: FreshnessInfo["source"] = ld
    ? "json_ld"
    : meta.datePublished || meta.dateModified
      ? "meta"
      : "dom";
  const base = (dateModified ?? datePublished) as string;
  const daysSinceModification = Math.floor((now() - Date.parse(base)) / DAY_MS);
  return {
    datePublished,
    dateModified,
    daysSinceModification,
    source,
    finding: "date_detected",
  };
}
