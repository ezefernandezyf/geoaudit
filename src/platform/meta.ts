import type { CheerioAPI } from "cheerio";
import type {
  MetaAnalysis,
  OgPropertyKey,
  OpenGraphAnalysis,
  PlatformFinding,
  TagPresence,
  TwitterAnalysis,
  TwitterPropertyKey,
} from "./types";

/**
 * Meta tag analysis (RPL-2..RPL-4). Pure functions over the Cheerio DOM:
 * title/description/viewport presence and quality (RPL-2), Open Graph
 * coverage (RPL-3) and Twitter Card coverage (RPL-4). Findings are
 * collected, never thrown.
 */

const OG_PROPERTIES: OgPropertyKey[] = [
  "og:title",
  "og:description",
  "og:image",
  "og:url",
  "og:type",
];

const TWITTER_PROPERTIES: TwitterPropertyKey[] = [
  "twitter:card",
  "twitter:title",
  "twitter:description",
  "twitter:image",
];

/** First non-empty `content` attribute matching the selector. */
function metaContent($: CheerioAPI, selector: string): string {
  return ($(selector).first().attr("content") ?? "").trim();
}

/**
 * Core meta checks (RPL-2). Score: title 40 + description 40 (full credit at
 * >=120 chars, partial at shorter) + viewport 20. Presence + quality findings.
 */
export function analyzeMeta($: CheerioAPI): MetaAnalysis {
  const title = ($("title").first().text() ?? "").trim();
  const description = metaContent($, 'meta[name="description"]');
  const hasViewport = metaContent($, 'meta[name="viewport"]').length > 0;

  const findings: PlatformFinding[] = [];
  let score = 0;

  if (title.length > 0) {
    score += 40;
  } else {
    findings.push({
      key: "missing_title",
      severity: "High",
      message: "No <title> tag detected.",
    });
  }

  if (description.length > 0) {
    score += description.length >= 120 ? 40 : 30;
    if (description.length < 120) {
      findings.push({
        key: "description_too_short",
        severity: "Info",
        message: "Meta description is shorter than 120 characters.",
      });
    }
  } else {
    findings.push({
      key: "missing_description",
      severity: "High",
      message: "No meta description detected.",
    });
  }

  if (hasViewport) {
    score += 20;
  } else {
    findings.push({
      key: "missing_viewport",
      severity: "Medium",
      message: "No viewport meta tag detected.",
    });
  }

  return {
    title: title.length > 0 ? title : null,
    titleLength: title.length,
    description: description.length > 0 ? description : null,
    descriptionLength: description.length,
    hasViewport,
    score,
    findings,
  };
}

function collectPresence(
  $: CheerioAPI,
  keys: readonly (OgPropertyKey | TwitterPropertyKey)[],
): { properties: Record<string, TagPresence>; presentCount: number } {
  const properties: Record<string, TagPresence> = {};
  let presentCount = 0;
  for (const key of keys) {
    const value = metaContent(
      $,
      `meta[property="${key}"], meta[name="${key}"]`,
    );
    const present = value.length > 0;
    properties[key] = { present, value: present ? value : null };
    if (present) presentCount += 1;
  }
  return { properties, presentCount };
}

/**
 * Open Graph coverage (RPL-3). Score = present / 5 * 100; zero coverage
 * raises the High `missing_open_graph` finding (link previews / AI crawlers),
 * partial coverage an Info `incomplete_open_graph`.
 */
export function analyzeOpenGraph($: CheerioAPI): OpenGraphAnalysis {
  const { properties, presentCount } = collectPresence($, OG_PROPERTIES);
  const findings: PlatformFinding[] = [];
  if (presentCount === 0) {
    findings.push({
      key: "missing_open_graph",
      severity: "High",
      message:
        "No Open Graph tags detected — link previews and AI crawlers see no social metadata.",
    });
  } else if (presentCount < OG_PROPERTIES.length) {
    const missing = OG_PROPERTIES.filter((key) => !properties[key].present);
    findings.push({
      key: "incomplete_open_graph",
      severity: "Info",
      message: `Incomplete Open Graph tags: ${missing.join(", ")}`,
    });
  }
  return {
    properties: properties as OpenGraphAnalysis["properties"],
    presentCount,
    score: Math.round((presentCount / OG_PROPERTIES.length) * 100),
    findings,
  };
}

/**
 * Twitter Card coverage (RPL-4). Score = present / 4 * 100; a missing
 * twitter:card raises an Info `missing_twitter_card` finding.
 */
export function analyzeTwitter($: CheerioAPI): TwitterAnalysis {
  const { properties, presentCount } = collectPresence($, TWITTER_PROPERTIES);
  const findings: PlatformFinding[] = [];
  if (presentCount === 0) {
    findings.push({
      key: "missing_twitter_card",
      severity: "Info",
      message: "No Twitter Card tags detected.",
    });
  }
  return {
    properties: properties as TwitterAnalysis["properties"],
    presentCount,
    score: Math.round((presentCount / TWITTER_PROPERTIES.length) * 100),
    findings,
  };
}
