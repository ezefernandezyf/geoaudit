import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { extractJsonLd } from "@/schema/extract";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function page(name: string) {
  return load(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

describe("extractJsonLd (RSC-1)", () => {
  it("returns every ld+json block with its raw text preserved exactly", () => {
    const blocks = extractJsonLd(page("ld-multiple.html"));
    expect(blocks).toHaveLength(2);
    expect(blocks[0].index).toBe(0);
    expect(blocks[0].raw).toBe(
      '{"@context":"https://schema.org","@type":"Organization","name":"Acme","url":"https://acme.example"}',
    );
    expect(blocks[1].index).toBe(1);
    expect(blocks[1].raw).toBe(
      '{"@context":"https://schema.org","@type":"WebSite","name":"Acme","url":"https://acme.example","potentialAction":{"@type":"SearchAction","target":"https://acme.example/search?q={search_term_string}","query-input":"required name=search_term_string"}}',
    );
  });

  it("returns an empty array when the page has no ld+json scripts", () => {
    const blocks = extractJsonLd(page("ld-no-json.html"));
    expect(blocks).toHaveLength(0);
  });

  it("returns a single block for a one-schema page", () => {
    const blocks = extractJsonLd(page("ld-organization.html"));
    expect(blocks).toHaveLength(1);
    expect(blocks[0].index).toBe(0);
    expect(blocks[0].raw).toContain('"@type":"Organization"');
  });
});
