# Landing Page Specification

> **Change**: `sprint-7-ui-fidelity` + `sprint-8-polish-testing-backlog` + `sprint-9-audit-calibration` + `sprint-10-free-mode` + `sprint-11-rebrand-polish` + `sprint-12-dogfood-geo-score` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

The marketing landing page re-implemented 1:1 with Gemini's composition: a hero with the URL input and "Run Audit" button **inside** the field plus sample URLs, a five-card feature row with contrasting backgrounds (card 03 on dark navy with emerald number), a demo ScoreHero + band table using the **real** thresholds (90/75/60/40), and the six AI platforms. It is the anonymous entry point to the free audit flow. Since Sprint 8, the page is session-aware (the primary CTA adapts via `auth()`, Home becomes dynamic), the demo ScoreHero shows a REAL score from `runAudit()` against candidate URLs with its honest band (never an invented number), and OpenGraph/Twitter metadata is emitted (LND-6/LND-7/LND-8). Since Sprint 10, the pricing teaser and "Ver Planes" CTA are removed; the anonymous CTA repoints to signup/audit (e.g. "Auditar gratis"). Since Sprint 11, the JSON-LD `name`/`sameAs`/`url` reference the Relevy brand and the `relevy` repo (LND-9), and `llms.txt` carries the Relevy brand with `relevy.app` and the accurate 10/30-day free limit (LND-10). Since Sprint 12, the Organization JSON-LD carries the full recommended property set (`knowsAbout`, `founder`, `address`, `contactPoint`, `email`, `foundingDate` — LND-9), and the landing shows a visible FAQ with real questions plus `datePublished`/byline/alt (LND-13; FAQPage JSON-LD intentionally omitted as a product decision — the schema engine docks FAQPage as deprecated under RSC-7).

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| LND-1 | Hero form inline | New | MUST | Hero MUST place the URL input and submit button inside one field with sample URLs |
| LND-2 | Contrast cards 01-05 | New | MUST | Five feature cards MUST use contrasting backgrounds; card 03 is dark navy with an emerald number |
| LND-3 | Scorecard demo | New | MUST | Demo ScoreHero + band table MUST use the real 90/75/60/40 thresholds |
| LND-4 | Six platforms | New | MUST | The page MUST surface the six AI platforms |
| LND-5 | GEO Engine badge | New | MUST | Hero MUST show the "GEO Engine" badge |
| LND-6 | Authenticated CTA | New | MUST | Home MUST call `auth()`; session → "Ir al dashboard", else signup/audit CTA; no pricing teaser |
| LND-7 | Veracious ScoreHero | New | MUST | ScoreHero MUST show verified score + `auditDate` + `categoryScores` (no placeholder) |
| LND-8 | OG/SEO tags | New | MUST | Landing MUST emit OpenGraph + Twitter metadata |
| LND-9 | JSON-LD organization | New | MUST | Landing MUST emit Organization + WebSite JSON-LD naming "Relevy" with `url` `relevy.app` and `sameAs` the `relevy` repo; Organization MUST include `knowsAbout`, `founder`, `address`, `contactPoint`, `email`, `foundingDate` (real data) |
| LND-10 | Crawl/AI assets | New | MUST | Landing MUST serve robots.txt, sitemap.xml, and llms.txt (Relevy brand, `relevy.app`, accurate 10/30d limit) |
| LND-11 | Citable passages | New | MUST | Hero/feature copy MUST be answer-first with concrete stats |
| LND-12 | E-E-A-T signals | New | MUST | Landing MUST surface author/org trust signals (legal links, contact, HTTPS) |
| LND-13 | Content signals: FAQ, dates, byline, alt | New | MUST | Landing MUST expose a visible FAQ (FAQPage JSON-LD intentionally omitted — product decision, RSC-7), `datePublished` on content, author byline, and alt text on images |

### Requirement: Hero Form Inline (LND-1)

When the landing page renders, then the hero MUST present a single input field that contains the "Run Audit" button inside it, plus tappable sample URLs that pre-fill the input.

#### Scenario: Button inside the input

- GIVEN the landing hero
- WHEN it renders
- THEN the submit button sits inside the URL field (not stacked below)

#### Scenario: Sample URLs pre-fill

- GIVEN the landing hero
- WHEN a sample URL chip is activated
- THEN the input is pre-filled with that URL

### Requirement: Contrast Cards 01-05 (LND-2)

When the feature section renders, then it MUST show five numbered cards (01-05) with contrasting backgrounds, where card 03 uses the dark navy background with an emerald accent number.

#### Scenario: Card 03 is navy

- GIVEN the feature row
- WHEN it renders
- THEN card 03 has a dark navy (`#0f172a`) background with an emerald number

### Requirement: Scorecard Demo (LND-3)

When the demo scorecard renders, then it MUST present a sample GEO score with its band and a band table whose thresholds are the **real** ones (90/75/60/40) — never Gemini's 80/65/45/25.

#### Scenario: Real thresholds shown

- GIVEN the demo band table
- WHEN it renders
- THEN bands are labeled Excellent ≥90, Good ≥75, Fair ≥60, Poor ≥40, Critical <40

### Requirement: Six Platforms (LND-4)

When the landing page renders, then it MUST surface the six AI platforms (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews, Bing Copilot).

#### Scenario: Six platform logos/names

- GIVEN the landing page
- WHEN it renders
- THEN the six platforms are shown

