# Landing Page Specification

> **Change**: `sprint-7-ui-fidelity` + `sprint-8-polish-testing-backlog` + `sprint-9-audit-calibration` + `sprint-10-free-mode` + `sprint-11-rebrand-polish` + `sprint-12-dogfood-geo-score` + `sprint-13-brand-authority` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

The marketing landing page re-implemented 1:1 with Gemini's composition: a hero with the URL input and "Run Audit" button **inside** the field plus sample URLs, a five-card feature row with contrasting backgrounds (card 03 on dark navy with emerald number), a demo ScoreHero + band table using the **real** thresholds (90/75/60/40), and the six AI platforms. It is the anonymous entry point to the free audit flow. Since Sprint 8, the page is session-aware (the primary CTA adapts via `auth()`, Home becomes dynamic), the demo ScoreHero shows a REAL score from `runAudit()` against candidate URLs with its honest band (never an invented number), and OpenGraph/Twitter metadata is emitted (LND-6/LND-7/LND-8). Since Sprint 10, the pricing teaser and "Ver Planes" CTA are removed; the anonymous CTA repoints to signup/audit (e.g. "Auditar gratis"). Since Sprint 11, the JSON-LD `name`/`sameAs`/`url` reference the Relevy brand and the `relevy` repo (LND-9), and `llms.txt` carries the Relevy brand with `relevy.app` and the accurate 10/30-day free limit (LND-10). Since Sprint 12, the Organization JSON-LD carries the full recommended property set (`knowsAbout`, `founder`, `address`, `contactPoint`, `email`, `foundingDate` — LND-9), and the landing shows a visible FAQ with real questions plus `datePublished`/byline/alt (LND-13; FAQPage JSON-LD intentionally omitted as a product decision — the schema engine docks FAQPage as deprecated under RSC-7). Since Sprint 13, the landing copy describes the six GEO dimensions with their weights (LND-11 adds the 50-200 word band), the feature grid gains a 6th "Autoridad de marca" card (20%), the FAQ reaches 6 recognizable questions with question-form H2/H3 headings (LND-13), and a comparison table with real Relevy facts (LND-14) renders between the platforms and the FAQ. Since Sprint 15, the copy weight references are synced to v3.1.0 (24/23/15/12/14/12, brand "12 %"/"octava parte" — LND-15), the hero subtitle lists the six dimensions by name without percentages (LND-11), and the comparison table scrolls horizontally on mobile while preserving semantic `<table>` markup (LND-14). Since Sprint 16, the author byline moved to the global footer with the `.byline` class so the expertise engine detects it over the full DOM (LND-13), the founder Person carries the real `sameAs` profiles (LND-9), the six platform cards carry 2-4 sentence 50-200 word descriptions with concrete verified stats (LND-4), and the landing gains Case Study (LND-16) and Changelog (LND-17) sections between the comparison table and the FAQ.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| LND-1 | Hero form inline | New | MUST | Hero MUST place the URL input and submit button inside one field with sample URLs |
| LND-2 | Contrast cards 01-05 | New | MUST | Five feature cards MUST use contrasting backgrounds; card 03 is dark navy with an emerald number |
| LND-3 | Scorecard demo | New | MUST | Demo ScoreHero + band table MUST use the real 90/75/60/40 thresholds |
| LND-4 | Six platforms | New | MUST | Landing MUST surface the six AI platforms; each card MUST carry an answer-first description of 2-4 sentences in the 50-200 word band with at least one concrete verified stat; platform name/bot/company/H3 titles unchanged |
| LND-5 | GEO Engine badge | New | MUST | Hero MUST show the "GEO Engine" badge |
| LND-6 | Authenticated CTA | New | MUST | Home MUST call `auth()`; session → "Ir al dashboard", else signup/audit CTA; no pricing teaser |
| LND-7 | Veracious ScoreHero | New | MUST | ScoreHero MUST show verified score + `auditDate` + `categoryScores` (no placeholder) |
| LND-8 | OG/SEO tags | New | MUST | Landing MUST emit OpenGraph + Twitter metadata |
| LND-9 | JSON-LD organization | New | MUST | Landing MUST emit Organization + WebSite JSON-LD naming "Relevy" with `url` `relevy.app` and `sameAs` the `relevy` repo; Organization MUST include `knowsAbout`, `founder`, `address`, `contactPoint`, `email`, `foundingDate` (real data); nested founder Person MUST carry `sameAs` = `ORG_SAME_AS` (+2 expertise, no authoritativeness double-count) |
| LND-10 | Crawl/AI assets | New | MUST | Landing MUST serve robots.txt, sitemap.xml, and llms.txt (Relevy brand, `relevy.app`, accurate 10/30d limit) |
| LND-11 | Citable passages | New | MUST | Hero/feature copy MUST be answer-first with concrete stats, each passage in the 50-200 word band, hero subtitle names-only (no percentages) |
| LND-12 | E-E-A-T signals | New | MUST | Landing MUST surface author/org trust signals (legal links, contact, HTTPS) |
| LND-13 | Content signals: FAQ, dates, byline, alt | New | MUST | Landing MUST expose a visible FAQ with 5+ recognizable questions (FAQPage JSON-LD intentionally omitted — product decision, RSC-7), question-form H2/H3 headings, `datePublished` on content, author byline in the global footer (`.byline` class), and alt text on images |
| LND-14 | Comparative table | ADDED | MUST | Landing MUST render a comparison table with ≥3 rows of real Relevy facts, semantic `<table>` preserved with horizontal scroll on mobile (`overflow-x-auto` + `min-w`), no invented cells |
| LND-15 | Weight copy accuracy v3.1.0 | ADDED | MUST | Landing weight copy MUST match v3.1.0 (24/23/15/12/14/12); brand "12 %"/"octava parte"; no stale v3.0.0; "24 puntos"/"12 criterios" intact |
| LND-16 | Case Study section | ADDED | MUST | Landing MUST render a Case Study section between the comparison table and the FAQ: locked H2 "Case Study: ¿Cómo mejoramos el GEO Score de nuestro propio sitio?" (ends in "?", contains "Case Study"), neutral Spanish body in the 50-200 word band with verified numbers only |
| LND-17 | Changelog section | ADDED | MUST | Landing MUST render a Changelog section immediately after Case Study: H2 "Changelog" + the three real engine versions in semver (v3.1.0/v3.0.0/v2.0.0), block kept in the 50-200 word band |

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

