import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { scorePage, toContractResult } from "@/citability/index";
import { suggestRewrites } from "@/citability/rewrite";
import { citabilityResultSchema } from "@/lib/contracts/audit-result";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function page(name: string) {
  return load(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

describe("scorePage aggregate (RCI-9, RCI-10, RCI-11)", () => {
  it("computes page score as the mean of block composites (RCI-9)", () => {
    const result = scorePage(page("page-five-blocks.html"));
    // v2.0.0 partial-credit tiers (WU-3): answer base 20 + intermediate
    // structure tiers lift the composites → 344 / 6 = 57.3
    expect(result.pageScore).toBe(57.3);
  });

  it("returns the exact top 3 and bottom 3 blocks (RCI-10)", () => {
    const result = scorePage(page("page-five-blocks.html"));
    expect(result.top3.map((b) => b.heading)).toEqual([
      "What is the audit process?",
      "What does pricing look like?",
      "How is the methodology built?",
    ]);
    expect(result.bottom3.map((b) => b.heading)).toEqual([
      "History",
      "Testimonials",
      "Conclusion",
    ]);
    for (const summary of [...result.top3, ...result.bottom3]) {
      expect(summary.excerpt.length).toBeGreaterThan(0);
      expect(summary.composite).toBeGreaterThanOrEqual(0);
      expect(summary.composite).toBeLessThanOrEqual(100);
    }
  });

  it("computes coverage as the percentage of blocks scoring >= 70 (RCI-11)", () => {
    const result = scorePage(page("page-five-blocks.html"));
    // 3 of 6 blocks (audit process, methodology, pricing) score >= 70
    expect(result.coverage).toBe(50);
  });
});

describe("suggestRewrites (RCI-12 template keys)", () => {
  it("emits one template suggestion per bottom block below the rewrite threshold", () => {
    const result = scorePage(page("page-five-blocks.html"));
    expect(result.suggestions.length).toBe(3);
    expect(result.suggestions.map((s) => s.block)).toEqual([
      "History",
      "Testimonials",
      "Conclusion",
    ]);
  });

  it("keys a pronoun-led block with the definition-pattern template", () => {
    const result = scorePage(page("page-five-blocks.html"));
    const history = result.suggestions.find((s) => s.block === "History");
    expect(history?.key).toBe("define_core_concept");
  });

  it("keys a block with a full answer but no stats with the stat-injection template", () => {
    const result = scorePage(page("page-five-blocks.html"));
    const conclusion = result.suggestions.find((s) => s.block === "Conclusion");
    expect(conclusion?.key).toBe("add_specific_numbers");
  });

  it("exposes suggestion keys directly from suggestRewrites", () => {
    const result = scorePage(page("page-five-blocks.html"));
    const keys = suggestRewrites(result.blocks).map((s) => s.key);
    expect(keys).toContain("define_core_concept");
    expect(keys).toContain("add_specific_numbers");
  });
});

describe("toContractResult (shared CitabilityResult shape)", () => {
  it("maps the engine output to the AuditResult contract and Zod-validates", () => {
    const result = scorePage(page("page-five-blocks.html"));
    const contract = toContractResult(result);
    expect(contract.pageScore).toBe(57.3);
    expect(contract.coverage).toBe(50);
    expect(contract.top3).toEqual([
      "What is the audit process?",
      "What does pricing look like?",
      "How is the methodology built?",
    ]);
    expect(contract.bottom3).toEqual(["History", "Testimonials", "Conclusion"]);
    expect(contract.suggestions).toEqual([
      { block: "History", key: "define_core_concept" },
      { block: "Testimonials", key: "define_core_concept" },
      { block: "Conclusion", key: "add_specific_numbers" },
    ]);
    expect(citabilityResultSchema.safeParse(contract).success).toBe(true);
  });
});

describe("scorePage edge cases (RCI-14)", () => {
  it("returns a 0 score with empty arrays for an empty body", () => {
    const result = scorePage(page("page-empty.html"));
    expect(result.pageScore).toBe(0);
    expect(result.coverage).toBe(0);
    expect(result.blocks).toEqual([]);
    expect(result.top3).toEqual([]);
    expect(result.bottom3).toEqual([]);
    expect(result.suggestions).toEqual([]);
    expect(
      citabilityResultSchema.safeParse(toContractResult(result)).success,
    ).toBe(true);
  });

  it("does not throw on malformed HTML and still produces a score (RCI-14)", () => {
    const result = scorePage(page("page-malformed.html"));
    expect(result.blocks.length).toBeGreaterThan(0);
    expect(result.pageScore).toBeGreaterThanOrEqual(0);
    expect(result.pageScore).toBeLessThanOrEqual(100);
  });
});
