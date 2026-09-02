import { describe, beforeEach, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { runAudit } from "@/audit/index";
import type { FetchImpl } from "@/lib/fetch/redirect";
import type { LookupFn } from "@/lib/fetch/ssrf";

/**
 * T25 part A - RAO-3 shared parsed DOM. The orchestrator must parse the page
 * HTML exactly once (the fetch layer already loads it and returns `parsed.$`)
 * and pass the SAME Cheerio instance to every content engine. The four engine
 * entry points are wrapped in delegating spies (they still run the real
 * engines) so the test can assert reference identity across engine boundaries.
 */

const { citabilitySpy, eeatSpy, schemaSpy, platformSpy, brandSpy } = vi.hoisted(
  () => ({
    citabilitySpy: vi.fn(),
    eeatSpy: vi.fn(),
    schemaSpy: vi.fn(),
    platformSpy: vi.fn(),
    brandSpy: vi.fn(),
  }),
);

vi.mock("@/citability", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/citability")>();
  return {
    ...actual,
    scorePage: citabilitySpy.mockImplementation(actual.scorePage),
  };
});

vi.mock("@/eeat", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/eeat")>();
  return { ...actual, scoreEeat: eeatSpy.mockImplementation(actual.scoreEeat) };
});

vi.mock("@/schema", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/schema")>();
  return {
    ...actual,
    scoreSchema: schemaSpy.mockImplementation(actual.scoreSchema),
  };
});

vi.mock("@/platform", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/platform")>();
  return {
    ...actual,
    scorePlatform: platformSpy.mockImplementation(actual.scorePlatform),
  };
});

vi.mock("@/brand", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/brand")>();
  return {
    ...actual,
    scoreBrand: brandSpy.mockImplementation(actual.scoreBrand),
  };
});

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
    return new Response(PAGE_HTML, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  };
}

describe("runAudit (RAO-3 shared parsed DOM)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the SAME Cheerio instance to citability, E-E-A-T, schema and platform", async () => {
    await runAudit("https://example.com/", {
      fetcher: mockAuditFetch(),
      lookup: PUBLIC_LOOKUP,
    });

    expect(citabilitySpy).toHaveBeenCalledTimes(1);
    expect(eeatSpy).toHaveBeenCalledTimes(1);
    expect(schemaSpy).toHaveBeenCalledTimes(1);
    expect(platformSpy).toHaveBeenCalledTimes(1);

    const citability$ = citabilitySpy.mock.calls[0][0];
    const eeat$ = eeatSpy.mock.calls[0][0];
    const schema$ = schemaSpy.mock.calls[0][0];
    // scorePlatform receives the input object; the shared DOM is its `$` field.
    const platform$ = platformSpy.mock.calls[0][0].$;

    expect(citability$).toBe(eeat$);
    expect(eeat$).toBe(schema$);
    expect(schema$).toBe(platform$);
  });

  it("RAO-3/RAO-15: invokes the brand engine with the hostname, never the shared DOM", async () => {
    await runAudit("https://example.com/", {
      fetcher: mockAuditFetch(),
      lookup: PUBLIC_LOOKUP,
    });

    expect(brandSpy).toHaveBeenCalledTimes(1);
    expect(brandSpy.mock.calls[0][0]).toBe("example.com");
  });
});
