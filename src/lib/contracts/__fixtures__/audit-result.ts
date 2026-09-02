import type { AuditResult } from "@/lib/contracts/audit-result";

/**
 * Hand-authored valid AuditResult fixture for contract tests (T2, RAO-10).
 * Mirrors the D3 design shape: summary + 5 engine sections + model version + meta.
 */
export const auditResultFixture: AuditResult = {
  summary: {
    url: "https://example.com/",
    geoScore: 68,
    severityBand: "Fair",
    durationMs: 3214,
  },
  crawlers: {
    compositeScore: 71,
    perBot: {
      GPTBot: "allowed",
      "OAI-SearchBot": "blocked",
      ClaudeBot: "allowed",
      PerplexityBot: "unknown",
    },
  },
  citability: {
    pageScore: 62,
    coverage: 100,
    top3: [
      "GEO is the practice of optimizing content for AI assistants.",
      "Citations depend on extractable, self-contained passages.",
      "Structured definitions outperform conversational prose.",
    ],
    bottom3: [
      "Vague filler paragraphs dilute the passage.",
      "Pronoun-heavy leads reduce citability.",
    ],
    suggestions: [
      { block: "Introduction", key: "define_core_concept" },
      { block: "Statistics", key: "add_specific_numbers" },
    ],
  },
  schema: {
    detected: [
      {
        "@type": "Organization",
        name: "Example Corp",
        url: "https://example.com/",
      },
    ],
    issues: [
      "Organization missing sameAs",
      "Block 0: JSON-LD missing @context",
      "Organization missing logo",
      "Organization missing description",
      "Organization missing contactPoint",
      "Organization missing founder",
      "Organization missing address",
      "Block 0: unrecognized @type WebSite",
      "Block 0: invalid sameAs URL",
    ],
    generated: {
      "@type": "Organization",
      name: "Example Corp",
      url: "https://example.com/",
    },
    businessType: "saas",
    // RSC-14: the real engine rubric score, NOT the 100 - issues*10 proxy.
    score: 61,
  },
  platform: {
    headers: [
      {
        check: "hsts",
        status: "pass",
        message: "Strict-Transport-Security present",
      },
    ],
    meta: {
      title: "Example",
      description: "An example site",
      viewport: "width=device-width",
    },
    og: { title: "Example" },
    twitter: { card: "summary" },
    ssr: { verdict: "ssr_present", ratio: 0.4 },
    probes: { sitemap: true, llmsTxt: false },
    perPlatform: {
      aio: { score: 70, criteria: [] },
      chatgpt: { score: 65, criteria: [] },
      perplexity: { score: 60, criteria: [] },
      gemini: { score: 62, criteria: [] },
      copilot: { score: 58, criteria: [] },
    },
  },
  content: {
    experience: 18,
    expertise: 15,
    authoritativeness: 12,
    trustworthiness: 20,
    composite: 65,
    wordCount: 1240,
    headings: 6,
    freshness: { daysSinceLastUpdate: 90, dateFound: false },
    topicalAuthority: "not_measured",
  },
  scoringModelVersion: "2.0.0",
  meta: {
    auditVersion: "1.0.0",
    startedAt: 1_700_000_000_000,
    completedAt: 1_700_000_003_214,
    errors: [],
  },
};

/**
 * Sprint 13 v3 AuditResult fixture (RAO-16): adds `brandAuthority` and writes
 * scoringModelVersion "3.0.0". The legacy fixture above (2.0.0, no
 * brandAuthority) must keep validating - contract tolerance, never fabricated.
 */
export const auditResultV3Fixture: AuditResult = {
  ...auditResultFixture,
  scoringModelVersion: "3.0.0",
  brandAuthority: {
    status: "success",
    reason: null,
    score: 84,
    signals: {
      entityPresence: true,
      entityConsistency: true,
      wikidataCompleteness: 80,
    },
    entity: {
      wikipediaTitle: "Relevy",
      wikidataId: "Q123456789",
      wikidataLabel: "Relevy",
    },
  },
};

/**
 * Sprint 14 v3.1 AuditResult fixture (RGS-7, T5): the v3 shape with
 * `scoringModelVersion` bumped to "3.1.0" - the version new audits write.
 * The v3.0.0 and legacy 2.0.0 fixtures above stay untouched so the widened
 * read union (2.0.0 | 3.0.0 | 3.1.0) keeps validating them.
 */
export const auditResultV31Fixture: AuditResult = {
  ...auditResultV3Fixture,
  scoringModelVersion: "3.1.0",
};
