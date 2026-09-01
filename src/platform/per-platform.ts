import type { Cheerio, CheerioAPI } from "cheerio";
import type {
  MetaAnalysis,
  PlatformCriterion,
  PlatformId,
  PlatformNode,
  PlatformScore,
  PlatformStructure,
  SsrAnalysis,
} from "./types";

/**
 * Per-platform on-page readiness scoring (RPL-10) + external-criteria labeling
 * (RPL-11). `extractStructure` pulls the on-page structure signals from the
 * shared DOM (engine-local, never mutating it); `scorePlatforms` maps those
 * signals through five platform rubrics drawn from the geo-platform-optimizer
 * skill - measured criteria only for what a single-page audit can see.
 * External-presence criteria (Wikipedia, Reddit, YouTube, Bing WMT, IndexNow)
 * are labeled "not_measured" with the mandated rationale: they arrive with the
 * brand-mention scanner in a future sprint.
 */

export const NOT_MEASURED_NOTE =
  "Requires brand-mention scanner (future sprint)";

const FAQ_SELECTOR = '[id*="faq"], [class*="faq"], [itemtype*="FAQPage"]';
const BYLINE_SELECTOR =
  '.byline, [rel="author"], meta[name="author"], [class*="author"]';
const ABOUT_SELECTOR =
  '[class*="about"], [id="about"], [itemprop="about"], a[href*="/about"]';
const DATE_SELECTOR =
  'time[datetime], [itemprop="datePublished"], [itemprop="dateModified"], [class*="date"]';

function questionHeadingsIn(
  $: CheerioAPI,
  scope: Cheerio<PlatformNode>,
): number {
  let count = 0;
  scope.find("h2, h3").each((_index, element) => {
    const text = ($(element).text() ?? "").trim();
    if (
      text.length > 0 &&
      (/\?\s*$/.test(text) ||
        /^(what|who|whom|whose|which|when|where|why|how|is|are|was|were|do|does|did|can|could|should|would|will|may|might)\b/i.test(
          text,
        ))
    ) {
      count += 1;
    }
  });
  return count;
}

/** Visible page text with script/style/noscript/template stripped (clone - never mutates). */
function visibleBodyText($: CheerioAPI): string {
  const body = $("body").clone();
  body.find("script, style, noscript, template").remove();
  return body.text() ?? "";
}

/**
 * Collects the on-page structure signals consumed by the five rubrics.
 * `ssr` carries the question/answer counts from the SSR analysis (RPL-8/RPL-9);
 * `meta` carries the description presence/quality from the meta analysis (RPL-2).
 */
export function extractStructure(
  $: CheerioAPI,
  ssr: Pick<
    SsrAnalysis,
    "questionHeadingCount" | "directAnswerCount" | "status"
  >,
  meta: Pick<MetaAnalysis, "description" | "descriptionLength">,
): PlatformStructure {
  const visibleText = visibleBodyText($).trim();
  const wordCount =
    visibleText.length > 0
      ? visibleText.split(/\s+/).filter(Boolean).length
      : 0;

  // FAQ section: an explicit FAQ container (or 5+ question headings as a
  // structural proxy). Question count comes from headings inside the FAQ
  // container, falling back to the total question count.
  const faqSectionElements = $(FAQ_SELECTOR);
  const hasFaqSection =
    faqSectionElements.length > 0 || ssr.questionHeadingCount >= 5;
  const faqQuestions =
    hasFaqSection && faqSectionElements.length > 0
      ? questionHeadingsIn($, faqSectionElements)
      : ssr.questionHeadingCount;

  // Heading hierarchy: no level jumps deeper than +1 (H1 > H2 > H3 clean).
  const headingLevels: number[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_index, element) => {
    const tagName = ($(element).prop("tagName") ?? "H1").toUpperCase();
    headingLevels.push(Number(tagName.replace("H", "")));
  });
  let headingHierarchyClean = true;
  let previous = 0;
  for (const level of headingLevels) {
    if (previous > 0 && level > previous + 1) {
      headingHierarchyClean = false;
      break;
    }
    previous = level;
  }

  // Image alt coverage (Gemini multi-modal criterion proxy).
  const images = $("img").length;
  let altCount = 0;
  $("img").each((_index, element) => {
    if (($(element).attr("alt") ?? "").trim().length > 0) altCount += 1;
  });
  const imageAltCoverage = images > 0 ? altCount / images : 0;

  return {
    questionHeadings: ssr.questionHeadingCount,
    directAnswers: ssr.directAnswerCount,
    hasTables: $("table").length > 0,
    hasLists: $("ul, ol").length > 0,
    hasFaqSection,
    faqQuestions,
    hasDates: $(DATE_SELECTOR).length > 0,
    hasAuthorByline: $(BYLINE_SELECTOR).length > 0,
    hasAboutSection: $(ABOUT_SELECTOR).length > 0,
    hasMetaDescription:
      meta.description !== null && meta.description.length > 0,
    metaDescriptionLength: meta.descriptionLength,
    hasStructuredData: $('script[type="application/ld+json"]').length > 0,
    isSsrPresent: ssr.status === "ssr_present",
    wordCount,
    headingHierarchyClean,
    imageAltCoverage,
    hasImages: images > 0,
  };
}

