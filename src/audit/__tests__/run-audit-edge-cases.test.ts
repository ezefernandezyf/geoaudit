import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { runAudit } from "@/audit/index";
import { auditResultSchema } from "@/lib/contracts/audit-result";
import { parseRobotsTxt, scoreAccess } from "@/crawlers/index";
import type { FetchImpl } from "@/lib/fetch/redirect";
import type { LookupFn } from "@/lib/fetch/ssrf";

/**
 * T25 part B - orchestrator edge cases (RAO-1 invalid URL, RAO-12 engine
 * failure isolation, RAO-13 non-HTML page, robots.txt 404/gated → all allowed).
 * Zero network: every fetch goes through an injected mock fetcher.
 */

const PAGE_HTML = fs.readFileSync(
  path.join(
    __dirname,
    "..",
    "..",
    "platform",
    "__fixtures__",
    "page-ssr-rich.html",
  ),
  "utf8",
);

const ROBOTS_TXT = [
  "User-agent: *",
  "Allow: /",
  "",
  "User-agent: GPTBot",
  "Disallow: /",
].join("\n");

const NOW = new Date("2025-06-20T00:00:00Z").getTime();

const PUBLIC_LOOKUP: LookupFn = async () => [
  { address: "93.184.216.34", family: 4 },
];

