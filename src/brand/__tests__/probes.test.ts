import { describe, expect, it, vi } from "vitest";
import { probeBrand, type BrandProbeOptions } from "@/brand/probes";
import type { FetchImpl } from "@/lib/fetch/redirect";
import type { LookupFn } from "@/lib/fetch/ssrf";
import wikipediaArticleExists from "@/brand/__fixtures__/wikipedia-article-exists.json";
import wikipediaNoArticle from "@/brand/__fixtures__/wikipedia-no-article.json";
import wikipediaDisambiguation from "@/brand/__fixtures__/wikipedia-disambiguation.json";
import wikidataSearchSameName from "@/brand/__fixtures__/wikidata-search-same-name.json";
import wikidataEntitiesSameName from "@/brand/__fixtures__/wikidata-entities-same-name.json";
import wikidataSearchNoMatch from "@/brand/__fixtures__/wikidata-search-no-match.json";
import wikidataEntitiesNoMatch from "@/brand/__fixtures__/wikidata-entities-no-match.json";
import wikidataRateLimit from "@/brand/__fixtures__/wikidata-rate-limit.json";

/**
 * Brand probes unit tests (BRA-1/2/7/8, T2). Zero real network: a mock fetcher
 * routes Wikipedia/Wikidata URLs to JSON fixtures, and a stub DNS lookup keeps
 * the SSRF guard happy.
 */

const PUBLIC_IP: LookupFn = async () => [
  { address: "91.198.174.192", family: 4 },
];

/** Counts requests and routes them by URL pattern to fixture JSON bodies. */
function fixtureFetcher(
  routes: Record<string, unknown>,
  statusByUrl: Record<string, number> = {},
): { fetcher: FetchImpl; requests: string[] } {
  const requests: string[] = [];
  const fetcher: FetchImpl = async (input) => {
    const url = String(input);
    requests.push(url);
    const route = Object.keys(routes).find((key) => url.includes(key));
    const status = Object.entries(statusByUrl).find(([key]) =>
      url.includes(key),
    )?.[1];
    if (route === undefined) {
      throw new Error(`unexpected request: ${url}`);
    }
    return new Response(JSON.stringify(routes[route]), {
      status: status ?? 200,
      headers: { "content-type": "application/json" },
    });
  };
  return { fetcher, requests };
}

function options(fetcher: FetchImpl): BrandProbeOptions {
  return { fetcher, lookup: PUBLIC_IP };
}

describe("probeBrand (BRA-1 entity presence)", () => {
  it("resolves the Wikipedia article title when the brand has an article", async () => {
    const { fetcher } = fixtureFetcher({
      "action=query": wikipediaArticleExists,
      "action=wbsearchentities": wikidataSearchSameName,
      "action=wbgetentities": wikidataEntitiesSameName,
    });
    const outcome = await probeBrand("relevy.app", options(fetcher));

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.wikipediaTitle).toBe("Relevy");
  });

  it("returns no article (entityPresence false) when nothing matches", async () => {
    const { fetcher, requests } = fixtureFetcher({
      "action=query": wikipediaNoArticle,
    });
    const outcome = await probeBrand("relevy.app", options(fetcher));

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.wikipediaTitle).toBeNull();
    expect(outcome.result.wikidata).toBeNull();
    // BRA-8: no article → the engine stops after the Wikipedia request.
    expect(requests).toHaveLength(1);
  });

  it("keeps a disambiguation title as presence (scoring strips the +20)", async () => {
    const { fetcher } = fixtureFetcher({
      "action=query": wikipediaDisambiguation,
      "action=wbsearchentities": wikidataSearchSameName,
      "action=wbgetentities": wikidataEntitiesSameName,
    });
    const outcome = await probeBrand("relevy.app", options(fetcher));

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.wikipediaTitle).toBe("Relevy (disambiguation)");
  });
});

