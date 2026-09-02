import { PROBE_TIMEOUT_MS } from "@/lib/fetch";
import {
  followRedirects,
  RedirectChainError,
  type FetchImpl,
  type HopValidator,
} from "@/lib/fetch/redirect";
import { assertPublicHost, SsrfError, type LookupFn } from "@/lib/fetch/ssrf";
import { acceptsCandidate, brandFromDomain } from "./scoring";
import type { WikidataCandidate } from "./types";

/**
 * Brand network probes (BRA-1/2/7/8, design D1). Wikipedia action API search +
 * Wikidata `wbsearchentities` + `wbgetentities` (claims P31/P856 in the same
 * call, ≤ 4 requests per audit, Wikipedia/Wikidata hosts only).
 *
 * The engine needs its own JSON fetch: `fetchAuditResource` gates content-type
 * to HTML (RFL-8). This module reuses the fetch-layer primitives
 * `assertPublicHost` (SSRF) + `followRedirects` (redirect loop + per-hop
 * timeout) with injectable `fetcher`/`lookup`, then parses the JSON body.
 *
 * Failure isolation (BRA-7): every network/parse failure yields a typed error
 * outcome with a machine-readable reason - never a throw.
 */

export interface BrandProbeOptions {
  /** Injectable fetch (BRA-8 test isolation); defaults to global fetch. */
  fetcher?: FetchImpl;
  /** Injectable DNS resolver for the SSRF guard; defaults to node:dns. */
  lookup?: LookupFn;
  /** Per-hop timeout in ms; defaults to the shared probe timeout. */
  timeoutMs?: number;
}

export interface BrandProbeResult {
  /** Resolved Wikipedia article title, or null when no article matched. */
  wikipediaTitle: string | null;
  /** Accepted Wikidata candidate (BRA-2), or null when none passed. */
  wikidata: WikidataCandidate | null;
}

export type BrandProbeOutcome =
  { ok: true; result: BrandProbeResult } | { ok: false; reason: string };

/** Stable failure reasons (BRA-7); surfaced via emptyBrandResult(reason). */
export type BrandProbeReason =
  | "rate_limit"
  | "timeout"
  | "ssrf_blocked"
  | "http_status"
  | "invalid_json"
  | "network_error";

class ProbeError extends Error {
  constructor(
    readonly reason: BrandProbeReason,
    message: string,
  ) {
    super(message);
    this.name = "ProbeError";
  }
}

/** Maps any thrown value to a stable BrandProbeReason (BRA-7, never throws). */
function toReason(error: unknown): BrandProbeReason {
  if (error instanceof ProbeError) return error.reason;
  if (error instanceof SsrfError) return "ssrf_blocked";
  if (error instanceof RedirectChainError) {
    return error.code === "SSRF_BLOCKED" ? "ssrf_blocked" : "network_error";
  }
  if (error instanceof Error) {
    const name = (error as { name?: string }).name;
    if (name === "TimeoutError" || name === "AbortError") {
      return "timeout";
    }
  }
  // jsdom DOMException is not `instanceof Error` - check the name structurally.
  if (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: string }).name === "AbortError"
  ) {
    return "timeout";
  }
  return "network_error";
}

