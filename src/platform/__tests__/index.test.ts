import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { platformResultSchema } from "@/lib/contracts/audit-result";
import { scorePlatform, toContractResult } from "@/platform/index";
import type { ProbeFn } from "@/platform/probes";
import {
  HEADERS_COMPLETE,
  HEADERS_NO_CANONICAL,
} from "@/platform/__fixtures__/headers";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function page(name: string) {
  const html = fs.readFileSync(path.join(fixturesDir, name), "utf8");
  return { $: load(html), html };
}

function probeFetch(statuses: Record<string, number>): ProbeFn {
  return async (input) => {
    const status = statuses[String(input)] ?? 404;
    return new Response(null, { status });
  };
}

const ALL_PRESENT = probeFetch({
  "https://example.com/sitemap.xml": 200,
  "https://example.com/llms.txt": 200,
});
const ALL_ABSENT = probeFetch({});

describe("scorePlatform (RPL-10, RPL-6, RPL-7)", () => {
  it("scores the rich page as AIO-ready (>= 70) with contributing on-page signals", async () => {
    const { $, html } = page("page-ssr-rich.html");
    const result = await scorePlatform(
      { $, html, headers: HEADERS_COMPLETE, origin: "https://example.com" },
      { fetcher: ALL_PRESENT },
    );
    const aio = result.perPlatform.platforms.aio;
    expect(aio.score).toBeGreaterThanOrEqual(70);
    const measured = aio.criteria.filter((c) => c.status === "measured");
    expect(measured.length).toBeGreaterThan(3);
    expect(measured.every((c) => c.points > 0)).toBe(true);
  });

  it("reports sitemap and llms.txt probes from the injected fetcher", async () => {
    const { $, html } = page("page-ssr-rich.html");
    const result = await scorePlatform(
      { $, html, headers: HEADERS_COMPLETE, origin: "https://example.com" },
      { fetcher: ALL_PRESENT },
    );
    expect(result.probes.sitemap.present).toBe(true);
    expect(result.probes.llmsTxt.present).toBe(true);
  });

  it("labels external criteria as not_measured with the mandated note (RPL-11)", async () => {
    const { $, html } = page("page-ssr-rich.html");
    const result = await scorePlatform(
      { $, html, headers: HEADERS_COMPLETE, origin: "https://example.com" },
      { fetcher: ALL_PRESENT },
    );
    const perplexity = result.perPlatform.platforms.perplexity;
    const reddit = perplexity.criteria.find((c) => c.key === "reddit");
    expect(reddit?.status).toBe("not_measured");
    expect(reddit?.note).toBe("Requires brand-mention scanner (future sprint)");
    const gemini = result.perPlatform.platforms.gemini;
    const youtube = gemini.criteria.find((c) => c.key === "youtube");
    expect(youtube?.status).toBe("not_measured");
    expect(youtube?.note).toBe(
      "Requires brand-mention scanner (future sprint)",
    );
  });

  it("reports absent probes when both files 404", async () => {
    const { $, html } = page("page-ssr-rich.html");
    const result = await scorePlatform(
      { $, html, headers: HEADERS_COMPLETE, origin: "https://example.com" },
      { fetcher: ALL_ABSENT },
    );
    expect(result.probes.sitemap.present).toBe(false);
    expect(result.probes.llmsTxt.present).toBe(false);
    expect(result.probes.sitemap.statusCode).toBe(404);
  });

  it("flags an empty shell as client_side_shell with a Critical SSR finding", async () => {
    const { $, html } = page("page-ssr-shell.html");
    const result = await scorePlatform(
      { $, html, headers: HEADERS_NO_CANONICAL, origin: "https://example.com" },
      { fetcher: ALL_PRESENT },
    );
    expect(result.ssr.status).toBe("client_side_shell");
    const finding = result.ssr.findings.find(
      (f) => f.key === "no_ssr_detected",
    );
    expect(finding).toBeDefined();
    expect(finding?.severity).toBe("Critical");
  });
});

describe("toContractResult (PlatformResult contract)", () => {
  it("maps the rich engine output to the shared contract and Zod-validates", async () => {
    const { $, html } = page("page-ssr-rich.html");
    const result = await scorePlatform(
      { $, html, headers: HEADERS_COMPLETE, origin: "https://example.com" },
      { fetcher: ALL_PRESENT },
    );
    const contract = toContractResult(result);
    expect(platformResultSchema.safeParse(contract).success).toBe(true);
    expect(contract.perPlatform["aio"]).toBeDefined();
    expect(contract.ssr["status"]).toBe("ssr_present");
  });

  it("produces a Zod-valid contract for the empty shell with absent probes", async () => {
    const { $, html } = page("page-ssr-shell.html");
    const result = await scorePlatform(
      { $, html, headers: new Headers(), origin: "https://example.com" },
      { fetcher: ALL_ABSENT },
    );
    const contract = toContractResult(result);
    expect(platformResultSchema.safeParse(contract).success).toBe(true);
  });
});
