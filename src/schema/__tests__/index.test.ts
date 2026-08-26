import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { extractJsonLd } from "@/schema/extract";
import { generateCorrected } from "@/schema/generate";
import { scoreSchema, toContractResult } from "@/schema/index";
import { parseBlocks } from "@/schema/parse";
import { schemaResultSchema } from "@/lib/contracts/audit-result";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function page(name: string) {
  return load(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

describe("generateCorrected (RSC-9)", () => {
  it("fills a missing Organization url with a TODO marker and preserves existing properties", () => {
    const $ = page("ld-missing-required.html");
    const blocks = parseBlocks(extractJsonLd($)).blocks;
    const generated = generateCorrected(blocks, "saas") as {
      "@graph"?: Record<string, unknown>[];
    };
    const graph = generated["@graph"];
    expect(graph).toBeDefined();
    const org = graph?.find((node) => node["@type"] === "Organization");
    expect(org?.["name"]).toBe("Acme");
    expect(org?.["url"]).toBe("TODO: fill from page URL");
    expect(graph?.some((node) => node["@type"] === "SoftwareApplication")).toBe(
      true,
    );
  });

  it("returns a full LocalBusiness template with TODO markers when there is no JSON-LD", () => {
    const generated = generateCorrected([], "local");
    expect(generated["@type"]).toBe("LocalBusiness");
    expect(generated["name"]).toBe("TODO: fill from page");
    expect(generated["url"]).toBe("TODO: fill from page URL");
    expect(generated["address"]).toBeTruthy();
    expect((generated["address"] as Record<string, unknown>)["@type"]).toBe(
      "PostalAddress",
    );
  });
});

describe("scoreSchema (RSC-9, RSC-11)", () => {
  it("corrects a page-level Organization missing url in the generated output", () => {
    const result = scoreSchema(page("ld-missing-required.html"));
    expect(result.generated).not.toBeNull();
    const generated = result.generated as Record<string, unknown>;
    expect(generated["@type"]).toBe("Organization");
    expect(generated["name"]).toBe("Acme");
    expect(generated["url"]).toBe("TODO: fill from page URL");
  });

  it("generates a LocalBusiness template for zero JSON-LD + local business signals", () => {
    const result = scoreSchema(page("page-local-no-json.html"));
    expect(result.businessType).toBe("local");
    expect(result.reason).toBe("no_structured_data");
    const generated = result.generated as Record<string, unknown>;
    expect(generated["@type"]).toBe("LocalBusiness");
    expect(generated["name"]).toContain("TODO");
    expect(generated["url"]).toContain("TODO");
    expect(generated["address"]).toBeTruthy();
  });

  it("returns a clean empty result for a page with no structured data (RSC-11)", () => {
    const result = scoreSchema(page("ld-no-json.html"));
    expect(result.detected).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.issues).toEqual([]);
    expect(result.reason).toBe("no_structured_data");
    expect(result.businessType).toBe("hybrid");
    expect(result.generated).not.toBeNull();
    expect(result.score).toBe(0);
    const contract = toContractResult(result);
    expect(contract.detected).toEqual([]);
    expect(contract.issues).toEqual([]);
    expect(schemaResultSchema.safeParse(contract).success).toBe(true);
  });

  it("handles an empty body gracefully with a Zod-valid contract", () => {
    const result = scoreSchema(load(""));
    expect(result.businessType).toBe("hybrid");
    const contract = toContractResult(result);
    expect(schemaResultSchema.safeParse(contract).success).toBe(true);
    expect(contract.generated).not.toBeNull();
  });

  it("keeps the @graph wrapper in detected while validating each node (RSC-10)", () => {
    const result = scoreSchema(page("ld-graph.html"));
    expect(result.nodes).toHaveLength(2);
    expect(result.detected).toHaveLength(1);
    const wrapper = result.detected[0] as { "@graph"?: unknown[] };
    expect(Array.isArray(wrapper["@graph"])).toBe(true);
    expect((wrapper["@graph"] as unknown[]).length).toBe(2);
  });

  it("collects invalid-JSON warnings without crashing and still maps to a valid contract (RSC-12)", () => {
    const result = scoreSchema(page("ld-invalid-json.html"));
    expect(result.warnings).toHaveLength(1);
    expect(result.detected).toHaveLength(1);
    const contract = toContractResult(result);
    expect(
      contract.issues.some((issue) =>
        issue.includes(result.warnings[0].message),
      ),
    ).toBe(true);
    expect(schemaResultSchema.safeParse(contract).success).toBe(true);
  });
});

describe("scoreSchema rubric (12 criteria, RSC-9)", () => {
  it("scores a full @graph page 98 with 12 criteria (minor recommended gaps)", () => {
    const result = scoreSchema(page("ld-rubric-rich.html"));
    expect(result.rubric.criteria).toHaveLength(12);
    // RSC-13: the Organization node is complete (no missing_required) but
    // misses recommended properties (logo/description/...) → 13, not 15.
    expect(result.rubric.score).toBe(98);
    expect(result.score).toBe(98);
    expect(result.rubric.criteria.reduce((sum, c) => sum + c.points, 0)).toBe(
      result.rubric.score,
    );
  });

  it("scores a basic Organization page 64 (sameAs 2 links, no article/website/breadcrumbs)", () => {
    const result = scoreSchema(page("ld-organization.html"));
    // RSC-13: complete Organization with missing recommended → 13 (was 15).
    expect(result.rubric.score).toBe(64);
    const sameAs = result.rubric.criteria.find((c) => c.key === "same_as");
    expect(sameAs?.points).toBe(6);
  });

  it("awards intermediate credit for a complete node with recommended gaps (RSC-13)", () => {
    const result = scoreSchema(page("ld-organization.html"));
    const org = result.rubric.criteria.find(
      (c) => c.key === "organization_person",
    );
    expect(org?.points).toBe(13);
  });

  it("docks a node missing 2+ required properties to 7 (RSC-13)", () => {
    const result = scoreSchema(page("ld-org-bare.html"));
    const org = result.rubric.criteria.find(
      (c) => c.key === "organization_person",
    );
    expect(org?.points).toBe(7);
  });

  it("awards partial credit for a WebSite node without SearchAction (RSC-13)", () => {
    const result = scoreSchema(page("ld-website-no-action.html"));
    const website = result.rubric.criteria.find(
      (c) => c.key === "website_search_action",
    );
    expect(website?.points).toBe(2);
  });
});

describe("toContractResult (SchemaResult contract)", () => {
  it("maps the rich engine output to the shared contract and Zod-validates", () => {
    const result = scoreSchema(page("ld-rubric-rich.html"));
    const contract = toContractResult(result);
    // The Article node in the @graph drives the publisher classification.
    expect(contract.businessType).toBe("publisher");
    expect(contract.detected.length).toBeGreaterThan(0);
    expect(contract.generated).not.toBeNull();
    expect(schemaResultSchema.safeParse(contract).success).toBe(true);
  });

  it("surfaces validation issues as strings in the contract", () => {
    const result = scoreSchema(page("ld-missing-required.html"));
    const contract = toContractResult(result);
    expect(
      contract.issues.some((issue) =>
        issue.includes("Missing required property"),
      ),
    ).toBe(true);
    expect(schemaResultSchema.safeParse(contract).success).toBe(true);
  });
});