/** Follows redirects with the SSRF guard and reads a JSON body (BRA-8 hosts). */
async function fetchJson(url: URL, opts: BrandProbeOptions): Promise<unknown> {
  const fetcher = opts.fetcher ?? fetch;
  const timeoutMs = opts.timeoutMs ?? PROBE_TIMEOUT_MS;
  const validateHop: HopValidator = (hop) =>
    assertPublicHost(hop.hostname, opts.lookup);

  const response = await followRedirects(url, {
    fetcher,
    validateHop,
    timeoutMs,
  });

  if (response.status === 429) {
    throw new ProbeError("rate_limit", `HTTP 429 for ${url.hostname}`);
  }
  if (!response.ok) {
    throw new ProbeError(
      "http_status",
      `HTTP ${response.status} for ${url.hostname}`,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new ProbeError("invalid_json", `invalid JSON from ${url.hostname}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** Wikipedia action API search (BRA-1): first title matching the brand. */
async function searchWikipedia(
  brand: string,
  opts: BrandProbeOptions,
): Promise<string | null> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", brand);
  url.searchParams.set("srlimit", "5");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");

  const data = await fetchJson(url, opts);
  const query = isRecord(data) ? data["query"] : null;
  const results = isRecord(query) ? query["search"] : null;
  if (!Array.isArray(results)) return null;

  for (const item of results) {
    const title = isRecord(item) ? asString(item["title"]) : null;
    // BRA-1: match the article for the brand. Disambiguation pages count as
    // presence too (scoring strips the +20 via isDisambiguationTitle).
    if (
      title !== null &&
      (title.toLowerCase() === brand ||
        title.toLowerCase() === `${brand} (disambiguation)`)
    ) {
      return title;
    }
  }
  return null;
}

interface WikidataSearchHit {
  id: string;
  label: string | null;
  description: string | null;
}

/** Wikidata `wbsearchentities` (BRA-2): raw candidates for the brand. */
async function searchWikidata(
  brand: string,
  opts: BrandProbeOptions,
): Promise<WikidataSearchHit[]> {
  const url = new URL("https://www.wikidata.org/w/api.php");
  url.searchParams.set("action", "wbsearchentities");
  url.searchParams.set("search", brand);
  url.searchParams.set("language", "en");
  url.searchParams.set("limit", "5");
  url.searchParams.set("format", "json");

  const data = await fetchJson(url, opts);
  const hits = isRecord(data) ? data["search"] : null;
  if (!Array.isArray(hits)) return [];

  return hits.flatMap((hit) => {
    if (!isRecord(hit)) return [];
    const id = asString(hit["id"]);
    if (id === null) return [];
    return [
      {
        id,
        label: asString(hit["label"]),
        description: asString(hit["description"]),
      },
    ];
  });
}

interface WikidataClaims {
  instanceOf: string[];
  website: string | null;
  claimCount: number;
}

/**
 * Wikidata `wbgetentities` (BRA-2/BRA-4, design D3): P31 instance-of Q-numbers
 * and P856 official website resolved in the same call (≤ 4 req/audit, BRA-8).
 */
async function fetchEntities(
  ids: string[],
  opts: BrandProbeOptions,
): Promise<Map<string, WikidataClaims>> {
  const url = new URL("https://www.wikidata.org/w/api.php");
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("ids", ids.join("|"));
  url.searchParams.set("props", "claims");
  url.searchParams.set("format", "json");

  const data = await fetchJson(url, opts);
  const entities = isRecord(data) ? data["entities"] : null;
  const result = new Map<string, WikidataClaims>();
  if (!isRecord(entities)) return result;

  for (const [qid, raw] of Object.entries(entities)) {
    if (!isRecord(raw)) continue;
    const claims = isRecord(raw["claims"]) ? raw["claims"] : {};
    const instanceOf: string[] = [];
    let website: string | null = null;
    let claimCount = 0;

    for (const [prop, statements] of Object.entries(claims)) {
      if (!Array.isArray(statements)) continue;
      claimCount += statements.length;
      if (prop === "P31") {
        for (const statement of statements) {
          const value = datavalueOf(statement);
          const qid = isRecord(value) ? asString(value["id"]) : null;
          if (qid !== null) instanceOf.push(qid);
        }
      } else if (prop === "P856" && website === null) {
        for (const statement of statements) {
          const value = datavalueOf(statement);
          const url = asString(value);
          if (url !== null) {
            website = url;
            break;
          }
        }
      }
    }

    result.set(qid, { instanceOf, website, claimCount });
  }
  return result;
}

/** Extracts `claim.mainsnak.datavalue.value` from a Wikidata statement. */
function datavalueOf(statement: unknown): unknown {
  if (!isRecord(statement)) return null;
  const mainsnak = isRecord(statement["mainsnak"])
    ? statement["mainsnak"]
    : null;
  if (mainsnak === null) return null;
  const datavalue = isRecord(mainsnak["datavalue"])
    ? mainsnak["datavalue"]
    : null;
  return datavalue === null ? null : datavalue["value"];
}

/**
 * Runs the brand probes for an audited domain (BRA-1/2/7/8). At most 3
 * requests in the happy path (Wikipedia search + wbsearchentities +
 * wbgetentities) - always ≤ 4. Never throws: failures return a typed reason.
 */
export async function probeBrand(
  domain: string,
  opts: BrandProbeOptions = {},
): Promise<BrandProbeOutcome> {
  try {
    const brand = brandFromDomain(domain);
    const wikipediaTitle = await searchWikipedia(brand, opts);

    // BRA-5 gate: no Wikipedia article → no entity presence, no Wikidata needed.
    if (wikipediaTitle === null) {
      return { ok: true, result: { wikipediaTitle: null, wikidata: null } };
    }

    const candidates = await searchWikidata(brand, opts);
    let wikidata: WikidataCandidate | null = null;
    if (candidates.length > 0) {
      const claimsByQid = await fetchEntities(
        candidates.map((candidate) => candidate.id),
        opts,
      );
      for (const candidate of candidates) {
        const claims = claimsByQid.get(candidate.id);
        const enriched: WikidataCandidate = {
          id: candidate.id,
          label: candidate.label,
          description: candidate.description,
          website: claims?.website ?? null,
          instanceOf: claims?.instanceOf ?? [],
          claimCount: claims?.claimCount ?? 0,
        };
        // BRA-2: accept only on description/website evidence + P31 gate.
        if (acceptsCandidate(enriched, brand, domain)) {
          wikidata = enriched;
          break;
        }
      }
    }

    return { ok: true, result: { wikipediaTitle, wikidata } };
  } catch (error) {
    return { ok: false, reason: toReason(error) };
  }
}
