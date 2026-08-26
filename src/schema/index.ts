import type { CheerioAPI } from "cheerio";
import type { SchemaResult } from "@/lib/contracts/audit-result";
import { detectBusinessType } from "./classify";
import { extractJsonLd } from "./extract";
import { generateCorrected, primaryTypeFor } from "./generate";
import { parseBlocks } from "./parse";
import type {
  BusinessType,
  ParsedBlock,
  ParseWarning,
  RubricCriterion,
  SchemaEngineResult,
  SchemaRubric,
  ValidatedNode,
} from "./types";
import { hasValue, validateBlocks } from "./validate";

/**
 * Schema engine public surface (RSC-1..RSC-12).
 *
 * Pipeline: extract -> parse -> validate -> classify -> generate, then a
 * 12-criterion rubric (geo-schema skill §Scoring Rubric, 0-100) over the
 * validated nodes. `scoreSchema($)` returns the rich engine-local result;
 * `toContractResult` maps it to the shared `SchemaResult` contract consumed
 * by AuditResult (T25).
 *
 * The engine never throws: pages without structured data produce a clean
 * empty result with reason "no_structured_data" (RSC-11) and invalid JSON
 * blocks become warnings (RSC-12).
 */

const HTTP_URL_RE = /^https?:\/\//i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * The detected JSON-LD as records: plain objects as-is (the @graph wrapper is
 * preserved per RSC-10), top-level arrays unwrapped to their record items.
 */
function detectedRecords(blocks: ParsedBlock[]): Record<string, unknown>[] {
  const detected: Record<string, unknown>[] = [];
  for (const block of blocks) {
    if (Array.isArray(block.data)) {
      detected.push(...block.data.filter(isRecord));
    } else if (isRecord(block.data)) {
      detected.push(block.data);
    }
  }
  return detected;
}

export function scoreSchema($: CheerioAPI): SchemaEngineResult {
  const rawBlocks = extractJsonLd($);
  const { blocks, warnings, reason } = parseBlocks(rawBlocks);
  const { nodes, issues } = validateBlocks(blocks);
  const businessType = detectBusinessType($, blocks);
  const generated = generateCorrected(blocks, businessType);
  const rubric = scoreRubric({ blocks, warnings, nodes, businessType });

  return {
    detected: detectedRecords(blocks),
    warnings,
    nodes,
    issues,
    businessType,
    generated,
    rubric,
    score: rubric.score,
    reason,
  };
}

function criterion(
  key: string,
  label: string,
  points: number,
  max: number,
): RubricCriterion {
  return { key, label, points, max };
}

function hasIssue(node: ValidatedNode, key: string): boolean {
  return node.issues.some((issue) => issue.key === key);
}

function isOrgOrPerson(node: ValidatedNode): boolean {
  return (
    node.registryType === "organization" ||
    (node.registryType === "article_person" && node.type === "Person")
  );
}

const ARTICLE_TYPES = ["Article", "NewsArticle", "BlogPosting", "TechArticle"];

function isArticleLike(type: string): boolean {
  return ARTICLE_TYPES.includes(type);
}

function countValidSameAs(record: Record<string, unknown>): number {
  const value = record["sameAs"];
  if (value === undefined || value === null) return 0;
  const values = Array.isArray(value) ? value : [value];
  return values.filter(
    (entry): entry is string =>
      typeof entry === "string" && HTTP_URL_RE.test(entry.trim()),
  ).length;
}

function knowsAboutCount(record: Record<string, unknown>): number {
  const value = record["knowsAbout"];
  if (Array.isArray(value)) return value.length;
  if (typeof value === "string" && value.trim() !== "") return 1;
  return 0;
}

