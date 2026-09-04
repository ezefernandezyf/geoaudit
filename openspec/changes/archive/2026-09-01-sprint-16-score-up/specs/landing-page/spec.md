# Delta for Landing Page

> **Change**: `2026-09-01-sprint-16-score-up` · **Type**: Delta (MODIFIED + ADDED)

## Racional

Sprint 16 sube el GEO Score real (62, baseline 2026-09-02) con contenido: el byline pasa del bloque FAQ (sin clase → bonus expertise 0/5) al footer global con `.byline` (LND-13); `FOUNDER` gana `sameAs` = `ORG_SAME_AS` (+2 expertise, LND-9; dedupe → sin +authoritativeness); dos secciones nuevas entre comparativa y FAQ — Case Study (H2 pregunta EN: +5 experience heading, +20 citability question; cuerpo ES neutro) y Changelog (v3.1.0/v3.0.0/v2.0.0: +10 experience, semver → stats); los 6 cards de plataforma pasan de 1 oración (~26 c/u) a 2-4 oraciones de 50-200 palabras con stats reales (LND-4). Co-updates: `page.test.tsx` (toEqual founder; byline → `footer.test.tsx`), `brand.test.ts`, `copy.test.ts` (VOSEO_PATTERN), `a11y.test.tsx` (shell completo). El cuerpo ES no dispara first-person ni case phrases (triggers EN-only) — cap experience 15/25, documentado honesto.

| # | Change | Summary |
|---|--------|---------|
| LND-13 | MODIFIED | Byline → footer global con `.byline`; `<time>` queda en contenido |
| LND-9 | MODIFIED | `FOUNDER.sameAs` = ORG_SAME_AS (+2 expertise; dedupe sin +authoritativeness) |
| LND-4 | MODIFIED | Desc de plataformas: 2-4 oraciones / 50-200 palabras / answer-first / stats reales; títulos y bots intactos |
| LND-16 | ADDED | Case Study entre comparativa y FAQ: H2 pregunta EN + cuerpo ES neutro (números verificados) |
| LND-17 | ADDED | Changelog tras Case Study: H2 "Changelog" + v3.1.0/v3.0.0/v2.0.0 |

## MODIFIED Requirements

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

## ADDED Requirements

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
| LND-13 | FAQ 5+ recognizable (FAQPage JSON-LD omitted), Question-form H2/H3, Date on content + byline in global footer, Every image has alt text | Covered |
| LND-9 | Relevy Organization + WebSite, Recommended properties populated, Founder Person carries real sameAs, No authoritativeness double-count | Covered |
| LND-4 | Six platform logos/names, Bot/company/H3 titles unchanged, Answer-first 50-200 word descriptions, No invented stats | Covered |
| LND-16 | Renders between comparison and FAQ, Heading matches locked question form, Spanish neutral body 50-200 words, Verified numbers only | Covered |
| LND-17 | Changelog heading present, Three real versions in semver, Block in extraction band | Covered |