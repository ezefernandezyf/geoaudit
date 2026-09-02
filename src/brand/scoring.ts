/**
 * Pure brand authority scoring (BRA-2/3/4/5/8, design D2/D3).
 *
 * No I/O: every function is deterministic and side-effect free, so the formula
 * is unit-testable without network. The probes (probes.ts) resolve the raw
 * signals; this module turns them into the composite 0-100 score.
 *
 * Formula (design D2, traces geo-brand-mentions Wikipedia 20% rubric):
 *   if (!entityPresence) return 0                 // BRA-5 hard gate
 *   score = presence(60) + completeness(25) + consistency(15)
 *   presence     = 40 base (article exists) + 20 if title is not "(disambiguation)"
 *   completeness = 10 entity found + 5 description + 5 official-website(P856)
 *                  matches domain + 5 if claimCount >= 10
 *   consistency  = 15 if Wikipedia title AND Wikidata label normalize-match brand;
 *                  7 if one matches; else 0
 *
 * Disambiguation (design D3, BRA-2): a candidate is accepted only on
 * description/website evidence plus the P31 entity-type gate - a name-only
 * (label) match is explicitly insufficient.
 */

import type {
  BrandEngineResult,
  BrandScoringInput,
  WikidataCandidate,
} from "./types";

/** Accepted P31 instance-of Q-numbers: organization/business/company/enterprise (design D3). */
export const ACCEPTED_INSTANCE_OF = new Set([
  "Q43229", // organization
  "Q4830453", // business
  "Q783794", // company
  "Q6881511", // enterprise
]);

/** Rejected P31 instance-of Q-numbers (design D3): human + fictional character. */
export const REJECTED_INSTANCE_OF = new Set([
  "Q5", // human
  "Q95074", // fictional character
]);

/** Completeness claim-count threshold (design D2): +5 when claimCount >= 10. */
export const CLAIM_COUNT_THRESHOLD = 10;

/** Legal suffixes stripped during normalization (design D2). */
const LEGAL_SUFFIXES = new Set([
  "ltd",
  "llc",
  "inc",
  "srl",
  "sl",
  "sa",
  "corp",
]);

/**
 * Normalizes a brand name for comparison (design D2): lowercase, strip legal
 * suffixes (ltd/llc/inc/srl/sl/sa/corp), strip punctuation, collapse spaces.
 * ASCII-safe (ES2017 target - no \p{L} property escapes).
 */
export function normalizeBrand(name: string): string {
  return name
    .toLowerCase()
    .replace(/\./g, "") // dots first: "S.A." -> "sa" so legal suffixes strip cleanly
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0 && !LEGAL_SUFFIXES.has(word))
    .join(" ");
}

/**
 * Two-part public suffixes that must be treated as the registrable TLD
 * (BRA-1, design D3): the eTLD+1 heuristic takes the last 2 labels for common
 * TLDs, or the last 3 when the last 2 form a two-part suffix like `.co.uk`.
 * Hand-maintained short list (no psl dependency - zero-dep repo); compound
 * TLDs not listed here fall back to the 2-label rule (documented limitation).
 */
const MULTI_PART_TLDS = new Set([
  "co.uk",
  "com.au",
  "co.nz",
  "co.jp",
  "com.br",
  "com.ar",
  "com.mx",
  "co.za",
  "com.sg",
  "com.cn",
  "co.in",
  "com.tr",
  "co.kr",
  "com.co",
]);

/** Capitalizes the first letter of the registrable brand label (BRA-1). */
function capitalizeBrand(label: string): string {
  return label.length > 0 ? label[0].toUpperCase() + label.slice(1) : label;
}

/**
 * Derives the brand name from the audited hostname via the registrable domain
 * (BRA-1, design D3): `docs.anthropic.com` → `anthropic.com` → "Anthropic",
 * never the first subdomain label ("docs"). `www.` is stripped first; two-part
 * TLDs (`.co.uk`, `.com.ar`, ...) take the last 3 labels instead of 2.
 * normalizeBrand lowercases for the Wikipedia/Wikidata match, so the
 * capitalization here never affects entity matching.
 */
export function brandFromDomain(domain: string): string {
  const host = domain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0]
    .replace(/^www\./, "");
  const labels = host.split(".").filter(Boolean);
  if (labels.length === 0) return capitalizeBrand(host);
  const suffix = labels.slice(-2).join(".");
  const brandLabel =
    labels.length >= 3 && MULTI_PART_TLDS.has(suffix)
      ? labels[labels.length - 3]
      : (labels[labels.length - 2] ?? labels[0]);
  return capitalizeBrand(brandLabel);
}