/** Criterion 3: full author (name + url/sameAs) 10, name only 5, none 0. */
function articleAuthorPoints(articles: ValidatedNode[]): number {
  for (const article of articles) {
    const author = article.raw["author"];
    if (
      author !== null &&
      typeof author === "object" &&
      !Array.isArray(author)
    ) {
      const authorRecord = author as Record<string, unknown>;
      const hasName =
        typeof authorRecord["name"] === "string" &&
        authorRecord["name"].trim() !== "";
      if (hasName) {
        return hasValue(authorRecord, "url") || hasValue(authorRecord, "sameAs")
          ? 10
          : 5;
      }
    }
  }
  return 0;
}

interface RubricInput {
  blocks: ParsedBlock[];
  warnings: ParseWarning[];
  nodes: ValidatedNode[];
  businessType: BusinessType;
}

/**
 * 12-criterion scoring rubric (geo-schema skill, sums to 100):
 * 1 Organization/Person present+complete (15) · 2 sameAs links (15) ·
 * 3 Article with author (10) · 4 business-type schema (10) ·
 * 5 WebSite+SearchAction (5) · 6 BreadcrumbList (5) · 7 JSON-LD format (5) ·
 * 8 Server-rendered (10) · 9 speakable (5) · 10 Valid JSON+types (10) ·
 * 11 knowsAbout 3+ (5) · 12 No deprecated (5).
 *
 * WU-3 (RSC-13): criteria 1/5/10/11 award intermediate points for partial
 * compliance instead of only the discrete 0/5/10/15 steps.
 */
