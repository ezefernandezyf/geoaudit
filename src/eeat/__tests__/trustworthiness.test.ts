import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { scoreTrustworthiness } from "@/eeat/trustworthiness";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function page(name: string) {
  return load(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

describe("scoreTrustworthiness (REE-4)", () => {
  it("scores full trust signals at 20 (>=18 required)", () => {
    const result = scoreTrustworthiness(page("page-trust-full.html"));
    expect(result.score).toBe(20);
    expect(result.score).toBeGreaterThanOrEqual(18);
    const keys = result.findings.map((f) => f.key);
    expect(keys).toContain("contact_info");
    expect(keys).toContain("privacy_policy");
    expect(keys).toContain("terms_of_service");
    expect(keys).toContain("https");
    expect(keys).toContain("reviews");
    expect(keys).toContain("disclosure");
  });

  it("scores mailto-only contact at 5 and flags the missing privacy policy", () => {
    const result = scoreTrustworthiness(page("page-trust-contact-only.html"));
    expect(result.score).toBe(5);
    expect(result.findings.map((f) => f.key)).toContain(
      "missing_privacy_policy",
    );
  });

  it("scores 0 with missing-contact and missing-privacy findings on a bare page (<=8)", () => {
    const result = scoreTrustworthiness(page("page-trust-no-legal.html"));
    expect(result.score).toBe(0);
    expect(result.score).toBeLessThanOrEqual(8);
    const keys = result.findings.map((f) => f.key);
    expect(keys).toContain("missing_contact_info");
    expect(keys).toContain("missing_privacy_policy");
    expect(keys).toContain("missing_terms_of_service");
  });
});