describe("probeBrand (BRA-2 disambiguation)", () => {
  it("accepts only the candidate matching description/website, rejecting same-name entities", async () => {
    const { fetcher, requests } = fixtureFetcher({
      "action=query": wikipediaArticleExists,
      "action=wbsearchentities": wikidataSearchSameName,
      "action=wbgetentities": wikidataEntitiesSameName,
    });
    const outcome = await probeBrand("relevy.app", options(fetcher));

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.wikipediaTitle).toBe("Relevy");
    // Q111 = human (P31 Q5) rejected; Q222 = same-name org without
    // description/website evidence rejected; Q333 = AI platform accepted.
    expect(outcome.result.wikidata?.id).toBe("Q333");
    expect(outcome.result.wikidata?.instanceOf).toEqual(["Q43229"]);
    expect(outcome.result.wikidata?.website).toBe("https://relevy.app");
    // BRA-8: ≤ 4 requests (Wikipedia + search + entities = 3).
    expect(requests.length).toBeLessThanOrEqual(4);
  });

  it("returns no Wikidata entity when no candidate passes disambiguation", async () => {
    const { fetcher } = fixtureFetcher({
      "action=query": wikipediaArticleExists,
      "action=wbsearchentities": wikidataSearchNoMatch,
      "action=wbgetentities": wikidataEntitiesNoMatch,
    });
    const outcome = await probeBrand("relevy.app", options(fetcher));

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.wikipediaTitle).toBe("Relevy");
    expect(outcome.result.wikidata).toBeNull();
  });
});

describe("probeBrand (BRA-7 failure isolation)", () => {
  it("returns rate_limit on HTTP 429 from Wikidata without throwing", async () => {
    const { fetcher } = fixtureFetcher(
      {
        "action=query": wikipediaArticleExists,
        "action=wbsearchentities": wikidataRateLimit,
      },
      { "action=wbsearchentities": 429 },
    );
    const outcome = await probeBrand("relevy.app", options(fetcher));

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe("rate_limit");
  });

  it("returns timeout when the fetcher aborts without throwing", async () => {
    const fetcher: FetchImpl = async () => {
      throw new DOMException("The operation was aborted", "AbortError");
    };
    const outcome = await probeBrand("relevy.app", {
      fetcher,
      lookup: PUBLIC_IP,
    });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe("timeout");
  });

  it("returns ssrf_blocked when DNS resolves to a private address", async () => {
    const privateLookup: LookupFn = async () => [
      { address: "10.0.0.1", family: 4 },
    ];
    const fetcher: FetchImpl = async () => {
      throw new Error("should never fetch");
    };
    const outcome = await probeBrand("relevy.app", {
      fetcher,
      lookup: privateLookup,
    });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe("ssrf_blocked");
  });

  it("returns http_status on a non-429 non-2xx response", async () => {
    const { fetcher } = fixtureFetcher(
      { "action=query": wikipediaArticleExists },
      { "action=query": 503 },
    );
    const outcome = await probeBrand("relevy.app", options(fetcher));

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe("http_status");
  });
});

describe("probeBrand (BRA-8 request budget)", () => {
  it("issues at most 4 requests across the happy path (3 total)", async () => {
    const { fetcher, requests } = fixtureFetcher({
      "action=query": wikipediaArticleExists,
      "action=wbsearchentities": wikidataSearchSameName,
      "action=wbgetentities": wikidataEntitiesSameName,
    });
    await probeBrand("relevy.app", options(fetcher));

    expect(requests).toHaveLength(3);
    expect(requests.every((url) => url.startsWith("https://"))).toBe(true);
  });

  it("only touches Wikipedia and Wikidata hosts (BRA-8)", async () => {
    const { fetcher, requests } = fixtureFetcher({
      "action=query": wikipediaArticleExists,
      "action=wbsearchentities": wikidataSearchSameName,
      "action=wbgetentities": wikidataEntitiesSameName,
    });
    await probeBrand("relevy.app", options(fetcher));

    for (const url of requests) {
      expect(
        url.startsWith("https://en.wikipedia.org/") ||
          url.startsWith("https://www.wikidata.org/"),
      ).toBe(true);
    }
  });

  it("forwards the injectable fetcher (never the global fetch)", async () => {
    const fetcher = vi.fn<FetchImpl>(async () => {
      throw new Error("stub");
    });
    await probeBrand("relevy.app", { fetcher, lookup: PUBLIC_IP });
    expect(fetcher).toHaveBeenCalled();
  });
});