function mockAuditFetch(): FetchImpl {
  return async (input, init) => {
    const url = String(input);
    if (init?.method === "HEAD") {
      return new Response(null, { status: 200 });
    }
    if (url.endsWith("/robots.txt")) {
      return new Response(ROBOTS_TXT, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    const parsed = new URL(url);
    // Brand probes hit a rate-limited Wikipedia/Wikidata (BRA-7) so the
    // engine degrades deterministically in the edge-case tests.
    if (
      parsed.hostname === "en.wikipedia.org" ||
      parsed.hostname === "www.wikidata.org"
    ) {
      return new Response("{}", {
        status: 429,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }
    return new Response(PAGE_HTML, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  };
}

describe("runAudit edge cases (T25 part B)", () => {
  it("RAO-1: returns a degraded AuditResult for an invalid URL without fetching", async () => {
    const fetcher = vi.fn(mockAuditFetch());

    const result = await runAudit("not a url", {
      fetcher,
      lookup: PUBLIC_LOOKUP,
      now: () => NOW,
    });

    expect(fetcher).not.toHaveBeenCalled();

    expect(result.summary.url).toBe("not a url");
    expect(result.summary.geoScore).toBe(0);
    expect(result.summary.severityBand).toBe("Critical");
    expect(result.meta.errors.length).toBeGreaterThan(0);
    expect(result.meta.errors[0]).toContain("Invalid URL format");
    expect(result.meta.startedAt).toBe(NOW);
    expect(result.meta.completedAt).toBe(NOW);

    // No engine ran - every section is the zeroed/empty contract shape.
    expect(result.citability.pageScore).toBe(0);
    expect(result.schema.detected).toEqual([]);
    expect(result.content.composite).toBe(0);
    expect(result.platform.perPlatform).toEqual({});
    expect(result.crawlers.perBot).toEqual({});
  });

  it("RAO-2/RCR-10: a text/plain robots.txt is parsed (probe gate fix) → rules apply", async () => {
    const fetcher: FetchImpl = async (input, init) => {
      const url = String(input);
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      if (url.endsWith("/robots.txt")) {
        // Real robots.txt is text/plain. Since the fetch-layer probe gate fix,
        // the probe kind accepts text/plain so the directives are actually
        // parsed instead of being silently treated as "all allowed".
        return new Response("User-agent: GPTBot\nDisallow: /", {
          status: 200,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
      return new Response(PAGE_HTML, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    };

    const result = await runAudit("https://example.com/", {
      fetcher,
      lookup: PUBLIC_LOOKUP,
      now: () => NOW,
    });

    // The text/plain robots IS parsed - GPTBot is blocked by its Disallow rule.
    expect(result.crawlers.perBot["GPTBot"]).toBe("blocked");

    const headers = new Headers({ "content-type": "text/html; charset=utf-8" });
    const $ = load(PAGE_HTML);
    const expected = scoreAccess(
      parseRobotsTxt("User-agent: GPTBot\nDisallow: /"),
      headers,
      $,
    );
    expect(result.crawlers.compositeScore).toBe(expected.compositeScore);
    expect(auditResultSchema.safeParse(result).success).toBe(true);
  });

  it("RAO-13: a non-HTML page zeroes the content engines while the crawler still runs", async () => {
    const fetcher: FetchImpl = async (input, init) => {
      const url = String(input);
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      if (url.endsWith("/robots.txt")) {
        return new Response(ROBOTS_TXT, {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      return new Response("%PDF-1.4\nfake", {
        status: 200,
        headers: { "content-type": "application/pdf" },
      });
    };

    const result = await runAudit("https://example.com/", {
      fetcher,
      lookup: PUBLIC_LOOKUP,
      now: () => NOW,
    });

    // All four content engines report unsupported via zeroed sections.
    expect(result.citability.pageScore).toBe(0);
    expect(result.citability.top3).toEqual([]);
    expect(result.content.composite).toBe(0);
    expect(result.schema.detected).toEqual([]);
    expect(result.platform.perPlatform).toEqual({});

    // The brand engine still runs (RAO-15) but the non-JSON mock body makes
    // it degrade to the empty error shape instead of fabricating presence.
    expect(result.brandAuthority?.status).toBe("error");
    expect(result.brandAuthority?.reason).toBe("invalid_json");

    // The crawler engine still ran over the parsed robots.txt.
    expect(result.crawlers.perBot["GPTBot"]).toBe("blocked");
    const headers = new Headers({ "content-type": "text/html; charset=utf-8" });
    const expected = scoreAccess(parseRobotsTxt(ROBOTS_TXT), headers, load(""));
    expect(result.crawlers.compositeScore).toBe(expected.compositeScore);

    // meta.errors records the shared unsupported reason for the four content
    // engines plus the isolated brand failure (RAO-12).
    expect(result.meta.errors).toHaveLength(5);
    const unsupported = result.meta.errors.filter((entry) =>
      entry.includes("unsupported_content_type"),
    );
    expect(unsupported).toHaveLength(4);
    expect(result.meta.errors).toContain("brand: invalid_json");

    // Crawler-only input cannot compose the technical dimension (RGS-2 needs
    // platform) → GEO Score 0 / Critical, and the result stays Zod-valid.
    expect(result.summary.geoScore).toBe(0);
    expect(result.summary.severityBand).toBe("Critical");
    expect(auditResultSchema.safeParse(result).success).toBe(true);
  });

  it("RAO-12: a throwing engine is isolated - others produce results and meta.errors records the failure", async () => {
    const fetcher = mockAuditFetch();
    const throwingScorePage = () => {
      throw new Error("citability exploded");
    };

    const result = await runAudit("https://example.com/", {
      fetcher,
      lookup: PUBLIC_LOOKUP,
      now: () => NOW,
      scorePage: throwingScorePage,
    });

    // The failed engine is degraded to the zeroed contract shape.
    expect(result.citability.pageScore).toBe(0);
    expect(result.citability.suggestions).toEqual([]);

    // The other engines still produced real results.
    expect(result.crawlers.compositeScore).toBe(80);
    expect(result.crawlers.perBot["GPTBot"]).toBe("blocked");
    expect(result.content.composite).toBe(5);
    expect(result.schema.detected.length).toBeGreaterThan(0);
    expect(result.platform.perPlatform["aio"]).toBeDefined();

    // meta.errors records the citability failure.
    expect(result.meta.errors).toContain("citability: citability exploded");

    // The GEO Score is computed from the 4 available engines (citability
    // excluded, weights rebalanced - RGS-9).
    expect(result.summary.geoScore).toBeGreaterThan(0);
    expect(result.summary.geoScore).toBeLessThanOrEqual(100);
    expect(auditResultSchema.safeParse(result).success).toBe(true);
  });

  it("RAO-12/RAO-15: a rate-limited brand API isolates brand - 5 engines valid + meta.errors brand:", async () => {
    const fetcher: FetchImpl = async (input, init) => {
      const url = String(input);
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      if (url.endsWith("/robots.txt")) {
        return new Response(ROBOTS_TXT, {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      const parsed = new URL(url);
      if (
        parsed.hostname === "en.wikipedia.org" ||
        parsed.hostname === "www.wikidata.org"
      ) {
        return new Response("{}", {
          status: 429,
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      }
      return new Response(PAGE_HTML, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    };

    const result = await runAudit("https://example.com/", {
      fetcher,
      lookup: PUBLIC_LOOKUP,
      now: () => NOW,
    });

    // brandAuthority holds the empty error shape (BRA-7/RAO-15 fallback).
    expect(result.brandAuthority?.status).toBe("error");
    expect(result.brandAuthority?.reason).toBe("rate_limit");
    expect(result.brandAuthority?.score).toBe(0);

    // The 5 other engines produced valid results.
    expect(result.crawlers.compositeScore).toBe(80);
    expect(result.crawlers.perBot["GPTBot"]).toBe("blocked");
    expect(result.citability.pageScore).toBe(40);
    expect(result.content.composite).toBe(5);
    expect(result.schema.detected.length).toBeGreaterThan(0);
    expect(result.platform.perPlatform["aio"]).toBeDefined();

    // meta.errors records the brand failure with its stable reason.
    expect(result.meta.errors).toContain("brand: rate_limit");

    // Brand excluded from the composite (RGS-9): the 5 remaining dimensions
    // rebalance over 80% and yield 45 / Poor on this fixture.
    expect(result.summary.geoScore).toBe(45);
    expect(result.summary.severityBand).toBe("Poor");
    expect(auditResultSchema.safeParse(result).success).toBe(true);
  });
});
