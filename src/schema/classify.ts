import type { Cheerio, CheerioAPI } from "cheerio";
import { collectTypeNames } from "./parse";
import type { AnyNode, BusinessType, ParsedBlock } from "./types";

/**
 * Business-type detection (RSC-8): SaaS / local / ecommerce / publisher /
 * agency / hybrid, driven by on-page signals from the DOM and the parsed
 * JSON-LD blocks.
 *
 * Each business type scores a small set of boolean signals (schema types
 * present, navigation words, visible-text phrases, DOM markers such as
 * `<address>` or `tel:` links). The type with the unique highest score wins;
 * a tie between two or more types - or zero signals at all - resolves to
 * "hybrid" (neutral).
 *
 * Heuristic, single-page proxy: the output is labeled as such downstream.
 * Helpers are local to this engine (engines stay independent - no imports
 * from eeat/citability).
 */

/** Regions stripped from the visible text scan (boilerplate, not content). */
const BOILERPLATE_SELECTOR =
  "script, style, noscript, nav, footer, aside, .sidebar, .ads";

/** Clone of <body> with boilerplate regions removed. Shared DOM untouched. */
export function pageBodyClone($: CheerioAPI): Cheerio<AnyNode> {
  const body = $("body").clone();
  body.find(BOILERPLATE_SELECTOR).remove();
  return body;
}

/** Visible page text, lowercased, for phrase scans. */
export function pageTextLower($: CheerioAPI): string {
  return pageBodyClone($).text().toLowerCase();
}

/** Navigation/header link text, lowercased, for nav-word scans. */
export function navTextLower($: CheerioAPI): string {
  return $("nav, header").text().toLowerCase();
}

function textHas(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

function hasTelLink($: CheerioAPI): boolean {
  return $('a[href^="tel:"]').length > 0;
}

function hasAddressMarkup($: CheerioAPI): boolean {
  return (
    $("address").length > 0 ||
    $('[itemprop="address"]').length > 0 ||
    $('[itemtype*="PostalAddress"]').length > 0
  );
}

function hasByline($: CheerioAPI): boolean {
  return $(".byline, [rel='author'], .author, [itemprop='author']").length > 0;
}

interface SignalScores {
  saas: number;
  local: number;
  ecommerce: number;
  publisher: number;
  agency: number;
}

export function detectBusinessType(
  $: CheerioAPI,
  blocks: ParsedBlock[],
): BusinessType {
  const text = pageTextLower($);
  const nav = navTextLower($);
  const typeNames = collectTypeNames(blocks).map((name) => name.toLowerCase());

  const scores: SignalScores = {
    saas: 0,
    local: 0,
    ecommerce: 0,
    publisher: 0,
    agency: 0,
  };

  // SaaS: software schema + product-company vocabulary.
  if (typeNames.includes("softwareapplication")) scores.saas += 1;
  if (textHas(text, /\b(sign up|get started|free trial)\b/)) scores.saas += 1;
  if (textHas(text, /\bdashboard\b/)) scores.saas += 1;
  if (textHas(nav, /\b(login|log in)\b/)) scores.saas += 1;
  if (textHas(nav, /\bpricing\b/)) scores.saas += 1;

  // Ecommerce: product schema + shop/cart/price vocabulary.
  if (typeNames.includes("product")) scores.ecommerce += 1;
  if (textHas(text, /\b(add to cart|add to basket|buy now|checkout)\b/))
    scores.ecommerce += 1;
  if (textHas(nav, /\bcart\b/)) scores.ecommerce += 1;
  if (textHas(text, /[\$€£]\s?\d/)) scores.ecommerce += 1;
  if (textHas(nav, /\b(shop|store)\b/)) scores.ecommerce += 1;

  // Local: local schema + physical-presence markers.
  if (typeNames.includes("localbusiness")) scores.local += 1;
  if (hasTelLink($)) scores.local += 1;
  if (hasAddressMarkup($)) scores.local += 1;
  if (textHas(text, /\b(directions|opening hours|visit us|find us)\b/))
    scores.local += 1;

  // Publisher: article schema + editorial markers.
  if (
    typeNames.some((name) =>
      ["article", "newsarticle", "blogposting"].includes(name),
    )
  ) {
    scores.publisher += 1;
  }
  if (hasByline($)) scores.publisher += 1;
  if (textHas(text, /\b(blog|newsroom|magazine|journal)\b/))
    scores.publisher += 1;
  if (textHas(text, /\bread more\b/)) scores.publisher += 1;

  // Agency: agency copy + portfolio language.
  if (textHas(text, /\b(agency|studio|consultancy)\b/)) scores.agency += 1;
  if (
    textHas(text, /\b(our services|what we do|our work|portfolio|case stud)\b/)
  )
    scores.agency += 1;
  if (textHas(text, /\b(work with us|hire us|get a quote)\b/))
    scores.agency += 1;

  return resolveType(scores);
}

function resolveType(scores: SignalScores): BusinessType {
  const entries = Object.entries(scores) as [
    Exclude<BusinessType, "hybrid">,
    number,
  ][];
  const max = Math.max(...entries.map(([, score]) => score));
  if (max <= 0) return "hybrid";
  const leaders = entries.filter(([, score]) => score === max);
  if (leaders.length > 1) return "hybrid";
  return leaders[0][0];
}
