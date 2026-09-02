# Platform Readiness Specification

## Purpose

Evaluate a page's on-page readiness for the five major AI search platforms (Google AI Overviews, ChatGPT, Perplexity, Gemini, Bing Copilot). Check HTTP headers, meta tags, Open Graph / Twitter Cards, SSR detection, and sitemap/llms.txt presence probes. External-presence criteria are split (since Sprint 13): the Wikipedia/Wikidata/entity-consistency criteria are labeled "measured" and source their points from the brand engine's signals; the remaining external criteria (YouTube, Reddit, Bing, backlinks, etc.) stay "not_measured" with a documented TODO for a future brand-mention scanner.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| RPL-1 | HTTP header checks | MUST | Check relevant response headers: X-Robots-Tag, Content-Type, canonical Link header, CSP, HSTS |
| RPL-2 | Meta tag analysis | MUST | Check presence and quality of `<title>`, `<meta name="description">`, `<meta name="viewport">` |
| RPL-3 | Open Graph tags | MUST | Check og:title, og:description, og:image, og:url, og:type |
| RPL-4 | Twitter Card tags | MUST | Check twitter:card, twitter:title, twitter:description, twitter:image |
| RPL-5 | SSR detection | MUST | Detect whether the raw HTML contains meaningful textual content or is an empty client-side shell |
| RPL-6 | Sitemap.xml probe | MUST | Issue a HEAD request to `/sitemap.xml` and report presence (yes/no) — informational only (P5) |
| RPL-7 | llms.txt probe | MUST | Issue a HEAD request to `/llms.txt` and report presence (yes/no) — informational only (P5) |
| RPL-8 | Question heading detection | MUST | Detect H2/H3 headings matching question patterns ("what is", "how to", ends with "?") for platform scoring |
| RPL-9 | Direct answer detection | MUST | Detect paragraph text immediately after a question heading (first <p> sibling) |
| RPL-10 | Per-platform scoring | MUST | Score on-page readiness for each platform (AIO, ChatGPT, Perplexity, Gemini, Copilot) using platform-specific criteria subsets |
| RPL-11 | External criteria labeling | MUST | Split external-presence criteria: Wikipedia/Wikidata/entity-consistency labeled "measured" (points from brand engine signals); the rest (YouTube, Reddit, Bing, backlinks, etc.) labeled "not_measured" with a TODO note |
| RPL-12 | Measured-only ceiling rescale | ADDED | MUST | Rescale each per-platform score by ×100/70 (the AIO rubric's measured maximum), applied once at per-platform computation; the rescaled value flows to the contract, report, `platform` dimension (14%), and `composeTechnical` — no downstream re-scale |

### Requirement: HTTP Header Checks (RPL-1)

The system MUST check page response headers for platform-relevant signals.

#### Scenario: Headers complete and correct

- GIVEN HTTP response with `Content-Type: text/html; charset=utf-8`, `X-Robots-Tag: index, follow`, and `Strict-Transport-Security: max-age=31536000`
- WHEN headers are checked
- THEN Content-Type is validated as HTML
- AND HSTS presence is recorded as a positive signal
- AND no header warnings are raised

#### Scenario: Missing canonical Link header

- GIVEN HTTP response without a `Link` header containing `rel="canonical"`
- WHEN headers are checked
- THEN a "missing_canonical_header" finding is recorded (severity: Low)

### Requirement: Open Graph Tags (RPL-3)

The system MUST check for Open Graph tag presence and quality.

#### Scenario: Full Open Graph tags

- GIVEN HTML with `<meta property="og:title">`, `og:description`, `og:image`, `og:url`, `og:type`
- WHEN Open Graph is analyzed
- THEN all 5 properties are marked present
- AND the score reflects full coverage

#### Scenario: No Open Graph tags

- GIVEN HTML with zero `og:` meta tags
- WHEN Open Graph is analyzed
- THEN all properties are marked absent
- AND a "missing_open_graph" finding is raised (severity: High for platforms using link previews)

### Requirement: SSR Detection (RPL-5)

The system MUST distinguish server-rendered content from empty client-side shells.

#### Scenario: SSR page with meaningful content

- GIVEN raw HTML body containing ≥500 characters of visible text (excluding script/style)
- WHEN SSR detection runs
- THEN the page is classified as "ssr_present"
- AND the text-to-HTML ratio is reported

#### Scenario: Empty client-side shell

- GIVEN raw HTML body containing `<div id="root"></div>` with <100 chars of visible text
- WHEN SSR detection runs
- THEN the page is classified as "client_side_shell"
- AND a "no_ssr_detected" finding is raised (severity: Critical for AI visibility)

### Requirement: Sitemap/llms.txt Probes (RPL-6, RPL-7)

The system MUST issue HEAD requests for presence checks only.

#### Scenario: Both files present

- GIVEN `/sitemap.xml` returns 200 and `/llms.txt` returns 200
- WHEN probes are executed
- THEN sitemap presence is `true`
- AND llms.txt presence is `true`
- AND no content parsing occurs (informational only)

#### Scenario: Both files absent

- GIVEN `/sitemap.xml` returns 404 and `/llms.txt` returns 404
- WHEN probes are executed
- THEN both are reported as absent
- AND findings note "missing_sitemap" and "missing_llms_txt" (severity: Low — informational)

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

### Requirement: Measured-Only Ceiling Rescale (RPL-12)

The platform engine MUST rescale each per-platform score to the measured-only ceiling by the factor ×100/70 (the AIO rubric's measured maximum: 70 measured points + 30 not_measured external points), applied once at per-platform score computation. The rescaled AIO score MUST be the value that flows to the contract, the report row, the `platform` dimension (14% weight), and `composeTechnical` (40% of the technical dimension); no downstream consumer MAY re-scale it.
(Reason: the 30 not_measured points flattened every site in the sprint-14 benchmark (+1-3/site correction); rescaling at the source keeps all consumers consistent and prevents double-counting the rescale. The pre-existing double ENTRY of platform into the composite — direct weight + technical composition, RGS-2 — is unchanged; only the value is honest.)

#### Scenario: Fully-measured AIO reaches 100

- GIVEN all AIO measured on-page signals max out (raw score 70)
- WHEN the per-platform score is rescaled
- THEN the AIO score is 100 (70 × 100/70)

#### Scenario: Partial measured signals rescale proportionally

- GIVEN an AIO raw score of 35 (half of the measured maximum)
- WHEN the per-platform score is rescaled
- THEN the AIO score is 50

#### Scenario: Rescale is single-sourced

- GIVEN a v3.1 audit with a rescaled AIO score
- WHEN the composite is computed
- THEN the `platform` dimension (14%) and `composeTechnical` both consume the SAME rescaled value
- AND no other stage of the pipeline re-scales the platform score

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RPL-1 | Headers complete, Missing canonical header | Covered |
| RPL-2 | (fixture with title+desc+viewport → presence check) | Covered |
| RPL-3 | Full Open Graph tags, No Open Graph tags | Covered |
| RPL-4 | (fixture with twitter:card → presence check) | Covered |
| RPL-5 | SSR page with content, Empty client-side shell | Covered |
| RPL-6 | Both files present (via RPL-6/RPL-7 combined scenario) | Covered |
| RPL-7 | Both files absent | Covered |
| RPL-8 | (fixture with question H2 → count assertion) | Covered |
| RPL-9 | (fixture with answer-after-heading → detected) | Covered |
| RPL-10 | AI Overviews ready, External criteria split | Covered |
| RPL-11 | Migrated criteria measured from brand signals, Remaining external criteria stay not_measured | Covered |
| RPL-12 | Fully-measured AIO reaches 100, Partial measured signals rescale proportionally, Rescale is single-sourced | Covered |
