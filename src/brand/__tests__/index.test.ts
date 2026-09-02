import { describe, expect, it } from "vitest";
import { emptyBrandResult, scoreBrand, toContractResult } from "@/brand/index";
import type { FetchImpl } from "@/lib/fetch/redirect";
import type { LookupFn } from "@/lib/fetch/ssrf";
import { brandAuthorityResultSchema } from "@/lib/contracts/audit-result";
import wikipediaArticleExists from "@/brand/__fixtures__/wikipedia-article-exists.json";
import wikipediaNoArticle from "@/brand/__fixtures__/wikipedia-no-article.json";
import wikidataSearchSameName from "@/brand/__fixtures__/wikidata-search-same-name.json";
import wikidataEntitiesSameName from "@/brand/__fixtures__/wikidata-entities-same-name.json";
import wikidataRateLimit from "@/brand/__fixtures__/wikidata-rate-limit.json";

/**
 * Brand engine entry point tests (T4, BRA-6/7): scoreBrand chains probes →
 * scoring, toContractResult maps to the shared contract, emptyBrandResult
 * builds the BRA-7 degraded shape. Zero real network.
 */

const PUBLIC_IP: LookupFn = async () => [
  { address: "91.198.174.192", family: 4 },
];

function fixtureFetcher(
  routes: Record<string, unknown>,
  statusByUrl: Record<string, number> = {},
): FetchImpl {
  return async (input) => {
    const url = String(input);
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
}

describe("scoreBrand (T4 chained probes → scoring)", () => {
  it("returns the full engine result with contract-valid mapping", async () => {
    const fetcher = fixtureFetcher({
      "action=query": wikipediaArticleExists,
      "action=wbsearchentities": wikidataSearchSameName,
      "action=wbgetentities": wikidataEntitiesSameName,
    });
    const result = await scoreBrand("relevy.app", {
      fetcher,
      lookup: PUBLIC_IP,
    });

    expect(result.status).toBe("success");
    expect(result.reason).toBeNull();
    expect(result.score).toBeGreaterThanOrEqual(70); // full fixture
    expect(result.signals.entityPresence).toBe(true);
    expect(result.signals.entityConsistency).toBe(true);
    expect(result.entity.wikidataId).toBe("Q333");

    // T4: the contract mapping must survive the shared schema.
    const contract = toContractResult(result);
    const parsed = brandAuthorityResultSchema.safeParse(contract);
    expect(parsed.success).toBe(true);
  });

  it("conserves a measured 0 (no article) as success, not error", async () => {
    const fetcher = fixtureFetcher({
      "action=query": wikipediaNoArticle,
    });
    const result = await scoreBrand("relevy.app", {
      fetcher,
      lookup: PUBLIC_IP,
    });

    expect(result.status).toBe("success");
    expect(result.score).toBe(0);
    expect(result.signals.entityPresence).toBe(false);
    expect(result.entity.wikipediaTitle).toBeNull();
  });

  it("maps a probe failure to an error result with the reason (BRA-7)", async () => {
    const fetcher = fixtureFetcher(
      {
        "action=query": wikipediaArticleExists,
        "action=wbsearchentities": wikidataRateLimit,
      },
      { "action=wbsearchentities": 429 },
    );
    const result = await scoreBrand("relevy.app", {
      fetcher,
      lookup: PUBLIC_IP,
    });

    expect(result.status).toBe("error");
    expect(result.reason).toBe("rate_limit");
    expect(result.score).toBe(0);
    expect(result.signals.entityPresence).toBe(false);
  });

  it("never throws on network failure", async () => {
    const fetcher: FetchImpl = async () => {
      throw new Error("network down");
    };
    const result = await scoreBrand("relevy.app", {
      fetcher,
      lookup: PUBLIC_IP,
    });

    expect(result.status).toBe("error");
    expect(result.reason).toBe("network_error");
  });
});

describe("toContractResult (T4)", () => {
  it("maps every engine field to the shared contract", () => {
    const result = toContractResult({
      status: "success",
      reason: null,
      score: 92,
      signals: {
        entityPresence: true,
        entityConsistency: false,
        wikidataCompleteness: 100,
      },
      entity: {
        wikipediaTitle: "Relevy",
        wikidataId: "Q333",
        wikidataLabel: "Relevy",
      },
    });

    expect(result).toEqual({
      status: "success",
      reason: null,
      score: 92,
      signals: {
        entityPresence: true,
        entityConsistency: false,
        wikidataCompleteness: 100,
      },
      entity: {
        wikipediaTitle: "Relevy",
        wikidataId: "Q333",
        wikidataLabel: "Relevy",
      },
    });
    expect(brandAuthorityResultSchema.safeParse(result).success).toBe(true);
  });
});

describe("emptyBrandResult (T4, BRA-7 degraded shape)", () => {
  it("returns the error contract shape with the given reason", () => {
    const result = emptyBrandResult("wikidata_rate_limit");

    expect(result).toEqual({
      status: "error",
      reason: "wikidata_rate_limit",
      score: 0,
      signals: {
        entityPresence: false,
        entityConsistency: false,
        wikidataCompleteness: 0,
      },
      entity: {
        wikipediaTitle: null,
        wikidataId: null,
        wikidataLabel: null,
      },
    });
    expect(brandAuthorityResultSchema.safeParse(result).success).toBe(true);
  });
});
