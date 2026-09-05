# Delta for Landing Page

> **Change**: `sprint-19-schema-up` · **Type**: Delta (MODIFIED + ADDED)

## Racional

Sprint 19 sube el schema score de la landing de 62 → 93 con datos 100% reales (LND-7, nunca inventar): `ORG_SAME_AS` pasa de 3 a 5 links (2 nuevos perfiles reales verificados) → sameAs 15/15 (item LND-19.1 del contrato; modelado como MODIFIED LND-9 porque altera comportamiento existente); se agrega un bloque JSON-LD `Article` con datos reales de `copy.ts` (headline del Case Study, fechas 2026-08-20/28, author FOUNDER, publisher Organization Relevy) → resuelve `article_author` 0→10 y estabiliza `business_type_schema` a publisher 10/10; el Article lleva `speakable` con `cssSelector: ["#case-study"]` y el contenedor del Case Study gana `id="case-study"` en el HTML servido (test de presencia, honestidad) → `speakable` 0→5. El premio (`award`) NO se inventa: queda documentado como `missing_recommended` honesto (13/15).

| # | Change | Summary |
|---|--------|---------|
| LND-9 | MODIFIED | `ORG_SAME_AS` 3→5: +TikTok @ezefernandezdev, +GitHub repo relevy (sameAs 15/15) |
| LND-19.2 | ADDED | Article JSON-LD (`@type: "Article"`, NO TechArticle) con datos reales en la landing |
| LND-19.3 | ADDED | Article incluye `speakable` `["#case-study"]` + `id="case-study"` en el HTML servido |
| LND-19.4 | ADDED | `award` queda omitido: `missing_recommended` honesto documentado (13/15), sin inventar premio |

## MODIFIED Requirements

### Requirement: JSON-LD Organization (LND-9)

When the landing page renders, then it MUST emit `Organization` and `WebSite` structured data via a `<script type="application/ld+json">` block with `name` "Relevy", `url` the production domain (`relevy.app`), and `sameAs` linking the GitHub repo `relevy`. The `Organization` node MUST additionally include `knowsAbout`, `founder`, `address`, `contactPoint`, `email`, `foundingDate`, `areaServed` ("AR"), `industry` ("Software"), and `numberOfEmployees` (1), populated with real Relevy data (nothing invented, LND-7). The nested `founder` Person node MUST carry `sameAs` referencing the same real profiles as `ORG_SAME_AS` — a distinct expertise signal (+2) even though the authoritativeness engine deduplicates the URLs (no authoritativeness gain, no invented profiles). `ORG_SAME_AS` MUST contain EXACTLY five real, verifiable profiles: the three existing (github.com/ezefernandezyf, linkedin.com/in/ezequiel-fernandez-59a21a387, ezefernandez.com) plus `https://www.tiktok.com/@ezefernandezdev` and `https://github.com/ezefernandezyf/relevy`, so `countValidSameAs` returns 15 (5×3). The Organization node MUST NOT emit an `award` property — no real award exists and inventing one would violate LND-7; the schema engine keeps reporting `missing_recommended` for `award` (accepted honesty-over-score tradeoff).
(Previously: `ORG_SAME_AS` had exactly three profiles, so `countValidSameAs` returned 9 (3×3).)

#### Scenario: Relevy Organization + WebSite

- GIVEN the landing page
- WHEN it renders
- THEN the JSON-LD `name` is "Relevy" and `sameAs`/`url` reference Relevy (no "GeoAudit")

#### Scenario: Recommended properties populated with real data

- GIVEN the landing JSON-LD `Organization` node
- WHEN it is inspected
- THEN `knowsAbout`, `founder`, `address`, `contactPoint`, `email`, `foundingDate`, `areaServed`, `industry`, and `numberOfEmployees` are present
- AND every value traces to real Relevy data (verified `sameAs` URLs, real founder/address/contact, country "AR", industry "Software", 1 employee — no placeholders)

#### Scenario: Founder Person carries the five real sameAs profiles

- GIVEN the `Organization` node's nested `founder` Person
- WHEN its properties are inspected
- THEN `sameAs` equals `ORG_SAME_AS` with exactly five entries: github.com/ezefernandezyf, linkedin.com/in/ezequiel-fernandez-59a21a387, ezefernandez.com, www.tiktok.com/@ezefernandezdev, github.com/ezefernandezyf/relevy
- AND no invented handle appears (updated `toEqual`/`toMatchObject` in `brand.test.ts` and `page.test.tsx`)

#### Scenario: No authoritativeness double-count

- GIVEN the `sameAs` URLs across Organization and Person nodes
- WHEN `sameAsUrls` collects them
- THEN the set is deduplicated — the Person `sameAs` add no new URLs, so authoritativeness is unchanged

