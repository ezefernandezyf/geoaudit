import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { extractJsonLd } from "@/schema/extract";
import { parseBlocks } from "@/schema/parse";
import { validateBlocks } from "@/schema/validate";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function page(name: string) {
  return load(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

function validate(name: string) {
  return validateBlocks(parseBlocks(extractJsonLd(page(name))).blocks);
}

describe("validateBlocks (RSC-3..RSC-7, RSC-10)", () => {
  it("validates a known type with all required props: no missing-required; recommended flags reference the registry entry", () => {
    const result = validate("ld-organization.html");
    expect(result.nodes).toHaveLength(1);
    const node = result.nodes[0];
    expect(node.known).toBe(true);
    expect(node.registryType).toBe("organization");
    expect(node.type).toBe("Organization");
    expect(node.issues.some((issue) => issue.key === "missing_required")).toBe(
      false,
    );
    const recommended = node.issues.filter(
      (issue) => issue.key === "missing_recommended",
    );
    expect(recommended.length).toBeGreaterThan(0);
    expect(recommended[0].type).toBe("Organization");
    expect(recommended[0].property).toBeTruthy();
    expect(recommended[0].severity).toBe("Warning");
  });

  it("flags missing required properties per the registry with Error severity", () => {
    const result = validate("ld-missing-required.html");
    const node = result.nodes[0];
    const missing = node.issues.filter(
      (issue) => issue.key === "missing_required",
    );
    expect(missing.map((issue) => issue.property)).toContain("url");
    expect(missing[0].severity).toBe("Error");
  });

  it("flags an unknown @type but still includes the node without registry checks", () => {
    const result = validate("ld-unknown-type.html");
    expect(result.nodes).toHaveLength(1);
    const node = result.nodes[0];
    expect(node.known).toBe(false);
    expect(node.type).toBe("UnknownType");
    // Node is still included in output with its original properties.
    expect(node.raw["name"]).toBe("Mystery");
    expect(node.issues.some((issue) => issue.key === "unknown_type")).toBe(
      true,
    );
    expect(node.issues.some((issue) => issue.key === "missing_required")).toBe(
      false,
    );
  });

  it("flattens @graph and validates each node against its own registry entry (RSC-10)", () => {
    const result = validate("ld-graph.html");
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].registryType).toBe("organization");
    expect(result.nodes[1].registryType).toBe("website_search");
    expect(result.nodes[1].type).toBe("WebSite");
  });

  it("raises no sameAs flag when sameAs contains only valid URLs", () => {
    const result = validate("ld-organization.html");
    const node = result.nodes[0];
    expect(
      node.issues.some(
        (issue) =>
          issue.key === "missing_sameAs" || issue.key === "invalid_sameAs",
      ),
    ).toBe(false);
  });

  it("raises missing_sameAs with Warning severity for an Organization without sameAs", () => {
    const result = validate("ld-sameas-missing.html");
    const issue = result.nodes[0].issues.find(
      (entry) => entry.key === "missing_sameAs",
    );
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe("Warning");
  });

  it("raises invalid_sameAs for non-URL sameAs values", () => {
    const result = validate("ld-sameas-invalid.html");
    const issue = result.nodes[0].issues.find(
      (entry) => entry.key === "invalid_sameAs",
    );
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe("Warning");
  });

  it("checks required and sameAs on Person via the article_person profile", () => {
    const result = validate("ld-person.html");
    const node = result.nodes[0];
    expect(node.registryType).toBe("article_person");
    expect(
      node.issues.some(
        (issue) =>
          issue.key === "missing_sameAs" || issue.key === "invalid_sameAs",
      ),
    ).toBe(false);
    expect(
      node.issues.some(
        (issue) =>
          issue.key === "missing_required" && issue.property === "name",
      ),
    ).toBe(false);
  });

  it("flags deprecated schema types (HowTo and FAQPage)", () => {
    const result = validate("ld-deprecated.html");
    const keys = result.issues.map((issue) => issue.key);
    expect(keys).toContain("deprecated_howto");
    expect(keys).toContain("deprecated_faqpage");
  });
});
