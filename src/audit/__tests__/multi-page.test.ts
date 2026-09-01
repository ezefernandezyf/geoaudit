import { beforeEach, describe, expect, it, vi } from "vitest";
import { runMultiPageAudit } from "@/audit/multi-page";
import type { AuditResult } from "@/lib/contracts/audit-result";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import type { FetchImpl } from "@/lib/fetch/redirect";
import type { LookupFn } from "@/lib/fetch/ssrf";
import { severityForScore } from "@/scoring/index";
import { runAudit } from "@/audit";

/**
 * U3 - multi-page engine (MPA-1..MPA-4, D3/D6). Zero network: `runAudit` is
 * mocked (the engine reuses it per URL - its own behavior is covered in
 * run-audit.test.ts) and the sitemap/robots fetches go through an injected
 * mock fetcher + lookup. Assertions cover the cap (MPA-2), bounded
 * concurrency (MPA-3), one runAudit per URL and per-page isolation (MPA-1),
 * sitemap discovery from robots.txt with /sitemap.xml fallback (MPA-4) and
 * the SSRF guard over sitemap URLs (threat matrix).
 */

vi.mock("@/audit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/audit")>();
  return {
    ...actual,
    runAudit: vi.fn(),
  };
});

const runAuditMock = vi.mocked(runAudit);

beforeEach(() => {
  runAuditMock.mockReset();
});

const NOW = 1_750_000_000_000;

const publicLookup: LookupFn = async () => [
  { address: "93.184.216.34", family: 4 },
];

/** example.com resolves public; ANY other hostname resolves private (SSRF). */
const mixedLookup: LookupFn = async (hostname) =>
  hostname === "example.com"
    ? [{ address: "93.184.216.34", family: 4 }]
    : [{ address: "10.0.0.1", family: 4 }];

const SITEMAP_NS = 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';