#### Scenario: Real org attributes trace to brand constants

- GIVEN the `Organization` node
- WHEN `areaServed`, `industry`, and `numberOfEmployees` are inspected
- THEN they equal "AR", "Software", and 1 respectively
- AND each value comes from a `brand.ts` constant (`ORG_AREA_SERVED`, `ORG_INDUSTRY`, `ORG_EMPLOYEES`) — never a hardcoded literal in the page

#### Scenario: sameAs scores 15/15 with five real profiles

- GIVEN the `Organization` node's `sameAs` and the nested `founder` Person's `sameAs`
- WHEN `countValidSameAs` runs across all flattened nodes
- THEN it returns 15 (5 profiles × 3 nodes flattened, deduplicated)
- AND no invented handle appears in either array

#### Scenario: No invented award

- GIVEN the `Organization` node
- WHEN it is inspected
- THEN no `award` property is present
- AND the schema engine still reports `missing_recommended` for `award` (honesty over score, LND-7) — the `missing_recommended` count stays 1

## ADDED Requirements

### Requirement: Article JSON-LD with Real Data (LND-19.2)

When the landing page renders, then it MUST emit a third JSON-LD block with `@type: "Article"` (NOT "TechArticle" — only `article`/`newsarticle`/`blogposting` fire the publisher signal in `classify.ts:109-115`). The Article node MUST be populated with real Relevy data from `copy.ts`/`brand.ts`: `headline` equal to the Case Study heading ("Case Study: ¿Cómo mejoramos el GEO Score de nuestro propio sitio?"), `datePublished` "2026-08-20", `dateModified` "2026-08-28", `author` = `FOUNDER` (name + sameAs), `publisher` = Organization Relevy (`BRAND_NAME` + `APP_URL`), and `url` = `APP_URL`. Emitting this node MUST satisfy the engine's `article_author` criterion (10/10) and MUST make `detectBusinessType` return `publisher` (10/10).

#### Scenario: Article node served with real fields

- GIVEN the landing page
- WHEN its JSON-LD blocks are inspected
- THEN one block has `@type: "Article"` with `headline` matching the Case Study heading, `datePublished` "2026-08-20", `dateModified` "2026-08-28", `author` carrying the FOUNDER name and sameAs, and `publisher` naming Relevy at `relevy.app`
- AND no block uses `@type: "TechArticle"`

#### Scenario: Article satisfies article_author and publisher

- GIVEN the emitted Article node
- WHEN the schema engine scores the served JSON-LD
- THEN `article_author` scores 10/10 (author name + sameAs)
- AND `business_type_schema` scores 10/10 with `detectBusinessType` returning `publisher` (stable, anonymous or authenticated crawl)

### Requirement: Article speakable + case-study element (LND-19.3)

When the landing renders the Article JSON-LD and the Case Study section, then the Article node MUST include a `speakable` property whose `cssSelector` array contains exactly `["#case-study"]`, and the Case Study section container in the served HTML MUST have `id="case-study"` so the selector points to a real element (honesty LND-7). Emitting this MUST satisfy the engine's `speakable` criterion (5/5).

#### Scenario: speakable selector references a real element

- GIVEN the Article JSON-LD block and the served Case Study markup
- WHEN the JSON-LD and the rendered HTML are inspected
- THEN `speakable.cssSelector` equals `["#case-study"]`
- AND an element with `id="case-study"` is present in the served HTML (presence test — no dangling selector)

#### Scenario: speakable criterion satisfied

- GIVEN the Article node with `speakable`
- WHEN the schema engine scores the served JSON-LD
- THEN `speakable` scores 5/5

### Requirement: Award stays honest missing_recommended (LND-19.4)

The `award` property MUST NOT be added to any JSON-LD node — no real award exists and inventing one would violate LND-7. The schema engine MUST keep reporting `missing_recommended` for `award`, and `organization_person` MUST remain 13/15. No test MAY assert an invented award.

#### Scenario: No award emitted, gap documented

- GIVEN the landing JSON-LD
- WHEN it is inspected
- THEN no `award` property appears anywhere
- AND `organization_person` scores 13/15 with `award` documented as `missing_recommended` (honest, never fabricated)

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| LND-9 | Relevy Organization + WebSite, Recommended properties populated, Founder Person carries the five real sameAs profiles, No authoritativeness double-count, Real org attributes trace to brand constants, sameAs scores 15/15 with five real profiles, No invented award | Covered |
| LND-19.2 | Article node served with real fields, Article satisfies article_author and publisher | Covered |
| LND-19.3 | speakable selector references a real element, speakable criterion satisfied | Covered |
| LND-19.4 | No award emitted, gap documented | Covered |
