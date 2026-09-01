import type { CheerioAPI } from "cheerio";
import type { DimensionResult, EeatFinding } from "./types";
import { pageText } from "./text";

/**
 * Trustworthiness dimension (REE-4, 0-25). Proxy signals:
 *
 * - Contact information (mailto/tel/contact links or an <address>) - 5.
 * - Privacy policy link (href/text match) - 4.
 * - Terms of service link (href/text match) - 2.
 * - HTTPS declaration: the page declares an https:// canonical/OG URL - 3
 *   (DOM-only proxy: TLS itself is not visible from parsed HTML; the fetch
 *   layer already enforces https per SSRF guard).
 * - Review/testimonial patterns in the visible text - 3.
 * - Disclosure patterns (affiliate/sponsored) in the visible text - 3.
 *
 * Missing contact/privacy/terms signals produce explicit `missing_*` findings
 * (REE-10 graceful absence; spec scenario 2).
 */

export const TRUST_CONTACT_BONUS = 5;
export const TRUST_PRIVACY_BONUS = 4;
export const TRUST_TERMS_BONUS = 2;
export const TRUST_HTTPS_BONUS = 3;
export const TRUST_REVIEW_BONUS = 3;
export const TRUST_DISCLOSURE_BONUS = 3;
export const TRUST_MAX = 25;

const CONTACT_SELECTOR =
  'a[href^="mailto:"], a[href^="tel:"], a[href*="contact"], address';
const HTTPS_URL_SELECTOR =
  'link[rel="canonical"], meta[property="og:url"], meta[name="twitter:url"]';
const REVIEW_PATTERN = /(?:testimonials?|reviews?|customer\s+stories?)/i;
const DISCLOSURE_PATTERN =
  /(?:affiliate\s+disclosure|sponsor(?:ed)?\s+disclosure|disclosure\s+statement|disclosure)/i;

/** Any link whose href OR visible text matches the pattern. */
function anyLinkMatches($: CheerioAPI, pattern: RegExp): boolean {
  let found = false;
  $("a").each((_index, element) => {
    const href = $(element).attr("href") ?? "";
    const text = $(element).text();
    if (pattern.test(href) || pattern.test(text)) found = true;
  });
  return found;
}

/** True when the page declares a canonical/OG/twitter URL over https://. */
function declaresHttps($: CheerioAPI): boolean {
  let found = false;
  $(HTTPS_URL_SELECTOR).each((_index, element) => {
    const value = (
      $(element).attr("href") ??
      $(element).attr("content") ??
      ""
    ).trim();
    if (/^https:\/\//i.test(value)) found = true;
  });
  return found;
}

export function scoreTrustworthiness($: CheerioAPI): DimensionResult {
  const findings: EeatFinding[] = [];
  const contact = $(CONTACT_SELECTOR).length > 0;
  const privacy = anyLinkMatches($, /\bprivacy\b/i);
  const terms = anyLinkMatches($, /\bterms\b|\btos\b/i);
  const https = declaresHttps($);
  const text = pageText($);
  const reviews = REVIEW_PATTERN.test(text);
  const disclosure = DISCLOSURE_PATTERN.test(text);

  let score = 0;
  if (contact) {
    score += TRUST_CONTACT_BONUS;
    findings.push({
      key: "contact_info",
      label: "Contact information visible",
    });
  } else {
    findings.push({
      key: "missing_contact_info",
      label: "No contact information found",
    });
  }
  if (privacy) {
    score += TRUST_PRIVACY_BONUS;
    findings.push({
      key: "privacy_policy",
      label: "Privacy policy linked",
    });
  } else {
    findings.push({
      key: "missing_privacy_policy",
      label: "No privacy policy link found",
    });
  }
  if (terms) {
    score += TRUST_TERMS_BONUS;
    findings.push({
      key: "terms_of_service",
      label: "Terms of service linked",
    });
  } else {
    findings.push({
      key: "missing_terms_of_service",
      label: "No terms of service link found",
    });
  }
  if (https) {
    score += TRUST_HTTPS_BONUS;
    findings.push({
      key: "https",
      label: "Page declares an HTTPS canonical/OG URL",
    });
  } else {
    findings.push({
      key: "no_https",
      label: "No HTTPS URL declaration found (canonical/OG)",
    });
  }
  if (reviews) {
    score += TRUST_REVIEW_BONUS;
    findings.push({
      key: "reviews",
      label: "Review or testimonial patterns present",
    });
  }
  if (disclosure) {
    score += TRUST_DISCLOSURE_BONUS;
    findings.push({
      key: "disclosure",
      label: "Affiliate/sponsorship disclosure present",
    });
  }
  return { score: Math.min(TRUST_MAX, score), findings };
}
