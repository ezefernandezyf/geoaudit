import { describe, expect, it } from "vitest";
import type {
  CitabilityResult,
  CrawlerResult,
  SchemaResult,
} from "@/lib/contracts/audit-result";
import { deriveFindings } from "@/report/presenters/findings";

/**
 * U5.3 — `deriveFindings` (APT-7, APT-10). Findings derive ONLY from real
 * citability bottom3/top3, schema issues and blocked bots. `impactScore` is
 * always null; a `codeSnippet` appears only when a real source exists
 * (`schema.generated`).
 */

const citability: CitabilityResult = {
  pageScore: 42,
  coverage: 40,
  top3: [
    "Structured definitions outperform conversational prose.",
    "GEO is the practice of optimizing content for AI assistants.",
  ],
  bottom3: [
    "Vague filler paragraphs dilute the passage.",
    "Pronoun-heavy leads reduce citability.",
  ],
  suggestions: [{ block: "Introduction", key: "define_core_concept" }],
};

const schemaWithGenerated: SchemaResult = {
  detected: [{ "@type": "Organization", name: "Example Corp" }],
  issues: ["Organization missing sameAs", "Missing url"],
  generated: { "@type": "Organization", name: "Example Corp" },
  businessType: "saas",
};

const crawlersWithBlocked: CrawlerResult = {
  compositeScore: 55,
  perBot: {
    GPTBot: "allowed",
    PerplexityBot: "blocked",
    "Claude-Web": "blocked",
    "Google-Extended": "unknown",
  },
};

describe("deriveFindings (APT-7)", () => {
  it("derives bottom3 as citability weaknesses with the real citability band", () => {
    const findings = deriveFindings(
      citability,
      schemaWithGenerated,
      crawlersWithBlocked,
    );
    const bottom = findings.filter((f) =>
      f.id.startsWith("citability-bottom-"),
    );
    expect(bottom).toHaveLength(2);
    for (const f of bottom) {
      expect(f.category).toBe("Citabilidad");
      // pageScore 42 → real band "Poor" → lowercase "poor".
      expect(f.severity).toBe("poor");
      expect(f.impactScore).toBeNull();
    }
  });

  it("derives top3 as citability strengths", () => {
    const findings = deriveFindings(
      citability,
      schemaWithGenerated,
      crawlersWithBlocked,
    );
    const top = findings.filter((f) => f.id.startsWith("citability-top-"));
    expect(top).toHaveLength(2);
    for (const f of top) {
      expect(f.category).toBe("Citabilidad");
      expect(f.severity).toBe("good");
    }
  });

  it("collapses ALL schema issues into ONE finding with details (ARU-13)", () => {
    const findings = deriveFindings(
      citability,
      schemaWithGenerated,
      crawlersWithBlocked,
    );
    const schema = findings.filter((f) => f.category === "Datos estructurados");
    expect(schema).toHaveLength(1);
    const [finding] = schema;
    expect(finding.id).toBe("schema-issues");
    expect(finding.title).toBe("Datos estructurados: faltan estas propiedades");
    // The missing properties travel as the details list.
    expect(finding.details).toEqual([
      "Organization missing sameAs",
      "Missing url",
    ]);
    // 2 detected, 2 issues → deriveSchemaScore = 100 - 20 = 80 → "good".
    expect(finding.severity).toBe("good");
    expect(finding.impactScore).toBeNull();
    // The JSON-LD snippet appears exactly once (one finding, one snippet).
    expect(finding.codeSnippet).toContain('"@type"');
    expect(finding.codeLanguage).toBe("json");
  });

  it("omits the structured-data finding when there are no issues (ARU-13)", () => {
    const cleanSchema: SchemaResult = { ...schemaWithGenerated, issues: [] };
    const findings = deriveFindings(
      citability,
      cleanSchema,
      crawlersWithBlocked,
    );
    expect(
      findings.filter((f) => f.category === "Datos estructurados"),
    ).toHaveLength(0);
  });

  it("collapses ALL blocked bots into ONE finding listing the bots (ARU-14)", () => {
    const findings = deriveFindings(
      citability,
      schemaWithGenerated,
      crawlersWithBlocked,
    );
    const bots = findings.filter((f) => f.category === "Crawlers");
    expect(bots).toHaveLength(1);
    const [finding] = bots;
    expect(finding.id).toBe("blocked-bots");
    expect(finding.title).toBe("Bots de IA bloqueados");
    expect(finding.severity).toBe("critical");
    expect(finding.impactScore).toBeNull();
    expect(finding.details).toEqual(["PerplexityBot", "Claude-Web"]);
    // No invented code snippet on bot findings.
    expect(finding.codeSnippet).toBeUndefined();
  });

  it("omits the blocked-bots finding when no bot is blocked (ARU-14)", () => {
    const openCrawlers: CrawlerResult = {
      compositeScore: 71,
      perBot: { GPTBot: "allowed", ClaudeBot: "allowed" },
    };
    const findings = deriveFindings(
      citability,
      schemaWithGenerated,
      openCrawlers,
    );
    expect(findings.filter((f) => f.category === "Crawlers")).toHaveLength(0);
  });

  it("omits the code snippet when schema.generated is null (APT-10)", () => {
    const schemaWithoutGenerated: SchemaResult = {
      ...schemaWithGenerated,
      generated: null,
    };
    const findings = deriveFindings(
      citability,
      schemaWithoutGenerated,
      crawlersWithBlocked,
    );
    const schema = findings.filter((f) => f.category === "Datos estructurados");
    expect(schema.length).toBeGreaterThan(0);
    for (const f of schema) {
      expect(f.codeSnippet).toBeUndefined();
    }
  });

  it("never fabricates an impact score on any finding (APT-7, APT-10)", () => {
    const findings = deriveFindings(
      citability,
      schemaWithGenerated,
      crawlersWithBlocked,
    );
    expect(findings.length).toBeGreaterThan(0);
    for (const f of findings) {
      expect(f.impactScore).toBeNull();
    }
  });
});
