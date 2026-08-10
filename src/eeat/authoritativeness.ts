import type { CheerioAPI } from "cheerio";
import type { DimensionResult, EeatFinding } from "./types";
import { externalLinkUrls } from "./text";

/**
 * Authoritativeness dimension (REE-3, 0-25). Proxy signals for third-party
 * recognition:
 *
 * - External citations: absolute http(s) links on the page — 2 points per
 *   link, capped at 10 (5 links).
 * - Authority-domain matches: citations whose hostname is a known authority
 *   (`.gov`/`.edu` suffix or the AUTHORITY_DOMAINS list) — 3 points per
 *   match, capped at 15 (5 matches).
 *
 * Hostname matching uses the full hostname (e.g. "en.wikipedia.org" matches
 * the "wikipedia.org" entry). A page with zero external links reports
 * `no_external_citations` and scores 0 (REE-10).
 */

export const AUTHORITY_DOMAIN_SUFFIXES = [".gov", ".edu"] as const;
export const AUTHORITY_DOMAINS = [
  "wikipedia.org",
  "github.com",
  "w3.org",
  "scholar.google.com",
  "nature.com",
  "ieee.org",
  "acm.org",
  "arxiv.org",
  "openai.com",
  "anthropic.com",
  "mozilla.org",
  "developer.mozilla.org",
  "imdb.com",
] as const;

export const AUTHORITY_CITATION_PER_HIT = 2;
export const AUTHORITY_CITATION_CAP = 10;
export const AUTHORITY_DOMAIN_PER_HIT = 3;
export const AUTHORITY_DOMAIN_CAP = 15;
export const AUTHORITATIVENESS_MAX = 25;

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isAuthorityDomain(host: string): boolean {
  if (host.length === 0) return false;
  if (AUTHORITY_DOMAIN_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return true;
  }
  return AUTHORITY_DOMAINS.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}

export function scoreAuthoritativeness($: CheerioAPI): DimensionResult {
  const findings: EeatFinding[] = [];
  const urls = externalLinkUrls($);
  if (urls.length === 0) {
    return {
      score: 0,
      findings: [
        {
          key: "no_external_citations",
          label: "No external citations detected",
        },
      ],
    };
  }

  const authorityHits = urls.map(hostnameOf).filter(isAuthorityDomain);
  findings.push({
    key: "external_citations",
    label: "External citations detected",
    detail: `${urls.length} link(s)`,
  });

  let score = Math.min(
    AUTHORITY_CITATION_CAP,
    urls.length * AUTHORITY_CITATION_PER_HIT,
  );
  if (authorityHits.length > 0) {
    score += Math.min(
      AUTHORITY_DOMAIN_CAP,
      authorityHits.length * AUTHORITY_DOMAIN_PER_HIT,
    );
    findings.push({
      key: "authority_domains",
      label: "Citations to authority domains",
      detail: authorityHits.join(", "),
    });
  }
  return { score: Math.min(AUTHORITATIVENESS_MAX, score), findings };
}
