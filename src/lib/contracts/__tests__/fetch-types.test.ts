import { describe, expect, it } from "vitest";
import { load } from "cheerio";
import {
  fetchErrorSchema,
  fetchResultSchema,
  parsedPageSchema,
  robotsTxtSchema,
} from "@/lib/contracts/fetch-types";
import type { ParsedPage } from "@/lib/contracts/fetch-types";

function parsedPageFixture(overrides: Partial<ParsedPage> = {}): ParsedPage {
  return {
    html: "<html><head><title>Example</title></head><body><p>Hello</p></body></html>",
    $: load("<html><body><p>Hello</p></body></html>"),
    headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
    finalUrl: "https://example.com/",
    charset: "UTF-8",
    statusCode: 200,
    contentType: "text/html; charset=utf-8",
    ...overrides,
  };
}

describe("parsedPageSchema", () => {
  it("parses a full ParsedPage payload and preserves html and finalUrl", () => {
    const result = parsedPageSchema.safeParse(parsedPageFixture());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.html).toContain("<title>Example</title>");
      expect(result.data.finalUrl).toBe("https://example.com/");
      expect(result.data.statusCode).toBe(200);
    }
  });

  it("rejects a ParsedPage missing the parsed DOM ($)", () => {
    const fixture = parsedPageFixture();
    const withoutDom = {
      html: fixture.html,
      headers: fixture.headers,
      finalUrl: fixture.finalUrl,
      charset: fixture.charset,
      statusCode: fixture.statusCode,
      contentType: fixture.contentType,
    };
    const result = parsedPageSchema.safeParse(withoutDom);
    expect(result.success).toBe(false);
  });
});

describe("fetchResultSchema (RFL-8/RFL-11 discriminated union)", () => {
  it("discriminates the ok:true parsed variant", () => {
    const result = fetchResultSchema.safeParse({
      ok: true,
      parsed: parsedPageFixture(),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ok).toBe(true);
      if (result.data.ok) {
        expect(result.data.parsed.finalUrl).toBe("https://example.com/");
      }
    }
  });

  it("discriminates the unsupported_content_type variant and preserves contentType", () => {
    const result = fetchResultSchema.safeParse({
      ok: false,
      reason: "unsupported_content_type",
      contentType: "application/pdf",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ok).toBe(false);
      expect("reason" in result.data).toBe(true);
      if ("reason" in result.data) {
        expect(result.data.reason).toBe("unsupported_content_type");
        expect(result.data.contentType).toBe("application/pdf");
      }
    }
  });

  it("discriminates the typed error variant with a FetchError code", () => {
    const result = fetchResultSchema.safeParse({
      ok: false,
      error: { code: "TOO_MANY_REDIRECTS", message: "redirect limit exceeded" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ok).toBe(false);
      expect("error" in result.data).toBe(true);
      if ("error" in result.data) {
        expect(result.data.error.code).toBe("TOO_MANY_REDIRECTS");
        expect(result.data.error.message).toContain("redirect limit");
      }
    }
  });

  it("rejects an ok:true payload without a parsed page", () => {
    const result = fetchResultSchema.safeParse({ ok: true });
    expect(result.success).toBe(false);
  });

  it("rejects a FetchError with an unknown code", () => {
    const result = fetchErrorSchema.safeParse({
      code: "SOMETHING_ELSE",
      message: "nope",
    });
    expect(result.success).toBe(false);
  });
});

describe("robotsTxtSchema (RCR-7 ancillary directives)", () => {
  it("parses groups, sitemaps, and crawlDelay", () => {
    const result = robotsTxtSchema.safeParse({
      groups: [
        { userAgents: ["*"], allow: ["/public"], disallow: ["/private"] },
      ],
      sitemaps: ["https://example.com/sitemap.xml"],
      crawlDelay: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.groups[0].disallow).toEqual(["/private"]);
      expect(result.data.crawlDelay).toBe(1);
    }
  });

  it("accepts a robots.txt with no ancillary data (crawlDelay null, empty sitemaps)", () => {
    const result = robotsTxtSchema.safeParse({
      groups: [],
      sitemaps: [],
      crawlDelay: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.crawlDelay).toBeNull();
      expect(result.data.sitemaps).toEqual([]);
    }
  });
});
