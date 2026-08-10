import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { scoreExpertise } from "@/eeat/expertise";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function page(name: string) {
  return load(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

describe("scoreExpertise (REE-2)", () => {
  it("scores byline + Person schema with sameAs at 22 (>=15 required)", () => {
    const result = scoreExpertise(page("page-expertise-byline.html"));
    expect(result.score).toBe(22);
    expect(result.score).toBeGreaterThanOrEqual(15);
    const keys = result.findings.map((f) => f.key);
    expect(keys).toContain("author_byline");
    expect(keys).toContain("author_schema");
    expect(keys).toContain("author_schema_sameas");
  });

  it("scores a class-based author byline alone at 5", () => {
    const result = scoreExpertise(page("page-expertise-author-class.html"));
    expect(result.score).toBe(5);
  });

  it("flags no_author_detected and scores 0 on an anonymous page (<=5)", () => {
    const result = scoreExpertise(page("page-expertise-no-author.html"));
    expect(result.score).toBe(0);
    expect(result.score).toBeLessThanOrEqual(5);
    expect(result.findings.map((f) => f.key)).toContain("no_author_detected");
  });

  it("gives the technical-depth proxy at least 5 without any author signals", () => {
    const result = scoreExpertise(page("page-expertise-tech-depth.html"));
    expect(result.score).toBe(10);
    expect(result.score).toBeGreaterThanOrEqual(5);
  });
});
