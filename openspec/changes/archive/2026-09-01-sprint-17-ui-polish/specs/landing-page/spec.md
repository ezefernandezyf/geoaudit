# Delta for Landing Page

> **Change**: `2026-09-01-sprint-17-ui-polish` · **Type**: Delta (MODIFIED + ADDED)

## Racional

Dos cambios: (1) El JSON-LD Organization (LND-9) suma `areaServed` "AR", `industry` "Software" y `numberOfEmployees` 1 — valores reales confirmados por el usuario (país AR coincide con `BRAND_ADDRESS`, rubro Software, fundador único sin contractors) — y `award` queda OMITIDO porque no existe un premio real: inventarlo violaría LND-7. El engine seguirá marcando `missing_recommended` para `award` (tradeoff honestidad > score aceptado; el conteo baja de 4 a 1). (2) La landing rompe el tramo de cuatro secciones grises consecutivas (S5→S5b→S6→S7) con ritmo gris/blanco: S4 banda gris + recuadro blanco `rounded-2xl` alrededor de la grilla (los 6 cards conservan `bg-[#f8fafc] rounded-xl`), S5 banda blanca `border-y`, S5b gris + recuadro blanco `rounded-2xl`, S6 banda blanca `border-y`, S7 gris con su recuadro CTA existente. Eyebrows sobre superficie gris → `#475569` (AA 4.5:1 sobre `#f8fafc`); sobre blanco se mantiene `#64748b` (4.76:1). Wrapper de la tabla intacto (`overflow-x-auto`, recuadro AFUERA del wrapper; `min-w-[640px]` se conserva). Cero impacto en citability: `extractMainContent` es class-agnostic (lee texto vía Cheerio `.text()`).

| # | Change | Summary |
|---|--------|---------|
| LND-9 | MODIFIED | Organization JSON-LD suma `areaServed` "AR" / `industry` "Software" / `numberOfEmployees` 1 (constantes en `brand.ts`); `award` omitido (honestidad LND-7) |
| LND-18 | ADDED | Fondos intercalados gris/blanco (S4 recuadro, S5/S6 bandas blancas, S5b recuadro); eyebrows en gris → `#475569`; grilla plataformas conserva EXACTAMENTE 6 `div.rounded-xl`; wrapper tabla `overflow-x-auto` intacto |

## MODIFIED Requirements

### Requirement: JSON-LD Organization (LND-9)

When the landing page renders, then it MUST emit `Organization` and `WebSite` structured data via a `<script type="application/ld+json">` block with `name` "Relevy", `url` the production domain (`relevy.app`), and `sameAs` linking the GitHub repo `relevy`. The `Organization` node MUST additionally include `knowsAbout`, `founder`, `address`, `contactPoint`, `email`, `foundingDate`, `areaServed` ("AR"), `industry` ("Software"), and `numberOfEmployees` (1), populated with real Relevy data (nothing invented, LND-7). The nested `founder` Person node MUST carry `sameAs` referencing the same three real profiles as `ORG_SAME_AS` — a distinct expertise signal (+2) even though the authoritativeness engine deduplicates the URLs (no authoritativeness gain, no invented profiles). The Organization node MUST NOT emit an `award` property — no real award exists and inventing one would violate LND-7; the schema engine keeps reporting `missing_recommended` for `award` (accepted honesty-over-score tradeoff).
(Previously: the Organization node carried the recommended set without `areaServed`, `industry`, or `numberOfEmployees` — the engine flagged 4 `missing_recommended` properties.)

#### Scenario: Relevy Organization + WebSite

- GIVEN the landing page
- WHEN it renders
- THEN the JSON-LD `name` is "Relevy" and `sameAs`/`url` reference Relevy (no "GeoAudit")

#### Scenario: Recommended properties populated with real data

- GIVEN the landing JSON-LD `Organization` node
- WHEN it is inspected
- THEN `knowsAbout`, `founder`, `address`, `contactPoint`, `email`, `foundingDate`, `areaServed`, `industry`, and `numberOfEmployees` are present
- AND every value traces to real Relevy data (verified `sameAs` URLs, real founder/address/contact, country "AR", industry "Software", 1 employee — no placeholders)

