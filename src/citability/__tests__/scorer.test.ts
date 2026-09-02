import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { extractMainContent } from "@/citability/extract";
import { segmentBlocks } from "@/citability/segment";
import {
  scoreBlock,
  scoreStats,
  scoreUniqueness,
  type DimensionScores,
} from "@/citability/scorer";
import { CITABILITY_WEIGHTS, STAT_PATTERN } from "@/citability/constants";
import type { ContentBlock } from "@/citability/types";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

/** Extracts, segments and scores the FIRST content block of a fixture page. */
function scoreFirstBlock(name: string) {
  const $ = load(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
  const blocks = segmentBlocks(extractMainContent($), $);
  expect(blocks.length).toBeGreaterThan(0);
  return scoreBlock(blocks[0]);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Builds a ContentBlock directly so uniqueness/stats logic is unit-testable. */
function blockWith(paragraphs: string[], statsContent?: string): ContentBlock {
  const text = paragraphs.join(" ");
  const content = statsContent ?? text;
  return {
    id: "1",
    heading: "",
    headingLevel: 0,
    content,
    text,
    paragraphs,
    wordCount: content.split(/\s+/).filter(Boolean).length,
    sentenceCount: 1,
    hasTable: false,
    hasList: false,
    hasQuestionHeading: false,
  };
}

describe("Answer Block Quality (RCI-3, 30%)", () => {
  it("scores a definition-pattern block >= 70 with a standalone first sentence", () => {
    const { scores } = scoreFirstBlock("page-definition.html");
    expect(scores.answer).toBe(100);
    expect(scores.answer).toBeGreaterThanOrEqual(70);
  });

  it("scores a narrative block with no definition or immediate answer < 40", () => {
    const { scores } = scoreFirstBlock("page-no-answer.html");
    expect(scores.answer).toBe(20);
    expect(scores.answer).toBeLessThan(40);
  });

  it("awards intermediate credit for a definition whose answer is buried (RCI-3)", () => {
    const { scores } = scoreFirstBlock("page-answer-buried.html");
    // Base 20 + definition 40 = 60: > 0 and below full (100), not 0.
    expect(scores.answer).toBe(60);
    expect(scores.answer).toBeGreaterThan(0);
    expect(scores.answer).toBeLessThan(100);
  });

  it("awards partial first-sentence credit for a declarative lead over 60 words (RCI-3)", () => {
    const { scores } = scoreFirstBlock("page-answer-long-lead.html");
    // Base 20 + partial first-sentence 25 = 45 (answer exists, not standalone).
    expect(scores.answer).toBe(45);
  });
});

describe("Self-Containment (RCI-4, 25%)", () => {
  it("scores an explicit-subject block inside the 50-200 word band >= 70", () => {
    const { scores } = scoreFirstBlock("page-self-contained.html");
    expect(scores.selfContainment).toBe(80);
    expect(scores.selfContainment).toBeGreaterThanOrEqual(70);
  });

  it("scores a pronoun-led block < 30 (requires external context)", () => {
    const { scores } = scoreFirstBlock("page-pronoun-led.html");
    expect(scores.selfContainment).toBe(10);
    expect(scores.selfContainment).toBeLessThan(30);
  });
});

describe("Structural Readability (RCI-5, 20%)", () => {
  it("rewards question headings, 2-4 sentence paragraphs and tables", () => {
    const $ = load(
      fs.readFileSync(
        path.join(fixturesDir, "page-mixed-content.html"),
        "utf8",
      ),
    );
    const blocks = segmentBlocks(extractMainContent($), $);
    expect(blocks).toHaveLength(2);
    // H2 "What are the plan limits?" + 3-sentence paragraph + table
    expect(scoreBlock(blocks[0]).scores.structure).toBe(100);
    // H2 "Setup steps" + list, but the paragraph is a single sentence
    expect(scoreBlock(blocks[1]).scores.structure).toBe(40);
  });

  it("awards intermediate credit when only some paragraphs are in the band (RCI-5)", () => {
    const { scores } = scoreFirstBlock("page-structure-partial.html");
    // H2 20 + partial paragraph band 20 = 40: clean hierarchy, mixed paragraphs.
    expect(scores.structure).toBe(40);
  });
});

describe("Statistical Density (RCI-6, 15%)", () => {
  it("scores a stats-rich block >= 70 (percent, currency, dated source)", () => {
    const { scores } = scoreFirstBlock("page-stats-rich.html");
    expect(scores.stats).toBe(100);
    expect(scores.stats).toBeGreaterThanOrEqual(70);
  });

  it("scores a stats-poor block <= 10 (no numbers, no sources)", () => {
    const { scores } = scoreFirstBlock("page-stats-poor.html");
    expect(scores.stats).toBe(0);
    expect(scores.stats).toBeLessThanOrEqual(10);
  });

  it("awards intermediate credit to a partial-stat block (RCI-6)", () => {
    const { scores } = scoreFirstBlock("page-stats-partial.html");
    // One bare percentage across a long block: between 10 and full, not 0.
    expect(scores.stats).toBeGreaterThan(10);
    expect(scores.stats).toBeLessThan(100);
  });

  it("counts semver strings (vX.Y.Z) as concrete stats (RCI-6, design D5)", () => {
    const filler = "filler ".repeat(397).trimEnd();
    const block = blockWith(
      ["placeholder paragraph"],
      `we released v18.2.0 ${filler}`,
    );
    // Exactly one stat (the version) across a 400-word block: one per 500
    // words gives 70; at 400 words the density is 1.25 → 87.5, intermediate.
    expect(STAT_PATTERN.test("we released v18.2.0")).toBe(true);
    expect(scoreStats(block)).toBeGreaterThan(10);
    expect(scoreStats(block)).toBe(87.5);
  });

  it("matches bare and multi-part versions but not two-part decimals (RCI-6)", () => {
    expect("API 18.2.0 stable".match(STAT_PATTERN)).toEqual(["18.2.0"]);
    expect("v1.0".match(STAT_PATTERN)).toBeNull();
  });
});

describe("Uniqueness (RCI-7, 10%)", () => {
  it("rewards original-data phrases and first-person voice", () => {
    const { scores } = scoreFirstBlock("page-unique.html");
    expect(scores.uniqueness).toBe(100);
    expect(scores.uniqueness).toBeGreaterThanOrEqual(70);
  });
});

describe("Uniqueness base floor (RCI-7, design D4)", () => {
  it("earns the 35 base floor for a self-contained block with no first-party phrases", () => {
    const block = blockWith([
      "This passage is self-contained and names its subject explicitly.",
    ]);
    expect(scoreUniqueness(block)).toBe(35);
    expect(scoreUniqueness(block)).toBeGreaterThanOrEqual(35);
  });

  it("adds 35 per unique-data phrase hit (floor 35 + 35 = 70)", () => {
    const block = blockWith([
      "The report covers this year.",
      "Our data shows conversion improved after the redesign.",
    ]);
    expect(scoreUniqueness(block)).toBe(70);
  });

  it("adds 35 for a first-person lead (floor 35 + 35 = 70)", () => {
    const block = blockWith([
      "We tested this approach across the whole fleet.",
    ]);
    expect(scoreUniqueness(block)).toBe(70);
  });

  it("caps at 100 when the floor plus hits exceed the scale", () => {
    const block = blockWith([
      "The company shared results publicly.",
      "We surveyed customers and our data shows a clear trend.",
    ]);
    expect(scoreUniqueness(block)).toBe(100);
  });
});

describe("Block composite (RCI-8 weighted average 30/25/20/15/10)", () => {
  it("computes the composite as the weighted average of the five dimensions", () => {
    const { scores, composite } = scoreFirstBlock("page-definition.html");
    const expected = round1(
      scores.answer * CITABILITY_WEIGHTS.answer +
        scores.selfContainment * CITABILITY_WEIGHTS.selfContainment +
        scores.structure * CITABILITY_WEIGHTS.structure +
        scores.stats * CITABILITY_WEIGHTS.stats +
        scores.uniqueness * CITABILITY_WEIGHTS.uniqueness,
    );
    expect(composite).toBe(expected);
    expect(composite).toBe(84.5);
    // A definition-driven block is a strong block overall
    expect(composite).toBeGreaterThanOrEqual(70);
  });

  it("exposes the five dimension scores per block", () => {
    const { scores } = scoreFirstBlock("page-definition.html");
    const keys = Object.keys(scores).sort() as (keyof DimensionScores)[];
    expect(keys).toEqual(
      ["answer", "selfContainment", "stats", "structure", "uniqueness"].sort(),
    );
    for (const key of keys) {
      expect(scores[key]).toBeGreaterThanOrEqual(0);
      expect(scores[key]).toBeLessThanOrEqual(100);
    }
  });
});
