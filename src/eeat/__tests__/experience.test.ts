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
