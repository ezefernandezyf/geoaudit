import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { extractMainContent } from "@/citability/extract";
import { segmentBlocks } from "@/citability/segment";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function blocksFrom(name: string) {
  const $ = load(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
  return segmentBlocks(extractMainContent($), $);
}

describe("segmentBlocks (RCI-2 H2/H3 segmentation)", () => {
  it("produces one block per H2, in document order, with heading and text (RCI-2)", () => {
    const blocks = blocksFrom("page-four-h2.html");
    expect(blocks).toHaveLength(4);
    expect(blocks.map((b) => b.heading)).toEqual([
      "Introduction",
      "Features",
      "Pricing",
      "Support",
    ]);
    for (const block of blocks) {
      expect(block.headingLevel).toBe(2);
      expect(block.content.trim().length).toBeGreaterThan(0);
    }
    expect(blocks[0].content).toContain(
      "Opening paragraph of the first section.",
    );
    expect(blocks[0].wordCount).toBe(6);
  });

  it("groups H3 blocks under their H2 and keeps pre-H3 text in the H2 block (RCI-2)", () => {
    const blocks = blocksFrom("page-h2-h3.html");
    expect(blocks).toHaveLength(3);
    expect(blocks.map((b) => b.heading)).toEqual([
      "Overview",
      "History",
      "Roadmap",
    ]);
    expect(blocks[0].headingLevel).toBe(2);
    expect(blocks[0].content).toContain(
      "Introductory overview paragraph that belongs to the H2 block.",
    );
    expect(blocks[1].headingLevel).toBe(3);
    expect(blocks[1].content).toContain("Historical background subsection.");
    expect(blocks[2].headingLevel).toBe(3);
    expect(blocks[2].content).toContain("Planned milestones subsection.");
  });

  it("exposes block text as heading plus content for display", () => {
    const blocks = blocksFrom("page-four-h2.html");
    expect(blocks[1].text).toContain("Features");
    expect(blocks[1].text).toContain("Description of core features.");
  });
});

describe("segmentBlocks (RCI-13 single-block fallback)", () => {
  it("treats a page with no H2/H3 as a single block holding all content", () => {
    const blocks = blocksFrom("page-no-heading.html");
    expect(blocks).toHaveLength(1);
    const [block] = blocks;
    expect(block.heading).toBe("");
    expect(block.headingLevel).toBe(0);
    expect(block.content).toContain(
      "First paragraph of a page with no headings at all.",
    );
    expect(block.content).toContain("Second paragraph with additional detail.");
    expect(block.wordCount).toBeGreaterThan(10);
  });

  it("captures bare text content that is not wrapped in paragraph tags", () => {
    const blocks = blocksFrom("page-text-only.html");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].content).toContain("Bare text content inside a div");
  });
});

describe("segmentBlocks structural flags (RCI-5 inputs)", () => {
  it("marks question headings, tables and lists on the owning block", () => {
    const blocks = blocksFrom("page-mixed-content.html");
    expect(blocks).toHaveLength(2);
    expect(blocks[0].heading).toBe("What are the plan limits?");
    expect(blocks[0].hasQuestionHeading).toBe(true);
    expect(blocks[0].hasTable).toBe(true);
    expect(blocks[0].hasList).toBe(false);
    expect(blocks[1].hasList).toBe(true);
    expect(blocks[1].hasTable).toBe(false);
    expect(blocks[1].hasQuestionHeading).toBe(false);
  });

  it("counts sentences per block from terminal punctuation", () => {
    const blocks = blocksFrom("page-mixed-content.html");
    expect(blocks[0].sentenceCount).toBe(3);
  });
});
