import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { scoreAuthoritativeness } from "@/eeat/authoritativeness";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function page(name: string) {
  return load(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

describe("scoreAuthoritativeness (REE-3)", () => {
  it("scores external citations with authority-domain matches at 12", () => {
    const result = scoreAuthoritativeness(
      page("page-authoritativeness-citations.html"),
    );
    expect(result.score).toBe(12);
    const keys = result.findings.map((f) => f.key);
    expect(keys).toContain("external_citations");
    expect(keys).toContain("authority_domains");
    const authority = result.findings.find(
      (f) => f.key === "authority_domains",
    );
    expect(authority?.detail).toContain("wikipedia.org");
    expect(authority?.detail).toContain("w3.org");
  });

  it("scores only citation credit for non-authority external links", () => {
    const result = scoreAuthoritativeness(
      page("page-authoritativeness-non-authority.html"),
    );
    expect(result.score).toBe(4);
    expect(result.findings.map((f) => f.key)).not.toContain(
      "authority_domains",
    );
  });

  it("awards sameAs credit without authority citations (REE-3 partial)", () => {
    const result = scoreAuthoritativeness(
      page("page-authoritativeness-sameas-only.html"),
    );
    // 1 non-authority citation (2) + 1 sameAs link (5) = 7 - intermediate, not 0.
    expect(result.score).toBe(7);
    expect(result.findings.map((f) => f.key)).toContain("same_as_links");
  });

  it("approaches the cap with authority citations and sameAs links (REE-3)", () => {
    const result = scoreAuthoritativeness(
      page("page-authoritativeness-sameas-rich.html"),
    );
    // 3 authority citations (6 + 9) + 2 sameAs (10) = 25 → cap.
    expect(result.score).toBe(25);
    expect(result.findings.map((f) => f.key)).toEqual(
      expect.arrayContaining([
        "external_citations",
        "authority_domains",
        "same_as_links",
      ]),
    );
  });

  it("scores 0 and flags no external citations when none exist (REE-10)", () => {
    const result = scoreAuthoritativeness(
      page("page-authoritativeness-none.html"),
    );
    expect(result.score).toBe(0);
    expect(result.findings.map((f) => f.key)).toContain(
      "no_external_citations",
    );
  });
});
