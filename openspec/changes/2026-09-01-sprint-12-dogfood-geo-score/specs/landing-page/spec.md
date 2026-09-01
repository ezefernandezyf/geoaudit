# Delta for Landing Page

> **Change**: `sprint-12-dogfood-geo-score` · **Type**: Delta (MODIFIED + ADDED)

## Racional

Subir el GEO Score de relevy.app (hoy 47/100) con señales verificables: JSON-LD completo (faltan 9 propiedades recomendadas), FAQ visible + FAQPage, fechas y byline en contenido, y alt text en imágenes. La verificación de llms.txt (LND-10) ya responde 200 en prod — no se crea duplicado, solo se re-audita como baseline.

## MODIFIED Requirements

### Requirement: JSON-LD Organization (LND-9)

When the landing page renders, then it MUST emit `Organization` and `WebSite` structured data via a `<script type="application/ld+json">` block with `name` set to "Relevy", `url` set to the production domain (`relevy.app`), and `sameAs` linking the GitHub repo `relevy`. The `Organization` node MUST additionally include the recommended properties `knowsAbout`, `founder`, `address`, `contactPoint`, `email`, and `foundingDate`, populated with real Relevy data (nothing invented, per the data-honesty rule).
(Previously: Organization carried name/url/sameAs only — 9 recommended properties missing.)

#### Scenario: Relevy Organization + WebSite

- GIVEN the landing page
- WHEN it renders
- THEN the JSON-LD `name` is "Relevy" and `sameAs`/`url` reference Relevy (no "GeoAudit")

#### Scenario: Recommended properties populated with real data

- GIVEN the landing JSON-LD `Organization` node
- WHEN it is inspected
- THEN `knowsAbout`, `founder`, `address`, `contactPoint`, `email`, and `foundingDate` are present
- AND every value traces to real Relevy data (verified `sameAs` URLs, real founder/address/contact — no placeholders)

## ADDED Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| LND-13 | Content signals: FAQ, dates, byline, alt text | New | MUST | Landing MUST expose FAQ + FAQPage JSON-LD, `datePublished` on content sections, author byline, and alt text on images |

### Requirement: Content Signals (LND-13)

When the landing renders, then it MUST surface structured content signals: a visible FAQ section backed by FAQPage JSON-LD with real questions; `datePublished` on content sections with real dates; an author byline on content; and descriptive `alt` text on every image.

#### Scenario: FAQ section and FAQPage JSON-LD

- GIVEN the landing page
- WHEN it renders
- THEN a visible FAQ section with real questions is present
- AND a `<script type="application/ld+json">` block of `@type` FAQPage mirrors the same Q&A pairs

#### Scenario: Dates and byline on content

- GIVEN a content section on the landing
- WHEN it renders
- THEN it carries a real `datePublished` value and an author byline
- AND the value is not a placeholder

#### Scenario: Every image has alt text

- GIVEN all `<img>` elements on the landing
- WHEN they are inspected
- THEN each has a non-empty `alt` attribute describing the image

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| LND-9 | Relevy Organization + WebSite, Recommended properties populated with real data | Covered |
| LND-13 | FAQ section and FAQPage JSON-LD, Dates and byline on content, Every image has alt text | Covered |
