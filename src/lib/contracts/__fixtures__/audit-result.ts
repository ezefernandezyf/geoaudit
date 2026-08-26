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
    issues: ["Organization missing sameAs"],
    generated: {
      "@type": "Organization",
      name: "Example Corp",
      url: "https://example.com/",
    },
    businessType: "saas",
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
