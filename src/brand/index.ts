import type { BrandAuthorityResult } from "@/lib/contracts/audit-result";
import type { FetchImpl } from "@/lib/fetch/redirect";
import type { LookupFn } from "@/lib/fetch/ssrf";
import { probeBrand, type BrandProbeOptions } from "./probes";
import { brandFromDomain, scoreBrandSignals } from "./scoring";
import type { BrandEngineResult } from "./types";

/**
 * Brand authority engine public surface (BRA-1..BRA-8, design D1).
 *
 * `scoreBrand(domain, opts?)` chains the network probes (probes.ts) into the
 * pure scoring formula (scoring.ts) and returns the rich engine result.
 * `toContractResult` maps it to the shared `BrandAuthorityResult` contract
 * (BRA-6); `emptyBrandResult(reason)` builds the degraded error shape (BRA-7).
 *
 * The engine never throws: probe failures (rate limit, timeout, SSRF block,
 * HTTP errors) become `{ status: "error", reason }` results so the audit
 * orchestrator records `brand:` in meta.errors and completes with the 5
 * remaining dimensions (RAO-12).
 */

export interface BrandOptions {
  /** Injectable fetch (BRA-8 test isolation); defaults to global fetch. */
  fetcher?: FetchImpl;
  /** Injectable DNS resolver for the SSRF guard; defaults to node:dns. */
  lookup?: LookupFn;
  /** Per-hop timeout in ms; defaults to the shared probe timeout. */
  timeoutMs?: number;
}

/**
 * Runs the brand engine for an audited domain (BRA-1/2/5/7). `domain` is the
 * URL hostname - the engine never consumes the shared DOM (RAO-3).
 */
export async function scoreBrand(
  domain: string,
  opts?: BrandOptions,
): Promise<BrandEngineResult> {
  const probeOptions: BrandProbeOptions = {
    fetcher: opts?.fetcher,
    lookup: opts?.lookup,
    timeoutMs: opts?.timeoutMs,
  };

  const probe = await probeBrand(domain, probeOptions);
  if (!probe.ok) {
    // BRA-7: degraded result with a stable reason - never a throw.
    return {
      status: "error",
      reason: probe.reason,
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
    };
  }

  return scoreBrandSignals({
    brand: brandFromDomain(domain),
    domain,
    wikipediaTitle: probe.result.wikipediaTitle,
    wikidata: probe.result.wikidata,
  });
}

/**
 * Maps the rich engine result to the shared `BrandAuthorityResult` contract
 * (BRA-6). The engine-local shape already mirrors the contract, so the mapping
 * is a straight pass-through typed against the shared schema.
 */
export function toContractResult(
  result: BrandEngineResult,
): BrandAuthorityResult {
  return {
    status: result.status,
    reason: result.reason,
    score: result.score,
    signals: {
      entityPresence: result.signals.entityPresence,
      entityConsistency: result.signals.entityConsistency,
      wikidataCompleteness: result.signals.wikidataCompleteness,
    },
    entity: {
      wikipediaTitle: result.entity.wikipediaTitle,
      wikidataId: result.entity.wikidataId,
      wikidataLabel: result.entity.wikidataLabel,
    },
  };
}

/**
 * Degraded brand result for failure isolation (BRA-7, design D4): a 0 score
 * with an error status and the failure reason. Consumed by the orchestrator
 * when the engine fails (RAO-12/15) - the audit still completes.
 */
export function emptyBrandResult(reason: string): BrandAuthorityResult {
  return {
    status: "error",
    reason,
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
  };
}
