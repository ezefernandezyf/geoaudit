import type { HeaderAnalysis, PlatformFinding } from "./types";

/**
 * HTTP header checks (RPL-1). Pure function over a Web Headers object —
 * zero network. Validates Content-Type as HTML, records X-Robots-Tag
 * directives, the canonical Link header, HSTS and CSP. Findings are
 * collected, never thrown.
 */

const CANONICAL_LINK_RE = /<([^>]+)>\s*;\s*rel="canonical"/i;
const NOINDEX_RE = /\bnoindex\b/i;

export function analyzeHeaders(headers: Headers): HeaderAnalysis {
  const contentType = headers.get("content-type");
  const contentTypeValidHtml =
    contentType !== null && contentType.includes("text/html");
  const xRobotsTag = headers.get("x-robots-tag");
  const hasNoindex = xRobotsTag !== null && NOINDEX_RE.test(xRobotsTag);
  const link = headers.get("link");
  const canonicalMatch = link?.match(CANONICAL_LINK_RE);
  const canonicalLink = canonicalMatch ? canonicalMatch[1] : null;
  const hasHsts = headers.get("strict-transport-security") !== null;
  const hasCsp = headers.get("content-security-policy") !== null;

  const findings: PlatformFinding[] = [];
  if (!contentTypeValidHtml) {
    findings.push({
      key: "invalid_content_type",
      severity: "High",
      message: `Content-Type is not HTML: ${contentType ?? "missing"}`,
    });
  }
  if (hasNoindex) {
    findings.push({
      key: "x_robots_noindex",
      severity: "High",
      message:
        "X-Robots-Tag contains noindex — the page is excluded from search engines and AI crawlers.",
    });
  }
  if (!canonicalLink) {
    findings.push({
      key: "missing_canonical_header",
      severity: "Low",
      message:
        "No canonical Link header — duplicate-content risk for crawlers.",
    });
  }
  if (!hasHsts) {
    findings.push({
      key: "missing_hsts",
      severity: "Info",
      message: "No Strict-Transport-Security header.",
    });
  }
  if (!hasCsp) {
    findings.push({
      key: "missing_csp",
      severity: "Info",
      message: "No Content-Security-Policy header.",
    });
  }

  return {
    contentType,
    contentTypeValidHtml,
    xRobotsTag,
    hasNoindex,
    canonicalLink,
    hasHsts,
    hasCsp,
    findings,
  };
}
