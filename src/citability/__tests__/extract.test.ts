import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import type { CheerioAPI } from "cheerio";
import { extractMainContent } from "@/citability/extract";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function page(name: string): CheerioAPI {
  return load(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

function textOf(extracted: ReturnType<typeof extractMainContent>): string {
  return extracted.text().trim();
}

describe("extractMainContent (RCI-1 semantic containers)", () => {
  it("extracts <article> text and excludes nav, footer and sidebar (RCI-1)", () => {
    const $ = page("page-article.html");
    const extracted = extractMainContent($);
    const text = textOf(extracted);
    expect(text).toContain("Article body text about the main topic.");
    expect(text).toContain("More article body text with useful details.");
    expect(text).not.toContain("Nav link one");
    expect(text).not.toContain("Footer legal copy.");
    expect(text).not.toContain("Sidebar widget copy.");
  });

  it("strips excluded regions nested inside the chosen container (RCI-1)", () => {
    const $ = page("page-article.html");
    expect(textOf(extractMainContent($))).not.toContain(
      "Advertisement banner copy",
    );
  });

  it('accepts [role="main"] as a content container (RCI-1)', () => {
    const $ = page("page-role-main.html");
    const text = textOf(extractMainContent($));
    expect(text).toContain("Primary content living in a role=main container.");
    expect(text).not.toContain("Nav block copy.");
    expect(text).not.toContain("Footer block copy.");
  });

  it("accepts .content as a content container (RCI-1)", () => {
    const $ = page("page-content-class.html");
    const text = textOf(extractMainContent($));
    expect(text).toContain("Main copy inside a .content wrapper.");
    expect(text).not.toContain("Header block copy.");
    expect(text).not.toContain("Side column copy.");
  });
});

describe("extractMainContent (RCI-1 div-only fallback)", () => {
  it("selects the largest text-bearing div when no semantic container exists", () => {
    const $ = page("page-div-only.html");
    const text = textOf(extractMainContent($));
    expect(text).toContain(
      "The large text-bearing container holds the primary copy",
    );
    expect(text).toContain("clearly exceeds the minimal-text threshold");
    // minimal-text sibling divs ("Bye", "OK") are excluded
    expect(text).not.toBe("Bye");
    expect(text).not.toBe("OK");
  });
});

describe("extractMainContent (RCI-14 malformed tolerance)", () => {
  it("does not throw on unclosed tags and recovers content (RCI-14)", () => {
    const $ = page("page-malformed.html");
    const extracted = extractMainContent($);
    const text = textOf(extracted);
    expect(text).toContain("Unclosed paragraph tag with recoverable content.");
    expect(text).toContain(
      "Nested unclosed div content that cheerio still recovers.",
    );
  });

  it("returns an empty selection for an empty body (RCI-14)", () => {
    const $ = page("page-empty.html");
    const extracted = extractMainContent($);
    expect(extracted.length).toBe(0);
    expect(extracted.text().trim()).toBe("");
  });
});
