import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { extractJsonLd } from "@/schema/extract";
import { parseBlocks } from "@/schema/parse";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function page(name: string) {
  return load(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

describe("parseBlocks (RSC-2, RSC-12, RSC-11)", () => {
  it("parses a valid block with no warning", () => {
    const result = parseBlocks(extractJsonLd(page("ld-organization.html")));
    expect(result.blocks).toHaveLength(1);
    expect(result.warnings).toHaveLength(0);
    expect(result.reason).toBeNull();
    const data = result.blocks[0].data as Record<string, unknown>;
    expect(data["@type"]).toBe("Organization");
    expect(data["name"]).toBe("Acme");
    expect(data["url"]).toBe("https://acme.example");
  });

  it("keeps valid blocks and records a warning with the block index for invalid JSON", () => {
    const result = parseBlocks(extractJsonLd(page("ld-invalid-json.html")));
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].index).toBe(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].index).toBe(1);
    expect(result.warnings[0].message).toContain("invalid JSON");
  });

  it("returns no_structured_data reason and no warnings for zero blocks", () => {
    const result = parseBlocks(extractJsonLd(page("ld-no-json.html")));
    expect(result.blocks).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.reason).toBe("no_structured_data");
  });

  it("parses an @graph block keeping the graph wrapper intact", () => {
    const result = parseBlocks(extractJsonLd(page("ld-graph.html")));
    expect(result.blocks).toHaveLength(1);
    expect(result.warnings).toHaveLength(0);
    const data = result.blocks[0].data as { "@graph"?: unknown[] };
    expect(Array.isArray(data["@graph"])).toBe(true);
    expect((data["@graph"] as unknown[]).length).toBe(2);
  });
});
