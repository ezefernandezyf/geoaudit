import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { detectBusinessType } from "@/schema/classify";
import { extractJsonLd } from "@/schema/extract";
import { parseBlocks } from "@/schema/parse";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function page(name: string) {
  return load(fs.readFileSync(path.join(fixturesDir, name), "utf8"));
}

function classify(name: string) {
  const $ = page(name);
  const blocks = parseBlocks(extractJsonLd($)).blocks;
  return detectBusinessType($, blocks);
}

describe("detectBusinessType (RSC-8)", () => {
  it("detects saas from SoftwareApplication schema and product-company signals", () => {
    expect(classify("page-saas-signals.html")).toBe("saas");
  });

  it("detects ecommerce from Product schema and shop/cart/price signals", () => {
    expect(classify("page-ecommerce-signals.html")).toBe("ecommerce");
  });

  it("detects local from LocalBusiness schema, address, phone and hours", () => {
    expect(classify("page-local-signals.html")).toBe("local");
  });

  it("detects publisher from Article schema, byline and editorial copy", () => {
    expect(classify("page-publisher-signals.html")).toBe("publisher");
  });

  it("detects agency from agency copy and portfolio language", () => {
    expect(classify("page-agency-signals.html")).toBe("agency");
  });

  it("returns hybrid when multiple types tie (SaaS + local signals)", () => {
    expect(classify("page-hybrid-signals.html")).toBe("hybrid");
  });

  it("falls back to hybrid when no business signals are found", () => {
    expect(classify("page-no-signals.html")).toBe("hybrid");
  });
});