function sitemapXml(urls: string[]): string {
  const locs = urls.map((u) => `<url><loc>${u}</loc></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset ${SITEMAP_NS}>${locs}</urlset>`;
}

/**
 * Mock fetcher routing for discovery: /robots.txt → text/plain robots body
 * (passes the probe gate), /sitemap.xml and declared sitemaps → XML, and the
 * audited pages → HTML (never reached: runAudit is mocked).
 */
function discoveryFetch(robots: string, sitemap: string): FetchImpl {
  return async (input) => {
    const url = String(input);
    if (url.endsWith("/robots.txt")) {
      return new Response(robots, {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    if (url.endsWith("/sitemap.xml") || url.includes("sitemap")) {
      return new Response(sitemap, {
        status: 200,
        headers: { "content-type": "application/xml; charset=utf-8" },
      });
    }
    return new Response("<html><body>page</body></html>", {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  };
}

/** Deterministic AuditResult per URL/score (summary override of the fixture). */
function auditResultFor(url: string, geoScore: number): AuditResult {
  return {
    ...auditResultFixture,
    summary: {
      url,
      geoScore,
      severityBand: severityForScore(geoScore),
      durationMs: 100,
    },
  };
}

const ROBOTS_NO_SITEMAP = "User-agent: *\nAllow: /\n";
const ROBOTS_WITH_SITEMAP =
  "User-agent: *\nAllow: /\nSitemap: https://example.com/custom-sitemap.xml\n";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("runMultiPageAudit (MPA-2 page cap)", () => {
  it("audits at most 5 of 8 discovered URLs and ignores the rest", async () => {
    const urls = Array.from(
      { length: 8 },
      (_, i) => `https://example.com/page${i + 1}`,
    );
    runAuditMock.mockResolvedValue(auditResultFor(urls[0], 60));

    const result = await runMultiPageAudit("https://example.com/", {
      fetcher: discoveryFetch(ROBOTS_NO_SITEMAP, sitemapXml(urls)),
      lookup: publicLookup,
      now: () => NOW,
    });

    expect(result.pages).toHaveLength(5);
    expect(runAuditMock).toHaveBeenCalledTimes(5);
    const audited = runAuditMock.mock.calls.map(([url]) => url);
    expect(audited).toEqual(urls.slice(0, 5));
    expect(audited).not.toContain(urls[5]);
  });
});

describe("runMultiPageAudit (MPA-3 bounded concurrency)", () => {
  it("never has more than 3 audits in flight with the default concurrency", async () => {
    const urls = Array.from(
      { length: 5 },
      (_, i) => `https://example.com/page${i + 1}`,
    );
    const gates = urls.map(() => deferred<AuditResult>());
    let inFlight = 0;
    let maxInFlight = 0;
    runAuditMock.mockImplementation(async (url: string) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      const result = await gates[urls.indexOf(url)].promise;
      inFlight -= 1;
      return result;
    });

    const pending = runMultiPageAudit("https://example.com/", {
      fetcher: discoveryFetch(ROBOTS_NO_SITEMAP, sitemapXml(urls)),
      lookup: publicLookup,
      now: () => NOW,
    });

    // Let the workers start: only 3 of the 5 urls may begin before any gate
    // resolves - the remaining 2 wait for a worker slot.
    await new Promise((r) => setTimeout(r, 0));
    expect(maxInFlight).toBeLessThanOrEqual(3);
    expect(maxInFlight).toBeGreaterThan(0);

    gates.forEach((gate) => gate.resolve(auditResultFor(urls[0], 50)));
    const result = await pending;
    expect(result.pages).toHaveLength(5);
    expect(maxInFlight).toBeLessThanOrEqual(3);
  });

  it("respects deps.concurrency=2 (triangulation)", async () => {
    const urls = Array.from(
      { length: 4 },
      (_, i) => `https://example.com/page${i + 1}`,
    );
    const gates = urls.map(() => deferred<AuditResult>());
    let inFlight = 0;
    let maxInFlight = 0;
    runAuditMock.mockImplementation(async (url: string) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      const result = await gates[urls.indexOf(url)].promise;
      inFlight -= 1;
      return result;
    });

    const pending = runMultiPageAudit("https://example.com/", {
      fetcher: discoveryFetch(ROBOTS_NO_SITEMAP, sitemapXml(urls)),
      lookup: publicLookup,
      now: () => NOW,
      concurrency: 2,
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(maxInFlight).toBeLessThanOrEqual(2);

    gates.forEach((gate) => gate.resolve(auditResultFor(urls[0], 50)));
    await pending;
    expect(maxInFlight).toBeLessThanOrEqual(2);
  });
});

describe("runMultiPageAudit (MPA-1 reuse + isolation)", () => {
  it("calls runAudit exactly once per discovered URL", async () => {
    const urls = [
      "https://example.com/a",
      "https://example.com/b",
      "https://example.com/c",
    ];
    runAuditMock.mockImplementation(async (url: string) =>
      auditResultFor(url, 60),
    );

    const result = await runMultiPageAudit("https://example.com/", {
      fetcher: discoveryFetch(ROBOTS_NO_SITEMAP, sitemapXml(urls)),
      lookup: publicLookup,
      now: () => NOW,
    });

    expect(runAuditMock).toHaveBeenCalledTimes(3);
    for (const url of urls) {
      expect(runAuditMock).toHaveBeenCalledWith(
        url,
        expect.objectContaining({ lookup: publicLookup }),
      );
    }
    expect(result.pages.map((p) => p.url)).toEqual(urls);
  });

  it("records a failed page with its error while the others still complete", async () => {
    const urls = [
      "https://example.com/a",
      "https://example.com/b",
      "https://example.com/c",
    ];
    runAuditMock.mockImplementation(async (url: string) => {
      if (url.endsWith("/b")) {
        throw new Error(
          "audit page fetch failed for https://example.com/b: TIMEOUT",
        );
      }
      return auditResultFor(url, 60);
    });

    const result = await runMultiPageAudit("https://example.com/", {
      fetcher: discoveryFetch(ROBOTS_NO_SITEMAP, sitemapXml(urls)),
      lookup: publicLookup,
      now: () => NOW,
    });

    expect(result.pages).toHaveLength(3);
    expect(result.pages[0].error).toBeNull();
    expect(result.pages[0].result).not.toBeNull();
    expect(result.pages[1].result).toBeNull();
    expect(result.pages[1].error).toContain("TIMEOUT");
    expect(result.pages[2].error).toBeNull();
    expect(result.pages[2].result).not.toBeNull();
  });

  it("aggregates the mean of successful page scores with its severity band", async () => {
    const urls = [
      "https://example.com/a",
      "https://example.com/b",
      "https://example.com/c",
    ];
    runAuditMock.mockImplementation(async (url: string) =>
      auditResultFor(
        url,
        url.endsWith("/a") ? 60 : url.endsWith("/b") ? 80 : 100,
      ),
    );

    const result = await runMultiPageAudit("https://example.com/", {
      fetcher: discoveryFetch(ROBOTS_NO_SITEMAP, sitemapXml(urls)),
      lookup: publicLookup,
      now: () => NOW,
    });

    expect(result.aggregate.url).toBe("https://example.com/");
    expect(result.aggregate.geoScore).toBe(80); // (60+80+100)/3
    expect(result.aggregate.severityBand).toBe("Good");
    expect(result.aggregate.durationMs).toBe(0); // fixed clock
  });

  it("degrades to 0 / Critical when every page fails (no successful pages)", async () => {
    runAuditMock.mockRejectedValue(
      new Error("audit page fetch failed: DNS_FAILURE"),
    );

    const result = await runMultiPageAudit("https://example.com/", {
      fetcher: discoveryFetch(
        ROBOTS_NO_SITEMAP,
        sitemapXml(["https://example.com/a"]),
      ),
      lookup: publicLookup,
      now: () => NOW,
    });

    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].error).toContain("DNS_FAILURE");
    expect(result.aggregate.geoScore).toBe(0);
    expect(result.aggregate.severityBand).toBe("Critical");
  });
});

describe("runMultiPageAudit sitemap discovery (MPA-4)", () => {
  it("fetches the Sitemap: URL declared in robots.txt", async () => {
    const urls = ["https://example.com/a", "https://example.com/b"];
    runAuditMock.mockImplementation(async (url: string) =>
      auditResultFor(url, 60),
    );
    const fetcher = discoveryFetch(ROBOTS_WITH_SITEMAP, sitemapXml(urls));
    const fetchSpy = vi.fn(fetcher);

    const result = await runMultiPageAudit("https://example.com/", {
      fetcher: fetchSpy,
      lookup: publicLookup,
      now: () => NOW,
    });

    expect(fetchSpy.mock.calls.map(([input]) => String(input))).toContain(
      "https://example.com/custom-sitemap.xml",
    );
    expect(result.pages.map((p) => p.url)).toEqual(urls);
  });

  it("falls back to /sitemap.xml when robots.txt declares no sitemap", async () => {
    const urls = ["https://example.com/a"];
    runAuditMock.mockImplementation(async (url: string) =>
      auditResultFor(url, 60),
    );
    const fetcher = discoveryFetch(ROBOTS_NO_SITEMAP, sitemapXml(urls));
    const fetchSpy = vi.fn(fetcher);

    const result = await runMultiPageAudit("https://example.com/", {
      fetcher: fetchSpy,
      lookup: publicLookup,
      now: () => NOW,
    });

    expect(fetchSpy.mock.calls.map(([input]) => String(input))).toContain(
      "https://example.com/sitemap.xml",
    );
    expect(result.pages.map((p) => p.url)).toEqual(urls);
  });

  it("falls back to /sitemap.xml when robots.txt is missing (404)", async () => {
    const urls = ["https://example.com/a"];
    runAuditMock.mockImplementation(async (url: string) =>
      auditResultFor(url, 60),
    );
    const fetcher: FetchImpl = async (input) => {
      const url = String(input);
      if (url.endsWith("/robots.txt")) {
        return new Response("not found", { status: 404 });
      }
      return new Response(sitemapXml(urls), {
        status: 200,
        headers: { "content-type": "application/xml" },
      });
    };

    const result = await runMultiPageAudit("https://example.com/", {
      fetcher,
      lookup: publicLookup,
      now: () => NOW,
    });

    expect(result.pages.map((p) => p.url)).toEqual(urls);
  });

  it("blocks a private-host sitemap URL with SSRF_BLOCKED and falls back (threat)", async () => {
    const urls = ["https://example.com/a"];
    runAuditMock.mockImplementation(async (url: string) =>
      auditResultFor(url, 60),
    );
    const robots = [
      "User-agent: *",
      "Allow: /",
      "Sitemap: https://sitemap.internal/private-sitemap.xml",
    ].join("\n");
    const fetcher = discoveryFetch(robots, sitemapXml(urls));
    const fetchSpy = vi.fn(fetcher);

    const result = await runMultiPageAudit("https://example.com/", {
      fetcher: fetchSpy,
      lookup: mixedLookup, // example.com public, sitemap.internal private
      now: () => NOW,
    });

    // The private sitemap never reached the fetcher (SSRF guard fired first)
    // and discovery fell back to the same-origin /sitemap.xml.
    const requested = fetchSpy.mock.calls.map(([input]) => String(input));
    expect(requested).not.toContain(
      "https://sitemap.internal/private-sitemap.xml",
    );
    expect(requested).toContain("https://example.com/sitemap.xml");
    expect(result.pages.map((p) => p.url)).toEqual(urls);
  });

  it("returns no pages when no sitemap source is reachable", async () => {
    runAuditMock.mockReset();
    const fetcher: FetchImpl = async () =>
      new Response("not found", { status: 404 });

    const result = await runMultiPageAudit("https://example.com/", {
      fetcher,
      lookup: publicLookup,
      now: () => NOW,
    });

    expect(result.pages).toEqual([]);
    expect(runAuditMock).not.toHaveBeenCalled();
    expect(result.aggregate.geoScore).toBe(0);
    expect(result.aggregate.severityBand).toBe("Critical");
  });
});