export function scoreRubric(input: RubricInput): SchemaRubric {
  const { blocks, warnings, nodes, businessType } = input;
  const hasBlocks = blocks.length > 0;
  const criteria: RubricCriterion[] = [];

  const orgPerson = nodes.filter(isOrgOrPerson);

  // 1. Organization/Person present and complete — partial-credit tiers
  // (RSC-13): all nodes clean → 15; complete but with minor issues or a
  // mix of clean/incomplete nodes → 13; missing ONE required property →
  // 10; missing 2+ required properties → 7; absent → 0.
  const allOrgPersonClean =
    orgPerson.length > 0 && orgPerson.every((node) => node.issues.length === 0);
  const anyOrgPersonClean = orgPerson.some((node) => node.issues.length === 0);
  const maxMissingRequired = orgPerson.reduce((max, node) => {
    const count = node.issues.filter(
      (issue) => issue.key === "missing_required",
    ).length;
    return Math.max(max, count);
  }, 0);
  const orgPersonPoints =
    orgPerson.length === 0
      ? 0
      : allOrgPersonClean
        ? 15
        : anyOrgPersonClean || maxMissingRequired === 0
          ? 13
          : maxMissingRequired === 1
            ? 10
            : 7;
  criteria.push(
    criterion(
      "organization_person",
      "Organization/Person schema present and complete",
      orgPersonPoints,
      15,
    ),
  );

  // 2. sameAs links: 3 per valid link, max 15.
  const sameAsCount = nodes.reduce(
    (sum, node) => sum + countValidSameAs(node.raw),
    0,
  );
  criteria.push(
    criterion(
      "same_as",
      "sameAs links (3 per valid link, max 15)",
      Math.min(15, sameAsCount * 3),
      15,
    ),
  );

  // 3. Article schema with author details.
  const articles = nodes.filter((node) => isArticleLike(node.type));
  criteria.push(
    criterion(
      "article_author",
      "Article schema with author details",
      articleAuthorPoints(articles),
      10,
    ),
  );

  // 4. Business-type-specific schema present and complete.
  const primary = primaryTypeFor(businessType);
  const primaryNodes = nodes.filter((node) => node.type === primary);
  const primaryComplete =
    primaryNodes.length > 0 &&
    primaryNodes.some((node) => !hasIssue(node, "missing_required"));
  criteria.push(
    criterion(
      "business_type_schema",
      `Business-type schema (${primary}) present and complete`,
      primaryNodes.length === 0 ? 0 : primaryComplete ? 10 : 5,
      10,
    ),
  );

  // 5. WebSite + SearchAction — partial credit for a WebSite node without
  // the SearchAction (RSC-13): 2 points, full 5 with potentialAction.
  const website = nodes.find((node) => node.type === "WebSite");
  const websitePoints =
    website === undefined
      ? 0
      : hasValue(website.raw, "potentialAction")
        ? 5
        : 2;
  criteria.push(
    criterion(
      "website_search_action",
      "WebSite + SearchAction",
      websitePoints,
      5,
    ),
  );

  // 6. BreadcrumbList on inner pages.
  criteria.push(
    criterion(
      "breadcrumbs",
      "BreadcrumbList on inner pages",
      nodes.some((node) => node.type === "BreadcrumbList") ? 5 : 0,
      5,
    ),
  );

  // 7. JSON-LD format (this engine only detects JSON-LD; Microdata/RDFa are
  // out of scope, so the full 5 points apply when any block exists).
  criteria.push(
    criterion(
      "json_ld_format",
      "JSON-LD format (not Microdata/RDFa)",
      hasBlocks ? 5 : 0,
      5,
    ),
  );

  // 8. Server-rendered: blocks found in the static HTML source count as
  // server-rendered (no JS execution is ever performed here).
  criteria.push(
    criterion(
      "server_rendered",
      "Server-rendered (found in HTML source)",
      hasBlocks ? 10 : 0,
      10,
    ),
  );

  // 9. speakable on articles.
  criteria.push(
    criterion(
      "speakable",
      "speakable property on articles",
      articles.some((node) => hasValue(node.raw, "speakable")) ? 5 : 0,
      5,
    ),
  );

  // 10. Valid JSON + valid Schema.org types: no credit without blocks; major
  // error when every block failed to parse; full credit with zero issues;
  // intermediate 7 when warnings or unknown types are present (RSC-13).
  const unknownCount = nodes.filter((node) => !node.known).length;
  const allBlocksFailed = hasBlocks && nodes.length === 0;
  const validity =
    !hasBlocks || allBlocksFailed
      ? 0
      : warnings.length === 0 && unknownCount === 0
        ? 10
        : 7;
  criteria.push(
    criterion(
      "valid_json_types",
      "Valid JSON + valid Schema.org types",
      validity,
      10,
    ),
  );

  // 11. knowsAbout with 3+ topics on Organization/Person — partial credit
  // for 1-2 topics (RSC-13).
  const maxKnowsAbout = orgPerson.reduce(
    (max, node) => Math.max(max, knowsAboutCount(node.raw)),
    0,
  );
  criteria.push(
    criterion(
      "knows_about",
      "knowsAbout with 3+ topics on Organization/Person",
      maxKnowsAbout >= 3 ? 5 : maxKnowsAbout > 0 ? 2 : 0,
      5,
    ),
  );

  // 12. No deprecated schemas (credit only applies when schema exists).
  const hasDeprecated = nodes.some((node) =>
    node.issues.some((issue) => issue.key.startsWith("deprecated_")),
  );
  criteria.push(
    criterion(
      "no_deprecated",
      "No deprecated schemas present",
      hasBlocks && !hasDeprecated ? 5 : 0,
      5,
    ),
  );

  const score = criteria.reduce((sum, c) => sum + c.points, 0);
  return { score, criteria };
}

/**
 * Maps the rich engine output to the shared `SchemaResult` contract:
 * detected records as-is, issues flattened to strings (parse warnings with
 * their block index + validation issue messages), generated JSON-LD and the
 * business type.
 */
export function toContractResult(result: SchemaEngineResult): SchemaResult {
  return {
    detected: result.detected,
    issues: [
      ...result.warnings.map(
        (warning) => `Block ${warning.index}: ${warning.message}`,
      ),
      ...result.issues.map((issue) => issue.message),
    ],
    generated: result.generated,
    businessType: result.businessType,
  };
}
