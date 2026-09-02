# Delta for Brand Authority

> **Change**: `2026-09-01-sprint-14-geo-calibration` · **Type**: Delta (MODIFIED)

## Racional

`brandFromDomain` tomaba el primer label del hostname tras strip de www: `docs.anthropic.com` → "docs", un brand falso. v3.1 resuelve la marca desde el dominio registrable (eTLD+1: últimos dos labels para TLDs comunes), con la primera letra capitalizada: `docs.anthropic.com` → `anthropic.com` → "Anthropic".

| # | Change | Summary |
|---|--------|---------|
| BRA-1 | MODIFIED | Brand derivado del eTLD+1 (no del primer subdomain label) |

## MODIFIED Requirements

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

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| BRA-1 | Article exists, No article, Subdomain resolves to the registrable brand, www subdomain resolves to the registrable brand | Covered |