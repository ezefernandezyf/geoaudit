import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { analyzeMeta, analyzeOpenGraph, analyzeTwitter } from "@/platform/meta";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function page(name: string) {
  return load(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

describe("analyzeMeta (RPL-2)", () => {
  it("reports title, description and viewport presence on a complete page", () => {
    const result = analyzeMeta(page("page-meta-full.html"));
    expect(result.title).toBe("GeoAudit — AI Visibility Audit Platform");
    expect(result.titleLength).toBeGreaterThan(0);
    expect(result.description).not.toBeNull();
    expect(result.descriptionLength).toBeGreaterThanOrEqual(120);
    expect(result.hasViewport).toBe(true);
    expect(result.findings).toEqual([]);
    expect(result.score).toBe(100);
  });

  it("raises a High missing_description finding when no description exists", () => {
    const result = analyzeMeta(page("page-meta-minimal.html"));
    const finding = result.findings.find(
      (f) => f.key === "missing_description",
    );
    expect(finding).toBeDefined();
    expect(finding?.severity).toBe("High");
    expect(result.score).toBeLessThan(100);
  });
});

describe("analyzeOpenGraph (RPL-3)", () => {
  it("marks all five og properties present and scores full coverage", () => {
    const result = analyzeOpenGraph(page("page-meta-full.html"));
    expect(result.presentCount).toBe(5);
    expect(result.score).toBe(100);
    expect(result.properties["og:title"].present).toBe(true);
    expect(result.properties["og:image"].value).toBe(
      "https://example.com/og-image.png",
    );
    expect(result.findings).toEqual([]);
  });

  it("marks all properties absent and raises a High missing_open_graph finding", () => {
    const result = analyzeOpenGraph(page("page-meta-no-og.html"));
    expect(result.presentCount).toBe(0);
    expect(result.score).toBe(0);
    const finding = result.findings.find((f) => f.key === "missing_open_graph");
    expect(finding).toBeDefined();
    expect(finding?.severity).toBe("High");
  });
});

describe("analyzeTwitter (RPL-4)", () => {
  it("detects twitter:card and the other twitter properties when present", () => {
    const result = analyzeTwitter(page("page-meta-full.html"));
    expect(result.properties["twitter:card"].present).toBe(true);
    expect(result.properties["twitter:card"].value).toBe("summary_large_image");
    expect(result.presentCount).toBe(4);
  });

  it("raises an Info missing_twitter_card finding when no twitter tags exist", () => {
    const result = analyzeTwitter(page("page-meta-no-og.html"));
    expect(result.properties["twitter:card"].present).toBe(false);
    const finding = result.findings.find(
      (f) => f.key === "missing_twitter_card",
    );
    expect(finding).toBeDefined();
  });
});
