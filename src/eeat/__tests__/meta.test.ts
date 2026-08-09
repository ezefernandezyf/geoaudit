import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { assessFreshness, assessHeadings, assessWordCount } from "@/eeat/meta";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function page(name: string) {
  return load(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

// Fixed clock so days-since computations are deterministic (2025-06-15T00:00Z).
const NOW = Date.UTC(2025, 5, 15);

describe("assessWordCount (REE-5)", () => {
  it("counts visible words and compares them to the article benchmark", () => {
    const result = assessWordCount(page("page-meta-clean.html"));
    expect(result.count).toBe(21);
    expect(result.pageType).toBe("article");
    expect(result.benchmark).toBe(1500);
    expect(result.status).toBe("below_benchmark");
  });

  it("classifies a page without article/byline/faq/product signals as generic", () => {
    const result = assessWordCount(page("page-meta-h1-h3.html"));
    // 1 (Title) + 1 (Subsection) + 9 + 7 = 18
    expect(result.count).toBe(18);
    expect(result.pageType).toBe("page");
    expect(result.benchmark).toBe(500);
    expect(result.status).toBe("below_benchmark");
  });
});

describe("assessHeadings (REE-6)", () => {
  it("raises no warnings for a clean H1 -> H2 -> H3 hierarchy", () => {
    const result = assessHeadings(page("page-meta-clean.html"));
    expect(result.count).toBe(4);
    expect(result.levels).toEqual([1, 2, 2, 3]);
    expect(result.warnings).toEqual([]);
    expect(result.score).toBe(70);
  });

  it("flags H2_skipped when H1 jumps straight to H3", () => {
    const result = assessHeadings(page("page-meta-h1-h3.html"));
    expect(result.count).toBe(2);
    expect(result.levels).toEqual([1, 3]);
    expect(result.warnings).toEqual(["H2_skipped"]);
    expect(result.score).toBe(10);
  });
});

describe("assessFreshness (REE-7)", () => {
  it("captures JSON-LD Article dates and reports days-since-modification", () => {
    const result = assessFreshness(page("page-meta-dates.html"), () => NOW);
    expect(result.datePublished).toBe("2025-03-15");
    expect(result.dateModified).toBe("2025-06-01");
    expect(result.daysSinceModification).toBe(14);
    expect(result.source).toBe("json_ld");
    expect(result.finding).toBe("date_detected");
  });

  it("reports no_date_detected with null dates when no signals exist (REE-10)", () => {
    const result = assessFreshness(page("page-meta-no-date.html"), () => NOW);
    expect(result.finding).toBe("no_date_detected");
    expect(result.datePublished).toBeNull();
    expect(result.dateModified).toBeNull();
    expect(result.daysSinceModification).toBeNull();
    expect(result.source).toBeNull();
  });
});
