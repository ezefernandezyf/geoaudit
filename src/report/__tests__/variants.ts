import type { AuditResult } from "@/lib/contracts/audit-result";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";

/**
 * Shared degraded/unsupported AuditResult variants for the U4 report render
 * matrix (ARU-7 degraded + RAO-13 non-HTML). Built from the valid fixture
 * so every section keeps its real contract shape.
 */

export const emptyCitability: AuditResult["citability"] = {
  pageScore: 0,
  coverage: 0,
  top3: [],
  bottom3: [],
  suggestions: [],
};

export const emptySchema: AuditResult["schema"] = {
  detected: [],
  issues: [],
  generated: null,
  businessType: "hybrid",
};

export const emptyPlatform: AuditResult["platform"] = {
  headers: [],
  meta: {},
  og: {},
  twitter: {},
  ssr: {},
  probes: {},
  perPlatform: {},
};

export const emptyContent: AuditResult["content"] = {
  experience: 0,
  expertise: 0,
  authoritativeness: 0,
  trustworthiness: 0,
  composite: 0,
  wordCount: 0,
  headings: 0,
  freshness: {},
  topicalAuthority: "not_measured",
};

/** ARU-7: the citability engine fails (RAO-12) while the other four succeed. */
export const degradedCitabilityResult: AuditResult = {
  ...auditResultFixture,
  citability: emptyCitability,
  meta: { ...auditResultFixture.meta, errors: ["citability: boom"] },
};

/** RAO-13: non-HTML page - only the crawler engine runs, score 0/Critical. */
export const unsupportedPageResult: AuditResult = {
  ...auditResultFixture,
  summary: {
    ...auditResultFixture.summary,
    geoScore: 0,
    severityBand: "Critical",
  },
  citability: emptyCitability,
  schema: emptySchema,
  platform: emptyPlatform,
  content: emptyContent,
  meta: {
    ...auditResultFixture.meta,
    errors: [
      "citability: unsupported_content_type",
      "schema: unsupported_content_type",
      "content: unsupported_content_type",
      "platform: unsupported_content_type",
    ],
  },
};
