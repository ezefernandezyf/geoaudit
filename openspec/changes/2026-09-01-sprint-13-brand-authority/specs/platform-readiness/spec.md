# Delta for Platform Readiness

> **Change**: `sprint-13-brand-authority` · **Type**: Delta (MODIFIED)

## Racional

El brand engine desbloquea 4 criterios externos que hoy son `not_measured`: `chatgpt.wikipedia` (15), `chatgpt.wikidata` (10), `chatgpt.entity_consistency` (5) y `perplexity.wikipedia_wikidata` (5) pasan a `measured` y obtienen sus puntos de las señales del brand engine (0 si no hay presencia). El resto de los criterios externos (YouTube, Reddit, Bing, backlinks, LinkedIn, etc.) siguen `not_measured` con la nota actualizada al TODO de v3 — quedan documentados, no medidos.

| # | Change | Summary |
|---|--------|---------|
| RPL-11 | MODIFIED | Split de criterios externos: wikipedia/wikidata/entity_consistency → measured; resto → not_measured con TODO |
| RPL-10 | MODIFIED | Escenario "External criteria labeled" actualizado al split v3 |

## MODIFIED Requirements

### Requirement: External Criteria Labeling (RPL-11)

External-presence criteria MUST be split into two groups: (a) the Wikipedia/Wikidata/entity-consistency criteria (`chatgpt.wikipedia`, `chatgpt.wikidata`, `chatgpt.entity_consistency`, `perplexity.wikipedia_wikidata`) MUST be labeled "measured" and MUST source their points from the brand engine's signals — 0 when there is no external presence, full points when the signal exists; (b) the remaining external criteria (YouTube, Reddit, Bing index/WMT, authoritative backlinks, LinkedIn, GitHub, Knowledge Panel, Business Profile, Google ecosystem, Merchant Center, IndexNow, social signals) MUST stay "not_measured" with the note pointing to the pending TODO.
(Previously: all external criteria were "not_measured" with the note "Requires brand-mention scanner (future sprint)".)

#### Scenario: Migrated criteria measured from brand signals

- GIVEN a platform result with `brandAuthority` present
- WHEN the per-platform criteria are built
- THEN `chatgpt.wikipedia`, `chatgpt.wikidata`, `chatgpt.entity_consistency`, and `perplexity.wikipedia_wikidata` report status "measured" with note null
- AND their points derive from the brand engine signals (0 when brand = 0, full points when the signal is present)

#### Scenario: Remaining external criteria stay not_measured

- GIVEN the same platform output
- WHEN YouTube, Reddit, Bing, and backlink criteria are inspected
- THEN they report status "not_measured"
- AND the note references the pending TODO (YouTube/Reddit/Bing API keys, real backlinks)

### Requirement: Per-Platform Scoring (RPL-10)

The system MUST score each platform's on-page readiness.

#### Scenario: AI Overviews ready

- GIVEN a page with question H2 headings, direct answers after headings, FAQ section, structured data, and SSR content
- WHEN AI Overviews readiness is scored
- THEN the score is ≥ 70
- AND the breakdown lists contributing on-page signals

#### Scenario: External criteria split

- GIVEN any platform scoring output
- WHEN the Perplexity or ChatGPT criteria section is rendered
- THEN the Wikipedia/Wikidata criteria are labeled "measured" (sourced from the brand engine)
- AND the Reddit, YouTube, and backlink criteria remain labeled "not_measured"
- AND their note explains the pending TODO (external API keys, backlinks)
(Previously: Wikipedia, YouTube and Reddit were all "not_measured" with "Requires brand-mention scanner (future sprint)".)

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RPL-10 | AI Overviews ready, External criteria split | Covered |
| RPL-11 | Migrated criteria measured from brand signals, Remaining external criteria stay not_measured | Covered |