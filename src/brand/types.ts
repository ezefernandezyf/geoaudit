/**
 * Engine-local brand authority I/O types (design: engine-local types keep
 * engines self-contained and avoid contract-bloat). Cross-engine shapes live in
 * `src/lib/contracts/` - this engine maps to `BrandAuthorityResult` there via
 * `toContractResult` (see index.ts).
 *
 * Pipeline: probe (BRA-1/2 - Wikipedia + Wikidata, probes.ts) -> score
 * (BRA-3/4/5 - pure formula, scoring.ts) -> contract mapping (index.ts).
 */

/** The three composite signals (BRA-3/4/5). */
export interface BrandSignals {
  /** A matching Wikipedia article was resolved for the audited brand (BRA-1). */
  entityPresence: boolean;
  /** Wikipedia title AND Wikidata label both normalize-match the brand (BRA-3). */
  entityConsistency: boolean;
  /** Wikidata completeness 0-100: entity + description + P856 + claims (BRA-4). */
  wikidataCompleteness: number;
}

/** The resolved entity identifiers (BRA-1/2). */
export interface BrandEntity {
  /** Wikipedia article title, or null when no article was resolved. */
  wikipediaTitle: string | null;
  /** Accepted Wikidata Q-number, or null. */
  wikidataId: string | null;
  /** Label of the accepted Wikidata entity, or null. */
  wikidataLabel: string | null;
}

/** Rich engine-local result, mapped to the shared BrandAuthorityResult contract. */
export interface BrandEngineResult {
  /** "error" on probe failure (BRA-7); "success" otherwise (0 is measured). */
  status: "success" | "error";
  /** Failure reason (rate_limit/timeout/...), null on success. */
  reason: string | null;
  /** Composite 0-100 (BRA-5); 0 when entityPresence is false. */
  score: number;
  signals: BrandSignals;
  entity: BrandEntity;
}

/** A Wikidata entity candidate resolved by the probes (BRA-2). */
export interface WikidataCandidate {
  id: string;
  label: string | null;
  description: string | null;
  /** Official website (P856) - the strong disambiguation signal. */
  website: string | null;
  /** P31 instance-of Q-numbers (entity-type filter, design D3). */
  instanceOf: string[];
  /** Total claim count on the entity (completeness signal, BRA-4). */
  claimCount: number;
}

/** Pure scoring input (built by index.ts from probe output). */
export interface BrandScoringInput {
  /** Brand name derived from the audited domain (BRA-1). */
  brand: string;
  /** Audited hostname (P856 domain match target). */
  domain: string;
  /** Resolved Wikipedia article title; null = no article. */
  wikipediaTitle: string | null;
  /** Accepted Wikidata candidate; null = none passed disambiguation. */
  wikidata: WikidataCandidate | null;
}