### Requirement: GEO Engine Badge (LND-5)

When the hero renders, then it MUST show a "GEO Engine" badge above/beside the headline.

#### Scenario: Badge visible

- GIVEN the hero
- WHEN it renders
- THEN the "GEO Engine" badge is visible

### Requirement: Authenticated CTA (LND-6)

When the Home page renders, then it MUST call `auth()` (making Home dynamic) and adapt the CTA: with an active session the CTA reads "Ir al dashboard", and without a session it reads a signup/audit CTA (e.g. "Auditar gratis"). There is no pricing teaser or "Ver Planes" CTA.

#### Scenario: Logged-in user sees dashboard CTA

- GIVEN an active session
- WHEN Home renders
- THEN the primary CTA reads "Ir al dashboard"

#### Scenario: Anonymous visitor sees audit CTA

- GIVEN no session
- WHEN Home renders
- THEN the primary CTA reads a signup/audit CTA (e.g. "Auditar gratis")
- AND no pricing link is present

### Requirement: Veracious ScoreHero (LND-7)

When the landing ScoreHero renders, then it MUST display a real GEO score obtained by running `runAudit()` against candidate URLs, and it MUST present verified evidence — the score, an `auditDate`, and `categoryScores` breakdown — sourced from a real run, never a placeholder or invented number.
(Previously: real score required but evidence fields were placeholders — A3.2 open.)

#### Scenario: Verified evidence shown

- GIVEN a real `runAudit()` result for the best candidate URL
- WHEN the ScoreHero renders
- THEN it shows the score with its `auditDate` and `categoryScores` breakdown
- AND no placeholder value appears

#### Scenario: No candidate reaches 90+

- GIVEN the best real score is 85
- WHEN the ScoreHero renders
- THEN it shows 85 in the "good" band with honest copy, never a fabricated ≥90

### Requirement: OG/SEO Tags (LND-8)

When the landing page renders, then it MUST emit OpenGraph and Twitter card metadata via the shared OG helper (reusing the default metadata with OG fields added).

#### Scenario: OG + Twitter tags present

- GIVEN the landing page
- WHEN it renders
- THEN `og:title`, `og:description`, `og:image`, and Twitter card tags are present

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

### Requirement: Crawl/AI Assets (LND-10)

When the site serves static assets, then the landing MUST expose `robots.txt`, `sitemap.xml`, and `llms.txt` at the site root. `llms.txt` MUST reference the Relevy brand and `relevy.app` domain and MUST state the accurate free limit (10 audits / 30 days), not the stale "3 auditorías mensuales".
(Previously: assets served at root; llms.txt carried the GeoAudit brand and a stale 3-audit claim.)

#### Scenario: Assets served at root

- GIVEN a request to `/robots.txt`, `/sitemap.xml`, and `/llms.txt`
- WHEN each is fetched
- THEN each returns 200 with valid content

#### Scenario: llms.txt is Relevy-accurate

- GIVEN `public/llms.txt`
- WHEN its content is inspected
- THEN it names Relevy, links `relevy.app`, and states the 10/30-day limit

### Requirement: Citable Passages (LND-11)

When the hero and feature sections render, then the copy MUST be answer-first (definition/claim in the first 1-2 sentences) and MUST include concrete statistics, so passages are self-contained and citable.

#### Scenario: Answer-first copy with stats

- GIVEN the landing hero and feature cards
- WHEN their copy is inspected
- THEN each block leads with an answer/claim and carries at least one concrete stat

### Requirement: E-E-A-T Signals (LND-12)

When the landing renders, then it MUST surface trust and authority signals: legal links (terms/privacy), contact information, and HTTPS-only links.

#### Scenario: Trust signals present

- GIVEN the landing footer
- WHEN it renders
- THEN terms, privacy, and contact links are present and all internal links are HTTPS

### Requirement: Content Signals (LND-13)

When the landing renders, then it MUST surface structured content signals: a visible FAQ section with real questions (the FAQPage JSON-LD block is intentionally NOT emitted — documented product decision: the schema engine docks FAQPage as deprecated under RSC-7); `datePublished` on content sections with real dates; an author byline on content; and descriptive `alt` text on every image.

#### Scenario: FAQ section visible, FAQPage JSON-LD omitted

- GIVEN the landing page
- WHEN it renders
- THEN a visible FAQ section with real questions is present
- AND no `<script type="application/ld+json">` block of `@type` FAQPage is emitted (asserted by `page.test.tsx`)

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
| LND-1 | Button inside the input, Sample URLs pre-fill | Covered |
| LND-2 | Card 03 is navy | Covered |
| LND-3 | Real thresholds shown | Covered |
| LND-4 | Six platform logos/names | Covered |
| LND-5 | Badge visible | Covered |
| LND-6 | Logged-in user sees dashboard CTA, Anonymous visitor sees audit CTA | Covered |
| LND-7 | Verified evidence shown, No candidate reaches 90+ | Covered |
| LND-8 | OG + Twitter tags present | Covered |
| LND-9 | Relevy Organization + WebSite, Recommended properties populated with real data | Covered |
| LND-10 | Assets served at root, llms.txt is Relevy-accurate | Covered |
| LND-11 | Answer-first copy with stats | Covered |
| LND-12 | Trust signals present | Covered |
| LND-13 | FAQ section visible (FAQPage JSON-LD omitted by product decision), Dates and byline on content, Every image has alt text | Covered |