import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { runAudit } from "@/audit/index";
import { auditResultSchema } from "@/lib/contracts/audit-result";
import { computeGeoScore, GEO_SCORE_V3_1_WEIGHTS } from "@/scoring/index";
import { parseRobotsTxt, scoreAccess } from "@/crawlers/index";
import { scorePage } from "@/citability/index";
import { scoreEeat } from "@/eeat/index";
import { scoreSchema } from "@/schema/index";
import { scorePlatform, applyBrandCriteria } from "@/platform/index";
import { scoreBrand } from "@/brand/index";
import type { FetchImpl } from "@/lib/fetch/redirect";
import type { LookupFn } from "@/lib/fetch/ssrf";

/**
 * T25 part A - runAudit happy path (RAO-1, RAO-3, RAO-10, RAO-11) with the
 * 6-engine pipeline (RAO-15). Zero network: the page + robots.txt fetches,
 * the sitemap/llms.txt probes AND the Wikipedia/Wikidata brand probes all go
 * through an injected mock fetcher, and DNS goes through an injected public
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

/** One Wikidata statement: `claim.mainsnak.datavalue.value` (BRA-2/4). */
function wikidataStatement(value: unknown) {
  return { mainsnak: { datavalue: { value } } };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/**
 * Mock fetch routing used by every test:
 * - HEAD -> sitemap.xml / llms.txt probes (both present).
 * - GET /robots.txt -> robots body served as text/html so it passes the fetch
 *   layer's RFL-8 content-type gate and reaches parseRobotsTxt (production
 *   text/plain robots.txt hits the gate and flows through the "missing ->
 *   all allowed" path, covered in part B).
 * - GET en.wikipedia.org -> brand search hit "Example" (BRA-1 presence).
 * - GET www.wikidata.org -> wbsearchentities hit Q111 + wbgetentities claims
 *   (P31 Q4830453 accepted type, P856 matching domain, claimCount >= 10) so
 *   the brand engine scores a full 100.
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
    const parsed = new URL(url);
    if (parsed.hostname === "en.wikipedia.org") {
      return jsonResponse({
        query: { search: [{ title: "Example" }] },
      });
    }
    if (parsed.hostname === "www.wikidata.org") {
      const action = parsed.searchParams.get("action");
      if (action === "wbsearchentities") {
        return jsonResponse({
          search: [
            {
              id: "Q111",
              label: "Example",
              description: "Example is an AI visibility analytics platform",
            },
          ],
        });
      }
      if (action === "wbgetentities") {
        return jsonResponse({
          entities: {
            Q111: {
              claims: {
                P31: [wikidataStatement({ id: "Q4830453" })],
                P856: [wikidataStatement("https://example.com")],
                P200: Array.from({ length: 10 }, () => wikidataStatement("v")),
              },
            },
          },
        });
      }
    }
    return new Response(PAGE_HTML, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  };
}

describe("runAudit happy path (RAO-1, RAO-3, RAO-10, RAO-11, RAO-15)", () => {
  it("completes a deterministic, Zod-valid 6-engine AuditResult for a valid URL with zero network", async () => {
    const result = await runAudit("https://example.com/", {
      fetcher: mockAuditFetch(),
      lookup: PUBLIC_LOOKUP,
      now: () => NOW,
    });

    expect(auditResultSchema.safeParse(result).success).toBe(true);

    expect(result.summary.url).toBe("https://example.com/");
    // v3.1 composite over the fixture: citability 40, eeat 5, schema 53,
    // technical 76 (crawler 80 x .6 + aio 70 x .4), platform 70, brand 100.
    expect(result.summary.geoScore).toBe(50);
    expect(result.summary.severityBand).toBe("Fair");
    expect(result.summary.durationMs).toBe(0);
    expect(result.scoringModelVersion).toBe("3.1.0");

    expect(result.meta.auditVersion).toBe("0.1.0");
    expect(result.meta.startedAt).toBe(NOW);
    expect(result.meta.completedAt).toBe(NOW);
    expect(result.meta.errors).toEqual([]);

    // All six engine sections carry real, deterministic output.
    expect(result.crawlers.compositeScore).toBe(80);
    expect(result.crawlers.perBot["GPTBot"]).toBe("blocked");
    expect(result.citability.pageScore).toBe(40);
    expect(result.content.composite).toBe(5);
    expect(result.schema.detected.length).toBeGreaterThan(0);
    expect(result.platform.perPlatform["aio"]).toBeDefined();
    expect(
      (result.platform.perPlatform["aio"] as { score?: number }).score,
    ).toBe(70);

    // The brand engine ran and its full-presence result is mapped (RAO-15).
    expect(result.brandAuthority?.status).toBe("success");
    expect(result.brandAuthority?.score).toBe(100);
    expect(result.brandAuthority?.entity.wikipediaTitle).toBe("Example");
    expect(result.brandAuthority?.entity.wikidataId).toBe("Q111");

    // applyBrandCriteria wired the brand signals into chatgpt/perplexity
    // before platformToContract (RPL-11): chatgpt 10+30, perplexity 40+5.
    const chatgpt = result.platform.perPlatform["chatgpt"] as {
      score?: number;
      criteria?: Array<{ key: string; status: string }>;
    };
    const perplexity = result.platform.perPlatform["perplexity"] as {
      score?: number;
    };
    expect(chatgpt.score).toBe(40);
    expect(perplexity.score).toBe(45);
    const wikipedia = chatgpt.criteria?.find((c) => c.key === "wikipedia");
    expect(wikipedia?.status).toBe("measured");
  });

  it("computes the GEO Score per GEO_SCORE_V3_1_WEIGHTS from the wired 6-engine scores", async () => {
    const fetcher = mockAuditFetch();
    const result = await runAudit("https://example.com/", {
      fetcher,
      lookup: PUBLIC_LOOKUP,
    });

    // Re-run the six engines independently over the same fixture inputs to
    // derive the expected composite without trusting the orchestrator's wiring.
    const headers = new Headers({ "content-type": "text/html; charset=utf-8" });
    const $ = load(PAGE_HTML);
    const brand = await scoreBrand("example.com", { fetcher });
    const platform = await scorePlatform(
      { $, html: PAGE_HTML, headers, origin: "https://example.com" },
      { fetcher },
    );
    const platforms = applyBrandCriteria(platform.perPlatform.platforms, {
      entityPresence: brand.signals.entityPresence,
      entityConsistency: brand.signals.entityConsistency,
      wikidataId: brand.entity.wikidataId,
    });
    const expected = computeGeoScore(
      {
        citability: scorePage($).pageScore,
        eeat: scoreEeat($).composite,
        schema: scoreSchema($).score,
        crawler: scoreAccess(parseRobotsTxt(ROBOTS_TXT), headers, $)
          .compositeScore,
        platform: platforms.aio.score,
        brand_authority: brand.score,
      },
      GEO_SCORE_V3_1_WEIGHTS,
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
    expect(result.brandAuthority?.status).toBe("success");
  });

  it("RAO-14: completes under the 8s budget with six engines over the fixture", async () => {
    const startedAt = Date.now();
    const result = await runAudit("https://example.com/", {
      fetcher: mockAuditFetch(),
      lookup: PUBLIC_LOOKUP,
    });
    const elapsedMs = Date.now() - startedAt;

    expect(elapsedMs).toBeLessThan(8000);
    expect(result.summary.durationMs).toBeLessThan(8000);
    expect(result.brandAuthority?.status).toBe("success");
  });
});
