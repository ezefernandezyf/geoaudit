import type { AuditResult } from "@/lib/contracts/audit-result";
import {
  auditResultFixture,
  auditResultV3Fixture,
} from "@/lib/contracts/__fixtures__/audit-result";

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
  score: 0,
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

/** RAO-16: v3 row with a MEASURED brand 0 (RGS-11 real 20% penalty, APT-11). */
export const brandZeroResult: AuditResult = {
  ...auditResultV3Fixture,
  brandAuthority: {
    status: "success",
    reason: null,
    score: 0,
    signals: {
      entityPresence: false,
      entityConsistency: false,
      wikidataCompleteness: 0,
    },
    entity: {
      wikipediaTitle: null,
      wikidataId: null,
      wikidataLabel: null,
    },
  },
};

/** RAO-15: v3 row where the brand engine failed (BRA-7) - "No medido", never 0. */
export const brandErrorResult: AuditResult = {
  ...auditResultV3Fixture,
  brandAuthority: {
    status: "error",
    reason: "rate_limit",
    score: 0,
    signals: {
      entityPresence: false,
      entityConsistency: false,
      wikidataCompleteness: 0,
    },
    entity: {
      wikipediaTitle: null,
      wikidataId: null,
      wikidataLabel: null,
    },
  },
  meta: { ...auditResultV3Fixture.meta, errors: ["brand: rate_limit"] },
};
