import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { runAudit } from "@/audit/index";
import { auditResultSchema } from "@/lib/contracts/audit-result";
import { computeGeoScore, SPRINT_1_WEIGHTS } from "@/scoring/index";
import { parseRobotsTxt, scoreAccess } from "@/crawlers/index";
import { scorePage } from "@/citability/index";
import { scoreEeat } from "@/eeat/index";
import { scoreSchema } from "@/schema/index";
import { scorePlatform } from "@/platform/index";
import type { FetchImpl } from "@/lib/fetch/redirect";
import type { LookupFn } from "@/lib/fetch/ssrf";

/**
 * T25 part A — runAudit happy path (RAO-1, RAO-3, RAO-10, RAO-11). Zero
 * network: the page + robots.txt fetches and the sitemap/llms.txt probes all
 * go through an injected mock fetcher, and DNS goes through an injected public
 * lookup. Assertions are deterministic over the shared rich-page fixture.
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

/**
 * Fixed clock past the fixture's <time datetime="2025-06-01"> so the eeat
 * freshness days-since is a positive, deterministic number.
 */
const NOW = new Date("2025-06-20T00:00:00Z").getTime();

const PUBLIC_LOOKUP: LookupFn = async () => [
  { address: "93.184.216.34", family: 4 },
];

/**
 * Mock fetch routing used by every test:
 * - HEAD -> sitemap.xml / llms.txt probes (both present).
 * - GET /robots.txt -> robots body served as text/html so it passes the fetch
 *   layer's RFL-8 content-type gate and reaches parseRobotsTxt (production
 *   text/plain robots.txt hits the gate and flows through the "missing ->
 *   all allowed" path, covered in part B).
 * - GET page -> the shared rich-page fixture.
 */
function mockAuditFetch(): FetchImpl {
  return async (input, init) => {
    const url = String(input);
    if (init?.method === "HEAD") {
      const present = url.endsWith("/sitemap.xml") || url.endsWith("/llms.txt");
      return new Response(null, { status: present ? 200 : 404 });
    }
    if (url.endsWith("/robots.txt")) {
      return new Response(ROBOTS_TXT, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    return new Response(PAGE_HTML, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  };
}

describe("runAudit happy path (RAO-1, RAO-3, RAO-10, RAO-11)", () => {
  it("completes a deterministic, Zod-valid AuditResult for a valid URL with zero network", async () => {
    const result = await runAudit("https://example.com/", {
      fetcher: mockAuditFetch(),
      lookup: PUBLIC_LOOKUP,
      now: () => NOW,
    });

    expect(auditResultSchema.safeParse(result).success).toBe(true);

    expect(result.summary.url).toBe("https://example.com/");
    expect(result.summary.geoScore).toBe(41);
    expect(result.summary.severityBand).toBe("Poor");
    expect(result.summary.durationMs).toBe(0);
    expect(result.scoringModelVersion).toBe("1.0.0");

    expect(result.meta.auditVersion).toBe("0.1.0");
    expect(result.meta.startedAt).toBe(NOW);
    expect(result.meta.completedAt).toBe(NOW);
    expect(result.meta.errors).toEqual([]);

    // All five engine sections carry real, deterministic output.
    expect(result.crawlers.compositeScore).toBe(80);
    expect(result.crawlers.perBot["GPTBot"]).toBe("blocked");
    expect(result.citability.pageScore).toBe(33);
    expect(result.content.composite).toBe(5);
    expect(result.schema.detected.length).toBeGreaterThan(0);
    expect(result.platform.perPlatform["aio"]).toBeDefined();
    expect(
      (result.platform.perPlatform["aio"] as { score?: number }).score,
    ).toBe(70);
  });

  it("computes the GEO Score per SPRINT_1_WEIGHTS from the wired engine scores", async () => {
    const fetcher = mockAuditFetch();
    const result = await runAudit("https://example.com/", {
      fetcher,
      lookup: PUBLIC_LOOKUP,
    });

    // Re-run the five engines independently over the same fixture inputs to
    // derive the expected composite without trusting the orchestrator's wiring.
    const headers = new Headers({ "content-type": "text/html; charset=utf-8" });
    const $ = load(PAGE_HTML);
    const platform = await scorePlatform(
      { $, html: PAGE_HTML, headers, origin: "https://example.com" },
      { fetcher },
    );
    const expected = computeGeoScore(
      {
        citability: scorePage($).pageScore,
        eeat: scoreEeat($).composite,
        schema: scoreSchema($).score,
        crawler: scoreAccess(parseRobotsTxt(ROBOTS_TXT), headers, $)
          .compositeScore,
        platform: platform.perPlatform.platforms.aio.score,
      },
      SPRINT_1_WEIGHTS,
    );

    expect(result.summary.geoScore).toBe(expected.geoScore);
    expect(result.summary.severityBand).toBe(expected.severityBand);
    expect(result.summary.geoScore).toBeGreaterThanOrEqual(0);
    expect(result.summary.geoScore).toBeLessThanOrEqual(100);
  });

  it("reports a non-negative durationMs with the default wall clock", async () => {
    const result = await runAudit("https://example.com/", {
      fetcher: mockAuditFetch(),
      lookup: PUBLIC_LOOKUP,
    });

    expect(result.summary.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.meta.completedAt).toBeGreaterThanOrEqual(
      result.meta.startedAt,
    );
  });

  it("normalizes an http URL to https and reports the normalized URL", async () => {
    const result = await runAudit("http://example.com/", {
      fetcher: mockAuditFetch(),
      lookup: PUBLIC_LOOKUP,
      now: () => NOW,
    });

    expect(result.summary.url).toBe("https://example.com/");
    expect(auditResultSchema.safeParse(result).success).toBe(true);
    expect(result.crawlers.perBot["GPTBot"]).toBe("blocked");
  });
});
