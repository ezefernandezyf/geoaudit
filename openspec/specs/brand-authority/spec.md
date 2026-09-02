# Brand Authority Specification

> **Change**: `sprint-13-brand-authority` · **Type**: New capability (ADDED)

## Purpose

Sixth GEO engine (MVP: Wikipedia + Wikidata). Measures external brand presence — the entity sources AI assistants cite — via the free Wikipedia action API and Wikidata `wbsearchentities` (keyless, deterministic, ~2-4 requests per audit). Runs on every audit (anonymous included), produces a 0-100 score where 0 means no external presence (a real penalty on the GEO Score, product decision), and feeds the migrated platform-readiness criteria. Isolated per RAO-12: a Wikipedia/Wikidata failure never breaks the audit.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| BRA-1 | Entity presence (Wikipedia) | MUST | Derive the brand from the audited URL's registrable domain (eTLD+1) and query the Wikipedia action API for a matching article |
| BRA-2 | Entity disambiguation | MUST | Accept `wbsearchentities` candidates only on label/description or official-website match — no false positives from same-name entities |
| BRA-3 | Entity consistency | MUST | Compare the Wikipedia title / Wikidata label against the audited brand and report match or mismatch |
| BRA-4 | Wikidata completeness | MUST | Report properties present on the matched entity (description, official website, claims) |
| BRA-5 | Composite score | MUST | Compute a 0-100 score from the three signals; MUST be 0 when entity presence is false |
| BRA-6 | Contract shape | MUST | `brandAuthorityResultSchema` + `brandAuthority` field in `auditResultSchema` (status, signals, score, entity ids) |
| BRA-7 | Failure isolation | MUST | Timeout/rate-limit/block MUST produce an error result, never a throw |
| BRA-8 | Cost and determinism | MUST | Wikipedia/Wikidata endpoints only, ≤ 4 requests per audit; same input → same score |

### Requirement: Entity Presence (BRA-1)

The engine MUST derive the brand name from the audited URL's registrable domain (eTLD+1 — the last two labels for common TLDs, e.g. `docs.anthropic.com` → `anthropic.com` → "Anthropic"), not from the first subdomain label, and MUST query the Wikipedia action API to determine whether a matching article exists.
(Previously: brand = first hostname label after stripping scheme/www/port — `docs.anthropic.com` → "docs".)

#### Scenario: Article exists

- GIVEN an audited domain "relevy.app" whose brand has a Wikipedia article
- WHEN the brand engine queries Wikipedia
- THEN `entityPresence` is true
- AND the article title is returned as the entity identifier

#### Scenario: No article

- GIVEN an audited domain with no Wikipedia article
- WHEN the brand engine queries Wikipedia
- THEN `entityPresence` is false
- AND the composite score is 0 (BRA-5)

#### Scenario: Subdomain resolves to the registrable brand

- GIVEN an audited URL "https://docs.anthropic.com/en/docs/welcome"
- WHEN the brand is derived from the domain
- THEN the brand is "Anthropic" (never "docs")
- AND Wikipedia is queried for "Anthropic"

#### Scenario: www subdomain resolves to the registrable brand

- GIVEN an audited URL "https://www.moz.com/blog"
- WHEN the brand is derived from the domain
- THEN the brand is "Moz" (single subdomain stripped, registrable label capitalized)

### Requirement: Entity Disambiguation (BRA-2)

The engine MUST use `wbsearchentities` for the brand name and MUST accept a candidate only when its label/description matches the brand or its official website matches the audited domain. A name-only match is insufficient.

#### Scenario: Same-name entities rejected

- GIVEN `wbsearchentities` returns 3 candidates for the brand name — one person, one unrelated organization with the same name, and one whose official website matches the audited domain
- WHEN candidates are evaluated
- THEN only the candidate matching the description or the audited domain is accepted
- AND no false positive is recorded

#### Scenario: No candidate matches

- GIVEN candidates with no description/website match for the audited domain
- WHEN candidates are evaluated
- THEN no entity is accepted
- AND `entityPresence` is false

### Requirement: Entity Consistency (BRA-3)

The engine MUST compare the accepted Wikipedia title and Wikidata label against the audited brand and report whether they agree.

#### Scenario: Consistent entity

- GIVEN a Wikipedia title and Wikidata label that match the audited brand
- WHEN consistency is evaluated
- THEN `entityConsistency` is true

#### Scenario: Mismatched label

- GIVEN a Wikidata label that differs from the audited brand (e.g. "Acme Ltd" vs brand "Acme")
- WHEN consistency is evaluated
- THEN `entityConsistency` is false
- AND the composite score is reduced accordingly

### Requirement: Wikidata Completeness (BRA-4)

The engine MUST report how complete the matched entity is (description, official website, claim count) as `wikidataCompleteness`.

#### Scenario: Rich entity

- GIVEN a matched entity with description, official website matching the audited domain, and multiple claims
- WHEN completeness is evaluated
- THEN `wikidataCompleteness` is high (≥ the threshold defined in design)

#### Scenario: Bare entity

- GIVEN a matched entity with only a label and no properties
- WHEN completeness is evaluated
- THEN `wikidataCompleteness` is low

### Requirement: Composite Score (BRA-5)

The engine MUST produce a deterministic 0-100 composite from the three signals, with the exact weighting defined in design from the geo-brand-mentions skill. When `entityPresence` is false the composite MUST be 0.

#### Scenario: Full external presence

- GIVEN `entityPresence` true, `entityConsistency` true, and high `wikidataCompleteness`
- WHEN the composite is computed
- THEN the score is high (≥ 70 with the design weighting)

#### Scenario: No external presence → 0

- GIVEN `entityPresence` false
- WHEN the composite is computed
- THEN the score is 0
- AND the GEO Score is penalized by the 20% weight (RGS-11)

### Requirement: Failure Isolation (BRA-7)

A Wikipedia/Wikidata timeout, rate limit, or block MUST yield an error result with a reason — the engine MUST NOT throw.

#### Scenario: Wikidata rate-limited

- GIVEN the Wikidata API returns HTTP 429 while Wikipedia succeeds
- WHEN the engine runs
- THEN the result status is "error" with the rate-limit reason
- AND no throw occurs
- AND the orchestrator records `brand:` in `meta.errors` and completes the audit with the 5 remaining dimensions (RAO-12)

### Requirement: Cost and Determinism (BRA-8)

The engine MUST use only the keyless Wikipedia and Wikidata endpoints and MUST issue at most 4 requests per audit.

#### Scenario: Keyless and bounded

- GIVEN any audit
- WHEN the brand engine runs
- THEN it issues ≤ 4 requests to Wikipedia/Wikidata only (no other hosts)
- AND identical inputs produce identical scores

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| BRA-1 | Article exists, No article, Subdomain resolves to the registrable brand, www subdomain resolves to the registrable brand | Covered |
| BRA-2 | Same-name entities rejected, No candidate matches | Covered |
| BRA-3 | Consistent entity, Mismatched label | Covered |
| BRA-4 | Rich entity, Bare entity | Covered |
| BRA-5 | Full external presence, No external presence → 0 | Covered |
| BRA-6 | (tested via RAO-10 complete AuditResult shape) | Implicit |
| BRA-7 | Wikidata rate-limited | Covered |
| BRA-8 | Keyless and bounded | Covered |