function measured(
  key: string,
  label: string,
  points: number,
  max: number,
): PlatformCriterion {
  return { key, label, status: "measured", points, max, note: null };
}

function notMeasured(
  key: string,
  label: string,
  max: number,
): PlatformCriterion {
  return {
    key,
    label,
    status: "not_measured",
    points: 0,
    max,
    note: NOT_MEASURED_NOTE,
  };
}

function sumMeasured(criteria: PlatformCriterion[]): number {
  return criteria.reduce(
    (sum, criterion) =>
      sum + (criterion.status === "measured" ? criterion.points : 0),
    0,
  );
}

function buildScore(
  platform: PlatformId,
  criteria: PlatformCriterion[],
): PlatformScore {
  return { platform, score: sumMeasured(criteria), criteria };
}

/**
 * Five platform rubrics (on-page readiness subset of the geo-platform-optimizer
 * skill; each sums to 100 with external criteria labeled not_measured):
 * AIO (70 measured) · ChatGPT (20) · Perplexity (40) · Gemini (40) ·
 * Copilot (30). The score reflects only measured on-page signals.
 */
export function scorePlatforms(
  structure: PlatformStructure,
): Record<PlatformId, PlatformScore> {
  const {
    questionHeadings,
    directAnswers,
    hasTables,
    hasLists,
    faqQuestions,
    hasDates,
    hasAuthorByline,
    hasAboutSection,
    hasMetaDescription,
    metaDescriptionLength,
    hasStructuredData,
    isSsrPresent,
    wordCount,
    headingHierarchyClean,
    imageAltCoverage,
  } = structure;

  const aio = buildScore("aio", [
    measured(
      "question_headings",
      "Question-based H2/H3 headings",
      questionHeadings >= 4 ? 10 : questionHeadings >= 2 ? 5 : 0,
      10,
    ),
    measured(
      "direct_answers",
      "Direct answers after headings",
      Math.min(15, directAnswers * 3),
      15,
    ),
    measured("tables", "Tables for comparison data", hasTables ? 10 : 0, 10),
    measured("lists", "Lists for processes/features", hasLists ? 10 : 0, 10),
    measured(
      "faq_section",
      "FAQ section with 5+ questions",
      faqQuestions >= 5 ? 10 : faqQuestions >= 1 ? 5 : 0,
      10,
    ),
    measured(
      "publication_date",
      "Visible publication/updated date",
      hasDates ? 5 : 0,
      5,
    ),
    measured("author_byline", "Author byline", hasAuthorByline ? 5 : 0, 5),
    measured(
      "heading_hierarchy",
      "Clean H1>H2>H3 hierarchy",
      headingHierarchyClean ? 5 : 0,
      5,
    ),
    notMeasured("top10_rank", "Ranks in top 10 for target queries", 20),
    notMeasured("cited_statistics", "Statistics with citations", 10),
  ]);

  const chatgpt = buildScore("chatgpt", [
    measured(
      "comprehensive_content",
      "Comprehensive content (2000+ words)",
      wordCount >= 2000 ? 10 : wordCount >= 1000 ? 5 : 0,
      10,
    ),
    measured(
      "about_attribution",
      "About/attribution section present",
      hasAboutSection ? 10 : 0,
      10,
    ),
    notMeasured("wikipedia", "Wikipedia article exists", 15),
    notMeasured("wikidata", "Wikidata entity with properties", 10),
    notMeasured("bing_index", "Bing index coverage of key pages", 10),
    notMeasured("reddit", "Reddit brand presence", 10),
    notMeasured("youtube", "YouTube channel with content", 10),
    notMeasured("authoritative_backlinks", "Authoritative backlinks", 15),
    notMeasured("entity_consistency", "Entity consistency across platforms", 5),
    notMeasured("bing_wmt", "Bing Webmaster Tools configured", 5),
  ]);

  const perplexity = buildScore("perplexity", [
    measured(
      "content_freshness",
      "Visible dates (freshness signal)",
      hasDates ? 10 : 0,
      10,
    ),
    measured(
      "quotable_passages",
      "Quotable standalone paragraphs",
      Math.min(10, directAnswers * 2),
      10,
    ),
    measured(
      "original_data",
      "Original data/tables published",
      hasTables ? 15 : 0,
      15,
    ),
    measured(
      "faq_section",
      "FAQ section present",
      faqQuestions >= 2 ? 5 : 0,
      5,
    ),
    notMeasured("reddit", "Active Reddit presence", 20),
    notMeasured("community_forums", "Forum/community mentions", 10),
    notMeasured("youtube", "YouTube content with transcripts", 10),
    notMeasured("multi_source", "Multi-source claim validation", 10),
    notMeasured("wikipedia_wikidata", "Wikipedia/Wikidata presence", 5),
    notMeasured("discussion_engagement", "Discussion-generating content", 5),
  ]);

  const gemini = buildScore("gemini", [
    measured(
      "schema_markup",
      "Schema.org structured data implemented",
      hasStructuredData ? 15 : 0,
      15,
    ),
    measured(
      "image_optimization",
      "Image alt text optimization",
      imageAltCoverage >= 0.8 ? 10 : imageAltCoverage >= 0.5 ? 5 : 0,
      10,
    ),
    measured(
      "eeat_signals",
      "E-E-A-T signals (author byline + about)",
      hasAuthorByline && hasAboutSection
        ? 10
        : hasAuthorByline || hasAboutSection
          ? 5
          : 0,
      10,
    ),
    measured("ssr_content", "Server-rendered content", isSsrPresent ? 5 : 0, 5),
    notMeasured("knowledge_panel", "Google Knowledge Panel exists", 15),
    notMeasured("business_profile", "Google Business Profile complete", 10),
    notMeasured("youtube", "YouTube channel with topic content", 20),
    notMeasured("google_ecosystem", "Google ecosystem presence", 10),
    notMeasured("merchant_center", "Google Merchant Center", 5),
  ]);

  const copilot = buildScore("copilot", [
    measured(
      "meta_description",
      "Optimized meta description",
      hasMetaDescription ? (metaDescriptionLength >= 120 ? 10 : 5) : 0,
      10,
    ),
    measured(
      "structured_markup",
      "Clear structured markup",
      hasStructuredData ? 10 : 0,
      10,
    ),
    measured("faq_section", "FAQ section", faqQuestions >= 2 ? 5 : 0, 5),
    measured("ssr_content", "Server-rendered page", isSsrPresent ? 5 : 0, 5),
    notMeasured("bing_wmt", "Bing Webmaster Tools verified", 10),
    notMeasured("indexnow", "IndexNow protocol implemented", 10),
    notMeasured("bing_index", "Bing index coverage", 5),
    notMeasured("linkedin", "LinkedIn company page", 10),
    notMeasured("github", "GitHub presence", 5),
    notMeasured("social_signals", "Social media engagement signals", 10),
    notMeasured(
      "exact_keywords",
      "Exact-match keywords in titles/headings",
      10,
    ),
    notMeasured("page_speed", "Page load speed < 2s", 5),
    notMeasured("bing_places", "Bing Places configured", 5),
  ]);

  return { aio, chatgpt, perplexity, gemini, copilot };
}
