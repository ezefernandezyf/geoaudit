import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { scoreEeat, toContractResult } from "@/eeat/index";
import { contentResultSchema } from "@/lib/contracts/audit-result";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function page(name: string) {
  return load(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

describe("scoreEeat composite (REE-9, REE-8)", () => {
  it("returns the composite as the exact sum of the four dimensions (84)", () => {
    const result = scoreEeat(page("page-eeat-rich.html"));
    expect(result.experience.score).toBe(25);
    expect(result.expertise.score).toBe(22);
    // REE-3 WU-3: the Person JSON-LD sameAs adds 5 → 12 + 5 = 17.
    expect(result.authoritativeness.score).toBe(17);
    expect(result.trustworthiness.score).toBe(20);
    expect(result.composite).toBe(84);
    expect(result.composite).toBe(
      result.experience.score +
        result.expertise.score +
        result.authoritativeness.score +
        result.trustworthiness.score,
    );
  });

  it("always reports topicalAuthority not_measured with rationale (REE-8)", () => {
    const result = scoreEeat(page("page-eeat-rich.html"));
    expect(result.topicalAuthority).toBe("not_measured");
    expect(result.topicalAuthorityRationale).toBe(
      "Single-page limit; multi-page crawl required (Sprint 5+)",
    );
  });

  it("handles an empty body gracefully with a Zod-valid contract (REE-10)", () => {
    const result = scoreEeat(load(""));
    expect(result.composite).toBe(0);
    const contract = toContractResult(result);
    expect(contentResultSchema.safeParse(contract).success).toBe(true);
    expect(contract.composite).toBe(0);
    expect(contract.experience).toBe(0);
  });

  it("maps the engine output to the shared ContentResult contract and Zod-validates", () => {
    const result = scoreEeat(page("page-eeat-rich.html"));
    const contract = toContractResult(result);
    expect(contract.experience).toBe(25);
    expect(contract.expertise).toBe(22);
    expect(contract.authoritativeness).toBe(17);
    expect(contract.trustworthiness).toBe(20);
    expect(contract.composite).toBe(84);
    expect(contract.wordCount).toBe(result.wordCount.count);
    expect(contract.headings).toBe(result.headings.count);
    expect(contract.topicalAuthority).toBe("not_measured");
    expect(contentResultSchema.safeParse(contract).success).toBe(true);
  });

  it("uses an injectable clock for the freshness days-since computation", () => {
    const now = Date.UTC(2025, 5, 15);
    const result = scoreEeat(page("page-meta-dates.html"), { now: () => now });
    expect(result.freshness.dateModified).toBe("2025-06-01");
    expect(result.freshness.daysSinceModification).toBe(14);
    expect(result.freshness.finding).toBe("date_detected");
  });
});