/** Detects Wikipedia disambiguation titles (design D2: no +20 presence). */
export function isDisambiguationTitle(title: string): boolean {
  return /\(disambiguation\)/i.test(title);
}

/**
 * Whether the official website (P856) host matches the audited domain.
 * `www.` prefixes are ignored on both sides.
 */
export function websiteMatchesDomain(
  website: string | null,
  domain: string,
): boolean {
  if (!website) return false;
  try {
    const host = new URL(website).hostname.toLowerCase().replace(/^www\./, "");
    return host === domain.toLowerCase().replace(/^www\./, "");
  } catch {
    return false;
  }
}

/** Label matches the brand after normalization (one side of consistency, BRA-3). */
function labelMatchesBrand(label: string | null, brand: string): boolean {
  return label !== null && normalizeBrand(label) === normalizeBrand(brand);
}

/** Description mentions the brand after normalization (BRA-2 description evidence). */
function descriptionMentionsBrand(
  description: string | null,
  brand: string,
): boolean {
  if (!description) return false;
  const normalized = normalizeBrand(description);
  const target = normalizeBrand(brand);
  return target.length > 0 && normalized.includes(target);
}

/**
 * BRA-2 disambiguation gate (design D3). A candidate is accepted only when it
 * carries description or official-website evidence AND passes the P31
 * entity-type filter - a name-only (label) match is insufficient:
 *  - P31 in REJECTED_INSTANCE_OF (Q5 human, Q95074 fictional) → reject.
 *  - P31 in ACCEPTED_INSTANCE_OF → accept on description/website evidence.
 *  - P31 absent (bare entity) → accept ONLY on official-website domain match
 *    (the strongest disambiguation signal).
 *  - P31 present but outside both sets → reject (unknown type, no entity evidence).
 */
export function acceptsCandidate(
  candidate: WikidataCandidate,
  brand: string,
  domain: string,
): boolean {
  const descriptionMatch = descriptionMentionsBrand(
    candidate.description,
    brand,
  );
  const websiteMatch = websiteMatchesDomain(candidate.website, domain);
  if (!descriptionMatch && !websiteMatch) return false;

  const hasRejectedType = candidate.instanceOf.some((qid) =>
    REJECTED_INSTANCE_OF.has(qid),
  );
  if (hasRejectedType) return false;

  if (candidate.instanceOf.length === 0) {
    // Bare entity: P856 official-website domain match is the only accepted evidence.
    return websiteMatch;
  }

  const hasAcceptedType = candidate.instanceOf.some((qid) =>
    ACCEPTED_INSTANCE_OF.has(qid),
  );
  return hasAcceptedType;
}

/**
 * BRA-5 composite formula (design D2). Pure and deterministic: same input →
 * same score (BRA-8). Returns the rich engine result; index.ts maps it to the
 * contract via toContractResult.
 */
export function scoreBrandSignals(input: BrandScoringInput): BrandEngineResult {
  const { brand, domain, wikipediaTitle, wikidata } = input;
  const entityPresence = wikipediaTitle !== null;

  if (!entityPresence) {
    // BRA-5: no external presence → 0 (a real, measured 0 - not an error).
    return {
      status: "success",
      reason: null,
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

  const title = wikipediaTitle as string;
  const titleMatch = normalizeBrand(title) === normalizeBrand(brand);
  const labelMatch =
    wikidata !== null && labelMatchesBrand(wikidata.label, brand);
  const entityConsistency = titleMatch && labelMatch;

  // presence (max 60): 40 base + 20 when the title is not a disambiguation page.
  const presence = 40 + (isDisambiguationTitle(title) ? 0 : 20);

  // completeness (max 25): entity + description + P856 domain match + claims.
  let completeness = 0;
  if (wikidata !== null) {
    completeness += 10; // entity found
    if (wikidata.description !== null) completeness += 5;
    if (websiteMatchesDomain(wikidata.website, domain)) completeness += 5;
    if (wikidata.claimCount >= CLAIM_COUNT_THRESHOLD) completeness += 5;
  }

  // consistency (max 15): both match / one matches / none.
  const consistency =
    titleMatch && labelMatch ? 15 : titleMatch || labelMatch ? 7 : 0;

  const score = presence + completeness + consistency;

  return {
    status: "success",
    reason: null,
    score,
    signals: {
      entityPresence: true,
      entityConsistency,
      // BRA-4: completeness scaled to 0-100 (25 points max → ×4).
      wikidataCompleteness: Math.round((completeness / 25) * 100),
    },
    entity: {
      wikipediaTitle: title,
      wikidataId: wikidata?.id ?? null,
      wikidataLabel: wikidata?.label ?? null,
    },
  };
}
