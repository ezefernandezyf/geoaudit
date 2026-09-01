import type { CheerioAPI } from "cheerio";
import type { DimensionResult, EeatFinding } from "./types";
import {
  collectTypeNodes,
  externalLinkUrls,
  pageText,
  parseJsonLdBlocks,
} from "./text";

/**
 * Expertise dimension (REE-2, 0-25). Proxy signals:
 *
 * - Visible author byline (`.byline, [rel="author"], .author, author`) - 5.
 * - Author Person JSON-LD schema - 5; plus 2 when it carries `sameAs` links.
 * - Technical depth proxy (partial credit without any author, REE-2 scenario 3):
 *   code/pre blocks - 3; >= 3 external citations - 2; >= 3 distinct
 *   domain-specific terms - 5.
 *
 * A page with none of the author signals gets finding `no_author_detected`.
 */

export const AUTHOR_SELECTOR = '.byline, [rel="author"], .author, author';
export const JSONLD_SELECTOR = 'script[type="application/ld+json"]';

export const EXPERTISE_BYLINE_BONUS = 5;
export const EXPERTISE_PERSON_SCHEMA_BONUS = 5;
export const EXPERTISE_SAMEAS_BONUS = 2;
export const EXPERTISE_CODE_BONUS = 3;
export const EXPERTISE_CITATIONS_BONUS = 2;
export const EXPERTISE_DOMAIN_TERM_BONUS = 5;
export const EXPERTISE_MIN_CITATIONS = 3;
export const EXPERTISE_MIN_DOMAIN_TERMS = 3;
export const EXPERTISE_MAX = 25;

/** Small technical-vocabulary list used as the domain-term density proxy. */
export const DOMAIN_TERMS = [
  "api",
  "sdk",
  "algorithm",
  "latency",
  "throughput",
  "schema",
  "crawl",
  "index",
  "https",
  "protocol",
  "cache",
  "benchmark",
  "rendering",
  "server-side",
] as const;

function isPersonSameAs(personNode: unknown): boolean {
  const sameAs = (personNode as Record<string, unknown>)["sameAs"];
  if (Array.isArray(sameAs)) return sameAs.length > 0;
  return typeof sameAs === "string" && sameAs.length > 0;
}

/** Distinct domain terms present in the text (word-boundary match, deduped). */
function distinctDomainTerms(text: string): string[] {
  const lower = text.toLowerCase();
  return DOMAIN_TERMS.filter((term) => new RegExp(`\\b${term}\\b`).test(lower));
}

export function scoreExpertise($: CheerioAPI): DimensionResult {
  const findings: EeatFinding[] = [];
  const byline = $(AUTHOR_SELECTOR).first().text().trim();
  const personNodes: unknown[] = [];
  for (const block of parseJsonLdBlocks($)) {
    collectTypeNodes(block, "Person", personNodes);
  }
  const personSchema = personNodes.length > 0;
  const personSameAs = personNodes.some(isPersonSameAs);
  const hasCode = $("code, pre").length > 0;
  const citations = externalLinkUrls($).length;
  const domainTerms = distinctDomainTerms(pageText($));

  let score = 0;
  if (byline.length > 0) {
    score += EXPERTISE_BYLINE_BONUS;
    findings.push({
      key: "author_byline",
      label: "Author byline detected",
      detail: byline.slice(0, 80),
    });
  }
  if (personSchema) {
    score += EXPERTISE_PERSON_SCHEMA_BONUS;
    findings.push({
      key: "author_schema",
      label: "Author Person schema present",
    });
  }
  if (personSameAs) {
    score += EXPERTISE_SAMEAS_BONUS;
    findings.push({
      key: "author_schema_sameas",
      label: "Person schema includes sameAs links",
    });
  }
  if (hasCode) {
    score += EXPERTISE_CODE_BONUS;
    findings.push({
      key: "code_blocks",
      label: "Code or preformatted blocks present",
    });
  }
  if (citations >= EXPERTISE_MIN_CITATIONS) {
    score += EXPERTISE_CITATIONS_BONUS;
    findings.push({
      key: "citation_density",
      label: "External citations detected",
      detail: `${citations} citation(s)`,
    });
  }
  if (domainTerms.length >= EXPERTISE_MIN_DOMAIN_TERMS) {
    score += EXPERTISE_DOMAIN_TERM_BONUS;
    findings.push({
      key: "domain_terms",
      label: "Domain-specific terminology detected",
      detail: domainTerms.slice(0, 5).join(", "),
    });
  }
  if (byline.length === 0 && !personSchema) {
    findings.push({
      key: "no_author_detected",
      label: "No author byline, bio link or Person schema detected",
    });
  }
  return { score: Math.min(EXPERTISE_MAX, score), findings };
}