When the landing page renders, then it MUST surface the six AI platforms (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews, Bing Copilot). Each platform card MUST carry a description of 2-4 sentences (50-200 words, the citability extraction band) that is answer-first (states the platform's AI-search behavior in the first sentence, explicit subject — no pronoun/conjunction lead) and self-contained, and MUST include at least one concrete stat drawn from the verified product facts (17 agents, 6 platforms, <30s per URL, semver engine versions, 2026). The platform name, crawler bot, company, and H3 titles MUST remain unchanged (exact-match tests). No invented or unverified stats.
(Previously: each platform card carried a single-sentence description (~35 words, no stats) — the six blocks scored ~26 in citability.)

#### Scenario: Six platform logos/names

- GIVEN the landing page
- WHEN it renders
- THEN the six platforms are shown

#### Scenario: Bot, company and H3 titles unchanged

- GIVEN the platforms section
- WHEN it renders
- THEN each card still shows its exact bot and company strings (GPTBot / OAI-SearchBot, ClaudeBot / Anthropic-AI, PerplexityBot, Google-Extended, Googlebot Smartphone, Bingbot / IndexNow)
- AND the H3 titles are untouched (asserted by `page.test.tsx`)

#### Scenario: Answer-first descriptions in the 50-200 word band

- GIVEN each platform card description
- WHEN it is inspected
- THEN it is 2-4 sentences and between 50 and 200 words
- AND it leads with an explicit subject and carries at least one concrete stat

#### Scenario: No invented stats

- GIVEN the six platform descriptions
- WHEN their numbers are inspected
- THEN every stat traces to verified product facts (17 agents, 6 platforms, <30s, semver versions, 2026)
- AND no fabricated figure appears

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

When the landing page renders, then it MUST emit `Organization` and `WebSite` structured data via a `<script type="application/ld+json">` block with `name` "Relevy", `url` the production domain (`relevy.app`), and `sameAs` linking the GitHub repo `relevy`. The `Organization` node MUST additionally include `knowsAbout`, `founder`, `address`, `contactPoint`, `email`, and `foundingDate`, populated with real Relevy data (nothing invented, LND-7). The nested `founder` Person node MUST carry `sameAs` referencing the same three real profiles as `ORG_SAME_AS` — a distinct expertise signal (+2) even though the authoritativeness engine deduplicates the URLs (no authoritativeness gain, no invented profiles).
(Previously: the `founder` Person node carried `@type` and `name` only — the +2 expertise sameAs bonus was not detected.)

#### Scenario: Relevy Organization + WebSite

- GIVEN the landing page
- WHEN it renders
- THEN the JSON-LD `name` is "Relevy" and `sameAs`/`url` reference Relevy (no "GeoAudit")

#### Scenario: Recommended properties populated with real data

- GIVEN the landing JSON-LD `Organization` node
- WHEN it is inspected
- THEN `knowsAbout`, `founder`, `address`, `contactPoint`, `email`, and `foundingDate` are present
- AND every value traces to real Relevy data (verified `sameAs` URLs, real founder/address/contact — no placeholders)

#### Scenario: Founder Person carries the real sameAs profiles

- GIVEN the `Organization` node's nested `founder` Person
- WHEN its properties are inspected
- THEN `sameAs` equals `ORG_SAME_AS` (github.com/ezefernandezyf, linkedin.com/in/ezequiel-fernandez-59a21a387, ezefernandez.com)
- AND no invented handle appears (updated `toEqual`/`toMatchObject` in `brand.test.ts` and `page.test.tsx`)

#### Scenario: No authoritativeness double-count

- GIVEN the `sameAs` URLs across Organization and Person nodes
- WHEN `sameAsUrls` collects them
- THEN the set is deduplicated — the Person `sameAs` add no new URLs, so authoritativeness is unchanged

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

When the hero and feature sections render, then the copy MUST be answer-first (definition/claim in the first 1-2 sentences), MUST include concrete statistics, and each passage MUST sit in the 50-200 word band (the citability engine's extraction band) so passages are self-contained and citable. The hero subtitle MUST list the six dimensions by NAME only, without percentages, and the full hero passage MUST remain at or above the 50-word floor of the band after the subtitle is shortened.
(Previously: hero subtitle listed the six v3.0.0 weights with percentages.)

#### Scenario: Answer-first copy with stats

- GIVEN the landing hero and feature cards
- WHEN their copy is inspected
- THEN each block leads with an answer/claim and carries at least one concrete stat

#### Scenario: Passages in the 50-200 word band

- GIVEN each hero/feature passage
- WHEN its word count is measured
- THEN it contains between 50 and 200 words
- AND the hero passage remains ≥50 words with the shortened subtitle

#### Scenario: Hero subtitle is names-only

- GIVEN the hero subtitle
- WHEN its content is inspected
- THEN it names the six dimensions without percentages (e.g. "citabilidad, E-E-A-T, acceso de bots, autoridad de marca, datos estructurados y plataforma")
- AND no percentage value appears in the subtitle

### Requirement: E-E-A-T Signals (LND-12)

When the landing renders, then it MUST surface trust and authority signals: legal links (terms/privacy), contact information, and HTTPS-only links.

#### Scenario: Trust signals present

- GIVEN the landing footer
- WHEN it renders
- THEN terms, privacy, and contact links are present and all internal links are HTTPS

### Requirement: Content Signals (LND-13)

When the landing renders, then it MUST surface structured content signals: a visible FAQ section with 5+ recognizable questions (FAQPage JSON-LD intentionally NOT emitted — product decision, RSC-7); H2/H3 content headings phrased as questions; `datePublished` on content sections with real dates; an author byline rendered by the GLOBAL FOOTER (moved out of the FAQ block, with class `.byline` so the expertise engine's `AUTHOR_SELECTOR` detects it over the full DOM); and descriptive `alt` text on every image. The byline is no longer part of the `<Page/>` render — it MUST be asserted in the shell/footer render.
(Previously: author byline inside the FAQ block with no `.byline` class — the +5 expertise byline bonus was never detected.)

#### Scenario: FAQ with 5+ recognizable questions, FAQPage JSON-LD omitted

- GIVEN the landing page
- WHEN it renders
- THEN a visible FAQ section with at least 5 questions in recognizable question form is present
- AND no `@type` FAQPage JSON-LD block is emitted (asserted by `page.test.tsx`)

#### Scenario: Question-form H2/H3 headings

- GIVEN the landing content sections
- WHEN their headings are inspected
- THEN the key H2/H3 headings are phrased as questions (query-matchable, RCI-5/RPL-8)

#### Scenario: Date on content, byline in the global footer

- GIVEN a content section on the landing
- WHEN it renders
- THEN it carries a real `datePublished` value (never a placeholder)
- AND the author byline with class `.byline` renders in the global footer (asserted in `footer.test.tsx` / shell render — not in the page-only render)

#### Scenario: Every image has alt text

- GIVEN all `<img>` elements on the landing
- WHEN they are inspected
- THEN each has a non-empty `alt` attribute describing the image

### Requirement: Comparative Table (LND-14)

The landing MUST render a comparison table (product vs alternatives / feature comparison) whose cells carry real Relevy facts — tables earn citability structure points (RCI-5) and AI extraction (RPL-10). The table MUST keep semantic `<table>` markup; on viewports narrower than the table's content width the section MUST remain horizontally scrollable (`overflow-x-auto` wrapper + a `min-w` on the table) so columns stay legible instead of squeezing.
(Previously: table rendered at full width inside an `overflow-hidden` wrapper — illegible on mobile.)

#### Scenario: Comparison table present

- GIVEN the landing page
- WHEN the comparison section renders at a 360px viewport
- THEN a semantic `<table>` with at least 3 rows of real comparison data is present
- AND the section is horizontally scrollable with a min-width table (columns keep legible width, no cell squeeze)

#### Scenario: No invented cells

- GIVEN the comparison table
- WHEN its cells are inspected
- THEN every value traces to real product facts (no placeholder or fabricated numbers)

### Requirement: Weight Copy Accuracy v3.1.0 (LND-15)

When the landing copy references dimension weights, then every percentage MUST match the v3.1.0 engine weights: citability 24%, E-E-A-T 23%, acceso de bots 15%, datos estructurados 12%, plataforma 14%, autoridad de marca 12%. The brand authority references MUST read "12 %" and "octava parte" — never "20 %" or "quinta parte". The copy MUST NOT contain any stale v3.0.0 value (22,4 / 19,2 / 16 / 20 / 11,2). The "24 puntos" (E-E-A-T rubric, not a weight) and "12 criterios" (schema criteria count, not a weight) references MUST remain unchanged. `copy.test.ts` MUST be co-updated in the same change.

#### Scenario: All weight references match v3.1.0

- GIVEN the hero, features[01-06], and FAQ copy
- WHEN every weight reference is inspected
- THEN each matches 24/23/15/12/14/12
- AND no stale v3.0.0 value (22,4/19,2/16/20/11,2) appears anywhere

#### Scenario: Brand reads octava parte

- GIVEN features[06] and faq[4] (brand authority)
- WHEN their weight copy is inspected
- THEN they read "12 %" and "octava parte" (no "20 %" / "quinta parte")

#### Scenario: Rubric and criteria counts untouched

- GIVEN the E-E-A-T and schema feature cards
- WHEN their non-weight copy is inspected
- THEN "24 puntos" (E-E-A-T rubric) and "12 criterios" (schema) remain unchanged

#### Scenario: copy.test.ts passes with v3.1.0

- GIVEN the co-updated assertions
- WHEN `pnpm test` runs
- THEN `copy.test.ts` passes asserting the v3.1.0 values (no stale 20% / "quinta parte")

### Requirement: Case Study Section (LND-16)

When the landing renders, then it MUST include a Case Study section between the comparison table and the FAQ, in document order. The heading MUST be an H2 reading exactly "Case Study: ¿Cómo mejoramos el GEO Score de nuestro propio sitio?" — ending in "?" (citability question-form bonus) and containing "Case Study" (experience case-heading bonus). The body MUST be neutral Spanish (no English phrases, no voseo/tuteo), 50-200 words, a third-person honest dogfooding narrative using ONLY verified numbers: the 14-URL corpus (Relevy 55 vs moz 57, promedio 42.4), the total GEO 47 → 62 during 2026, 6 engines and <30s per URL. The body MUST NOT contain "92" nor any unverified figure, MUST NOT conflate the E-E-A-T dimension (46) with the corpus total, and MUST NOT repeat exact-match strings asserted elsewhere (platform names, six domain names, FAQ questions) so existing `getByText` assertions stay unique.

#### Scenario: Section renders between comparison and FAQ

- GIVEN the landing page
- WHEN the sections are inspected in document order
- THEN a Case Study H2 renders after the comparison table and before the FAQ section

#### Scenario: Heading matches the locked question form

- GIVEN the Case Study heading
- WHEN it is inspected
- THEN it reads exactly "Case Study: ¿Cómo mejoramos el GEO Score de nuestro propio sitio?" (ends in "?")

#### Scenario: Spanish neutral body in the 50-200 word band

- GIVEN the Case Study body
- WHEN it is inspected
- THEN it is between 50 and 200 words, neutral Spanish (no English phrases; passes the `VOSEO_PATTERN` invariant), and self-contained with an explicit subject lead

#### Scenario: Verified numbers only

- GIVEN the Case Study body
- WHEN its figures are inspected
- THEN every number belongs to the verified set (14 URLs, 55/57/42.4, 47→62, 2026, 6, <30)
- AND it contains no "92", no unverified claims, and no "46→55"-style dimension/total conflation

### Requirement: Changelog Section (LND-17)

When the landing renders, then it MUST include a Changelog section immediately after the Case Study section. The heading MUST be an H2 reading exactly "Changelog" (matches the engine's changelog heading pattern → +10 experience proxy). The section MUST list the three real engine versions in semver format, one line each, naming what changed: v3.1.0 (sprint 14 — calibración de pesos y bandas, citability v3.1), v3.0.0 (sprint 13 — dimensión autoridad de marca), v2.0.0 (sprint 9 — primer modelo de puntuación calibrado). The version lines MUST keep the block in the 50-200 word band (semver strings also hit the citability `STAT_PATTERN`).

#### Scenario: Changelog heading present

- GIVEN the landing page
- WHEN it renders
- THEN an H2 reading exactly "Changelog" renders immediately after the Case Study section

#### Scenario: Three real versions in semver

- GIVEN the changelog list
- WHEN it is inspected
- THEN it lists exactly v3.1.0, v3.0.0 and v2.0.0 with one honest line each (what changed, no invented version)

#### Scenario: Block stays in the extraction band

- GIVEN the changelog block
- WHEN its word count is measured
- THEN it contains between 50 and 200 words

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| LND-1 | Button inside the input, Sample URLs pre-fill | Covered |
| LND-2 | Card 03 is navy | Covered |
| LND-3 | Real thresholds shown | Covered |
| LND-4 | Six platform logos/names, Bot/company/H3 titles unchanged, Answer-first 50-200 word descriptions, No invented stats | Covered |
| LND-5 | Badge visible | Covered |
| LND-6 | Logged-in user sees dashboard CTA, Anonymous visitor sees audit CTA | Covered |
| LND-7 | Verified evidence shown, No candidate reaches 90+ | Covered |
| LND-8 | OG + Twitter tags present | Covered |
| LND-9 | Relevy Organization + WebSite, Recommended properties populated with real data, Founder Person carries real sameAs, No authoritativeness double-count | Covered |
| LND-10 | Assets served at root, llms.txt is Relevy-accurate | Covered |
| LND-11 | Answer-first copy with stats, Passages in the 50-200 word band, Hero subtitle is names-only | Covered |
| LND-12 | Trust signals present | Covered |
| LND-13 | FAQ 5+ recognizable (FAQPage JSON-LD omitted by product decision), Question-form H2/H3, Date on content + byline in global footer, Every image has alt text | Covered |
| LND-14 | Comparison table present, No invented cells | Covered |
| LND-15 | All weight references match v3.1.0, Brand reads octava parte, Rubric and criteria counts untouched, copy.test.ts passes with v3.1.0 | Covered |
| LND-16 | Section renders between comparison and FAQ, Heading matches locked question form, Spanish neutral body 50-200 words, Verified numbers only | Covered |
| LND-17 | Changelog heading present, Three real versions in semver, Block in extraction band | Covered |