#### Scenario: Founder Person carries the real sameAs profiles

- GIVEN the `Organization` node's nested `founder` Person
- WHEN its properties are inspected
- THEN `sameAs` equals `ORG_SAME_AS` (github.com/ezefernandezyf, linkedin.com/in/ezequiel-fernandez-59a21a387, ezefernandez.com)
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

#### Scenario: No invented award

- GIVEN the `Organization` node
- WHEN it is inspected
- THEN no `award` property is present
- AND the schema engine still reports `missing_recommended` for `award` (honesty over score, LND-7) — the `missing_recommended` count drops from 4 to 1

## ADDED Requirements

### Requirement: Interleaved Section Backgrounds (LND-18)

When the landing renders, then the section backgrounds MUST follow an alternating gray/white rhythm that breaks the former four-gray-section run (S5 Comparativa → S5b Case Study → S6 FAQ → S7 CTA): S4 (Plataformas) MUST render on the gray base with a white `rounded-2xl` recuadro wrapping the platform grid; S5 (Comparativa) MUST render as a `border-y` white band; S5b (Case Study) MUST render on the gray base wrapped in a white `rounded-2xl` recuadro; S6 (FAQ) MUST render as a `border-y` white band; S7 (CTA) keeps the gray base with its existing white `rounded-2xl` recuadro. No two adjacent sections within that run MUST NOT share the same background surface. Any eyebrow rendered on a gray surface MUST use `#475569` or darker (WCAG AA ≥ 4.5:1 on `#f8fafc`); eyebrows on white bands MAY keep `#64748b`. The platforms grid MUST keep EXACTLY 6 `div.rounded-xl` cards — new recuadros MUST use `rounded-2xl`, never `rounded-xl`. The comparison table's horizontal-scroll wrapper MUST remain `overflow-x-auto` (MUST NOT become `overflow-hidden`) with the table keeping `min-w-[640px]`; any recuadro MUST wrap OUTSIDE that wrapper. Background and recuadro changes MUST NOT alter the section content or the extracted citability text.

#### Scenario: Four-gray run broken

- GIVEN the landing sections from S5 (Comparativa) through S7 (CTA)
- WHEN their background surfaces are inspected
- THEN S5 and S6 render as white bands, S5b as gray with a white recuadro, and S7 as gray with its white recuadro
- AND no two adjacent sections in the run share the same background

#### Scenario: Platforms grid keeps exactly 6 rounded-xl cards

- GIVEN the platforms section (S4) with its white `rounded-2xl` recuadro on the gray base
- WHEN the section is inspected
- THEN it contains EXACTLY 6 `div.rounded-xl` cards (the recuadro is `rounded-2xl`, not `rounded-xl`)

#### Scenario: Case Study wrapped in a white recuadro

- GIVEN the Case Study section (S5b) on the gray base
- WHEN it renders
- THEN its content is wrapped in a white `rounded-2xl` recuadro

#### Scenario: Eyebrow contrast on gray bands

- GIVEN any eyebrow rendered on a gray surface
- WHEN its text color is inspected
- THEN it is `#475569` or darker (≥ 4.5:1 on `#f8fafc`)
- AND no gray-surface eyebrow uses `#64748b`

#### Scenario: Comparison table wrapper stays overflow-x-auto

- GIVEN the comparison section (S5) on the white band
- WHEN the table renders
- THEN `table.parentElement` keeps `overflow-x-auto` (never `overflow-hidden`)
- AND the table keeps `min-w-[640px]`

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| LND-9 | Relevy Organization + WebSite, Recommended properties populated with real data, Founder Person carries the real sameAs profiles, No authoritativeness double-count, Real org attributes trace to brand constants, No invented award | Covered |
| LND-18 | Four-gray run broken, Platforms grid keeps exactly 6 rounded-xl cards, Case Study wrapped in a white recuadro, Eyebrow contrast on gray bands, Comparison table wrapper stays overflow-x-auto | Covered |