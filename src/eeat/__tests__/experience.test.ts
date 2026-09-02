import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { scoreExperience } from "@/eeat/experience";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function page(name: string) {
  return load(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

describe("scoreExperience (REE-1)", () => {
  it("scores rich first-person case-study content at 25 (>=15 required)", () => {
    const result = scoreExperience(page("page-experience-rich.html"));
    expect(result.score).toBe(25);
    expect(result.score).toBeGreaterThanOrEqual(15);
  });

  it("scores first-person without a case-study section at 10", () => {
    const result = scoreExperience(
      page("page-experience-first-person-only.html"),
    );
    expect(result.score).toBe(10);
  });

  it("scores impersonal third-party content at 0 (<=5 required)", () => {
    const result = scoreExperience(page("page-experience-impersonal.html"));
    expect(result.score).toBe(0);
    expect(result.score).toBeLessThanOrEqual(5);
  });

  it("enumerates the detected patterns in the dimension breakdown", () => {
    const result = scoreExperience(page("page-experience-rich.html"));
    const keys = result.findings.map((f) => f.key);
    expect(keys).toContain("first_person");
    expect(keys).toContain("case_study_phrase");
    expect(keys).toContain("case_study_heading");
  });
});

describe("scoreExperience changelog proxy (REE-1, design D7)", () => {
  it("earns experience credit from a Release notes heading with version entries", () => {
    const $ = load(`
      <main>
        <h1>Product documentation</h1>
        <h2>Release notes</h2>
        <p>v18.2.0 adds faster search indexing.</p>
        <p>v18.3.0 fixes the reporting export.</p>
        <h2>Installation</h2>
        <p>Users can install the package with a single command.</p>
      </main>
    `);
    const result = scoreExperience($);
    expect(result.score).toBeGreaterThanOrEqual(10);
    const keys = result.findings.map((f) => f.key);
    expect(keys).toContain("changelog_proxy");
    expect(
      result.findings.find((f) => f.key === "changelog_proxy")?.label,
    ).toBe("Changelog/release notes detected");
  });

  it("credits Changelog and What's New headings too", () => {
    const changelog = scoreExperience(
      load(
        "<main><h2>Changelog</h2><p>Users can see the latest fixes here.</p></main>",
      ),
    );
    expect(changelog.score).toBeGreaterThanOrEqual(10);
    expect(changelog.findings.map((f) => f.key)).toContain("changelog_proxy");

    const whatsNew = scoreExperience(
      load(
        "<main><h2>What's New</h2><p>The team publishes updates here.</p></main>",
      ),
    );
    expect(whatsNew.score).toBeGreaterThanOrEqual(10);
    expect(whatsNew.findings.map((f) => f.key)).toContain("changelog_proxy");
  });

  it("does not break the honest 0 of impersonal content (no changelog signals)", () => {
    const result = scoreExperience(
      load(
        "<main><h1>Industry report</h1><p>The company reported steady growth. Users can rely on the data.</p></main>",
      ),
    );
    expect(result.score).toBeLessThanOrEqual(5);
    expect(result.findings.map((f) => f.key)).not.toContain("changelog_proxy");
  });
});
