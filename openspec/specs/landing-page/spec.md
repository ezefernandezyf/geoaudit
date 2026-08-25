# Landing Page Specification

> **Change**: `sprint-7-ui-fidelity` + `sprint-8-polish-testing-backlog` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

The marketing landing page re-implemented 1:1 with Gemini's composition: a hero with the URL input and "Run Audit" button **inside** the field plus sample URLs, a five-card feature row with contrasting backgrounds (card 03 on dark navy with emerald number), a demo ScoreHero + band table using the **real** thresholds (90/75/60/40), and the six AI platforms. It is the anonymous entry point to the free audit flow. Since Sprint 8, the page is session-aware (the primary CTA adapts via `auth()`, Home becomes dynamic), the demo ScoreHero shows a REAL score from `runAudit()` against candidate URLs with its honest band (never an invented number), and OpenGraph/Twitter metadata is emitted (LND-6/LND-7/LND-8).

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| LND-1 | Hero form inline | New | MUST | Hero MUST place the URL input and submit button inside one field with sample URLs |
| LND-2 | Contrast cards 01-05 | New | MUST | Five feature cards MUST use contrasting backgrounds; card 03 is dark navy with an emerald number |
| LND-3 | Scorecard demo | New | MUST | Demo ScoreHero + band table MUST use the real 90/75/60/40 thresholds |
| LND-4 | Six platforms | New | MUST | The page MUST surface the six AI platforms |
| LND-5 | GEO Engine badge | New | MUST | Hero MUST show the "GEO Engine" badge |
| LND-6 | Authenticated CTA | New | MUST | Home MUST call `auth()`; session → "Ir al dashboard", else keep plan CTA |
| LND-7 | Veracious ScoreHero | New | MUST | ScoreHero MUST show the best REAL score from `runAudit()` with honest band; never invented |
| LND-8 | OG/SEO tags | New | MUST | Landing MUST emit OpenGraph + Twitter metadata |

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

When the Home page renders, then it MUST call `auth()` (making Home dynamic) and adapt the CTA: with an active session the CTA reads "Ir al dashboard", and without a session it keeps "Ver planes y precios".

#### Scenario: Logged-in user sees dashboard CTA

- GIVEN an active session
- WHEN Home renders
- THEN the primary CTA reads "Ir al dashboard"

#### Scenario: Anonymous visitor sees plans CTA

- GIVEN no session
- WHEN Home renders
- THEN the primary CTA reads "Ver planes y precios"

### Requirement: Veracious ScoreHero (LND-7)

When the landing ScoreHero renders, then it MUST display a real GEO score obtained by running `runAudit()` against candidate URLs (via a standalone script resolved by the Vitest `@/` alias), showing the best real score with its honest band. The score MUST never be invented; if no candidate reaches 90+, the best real score is shown with honest copy.

#### Scenario: Best real score shown honestly

- GIVEN `runAudit()` returns real scores for the candidate URLs
- WHEN the ScoreHero renders
- THEN the best real score is displayed with its honest band

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

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| LND-1 | Button inside the input, Sample URLs pre-fill | Covered |
| LND-2 | Card 03 is navy | Covered |
| LND-3 | Real thresholds shown | Covered |
| LND-4 | Six platform logos/names | Covered |
| LND-5 | Badge visible | Covered |
| LND-6 | Logged-in user sees dashboard CTA, Anonymous visitor sees plans CTA | Covered |
| LND-7 | Best real score shown honestly, No candidate reaches 90+ | Covered |
| LND-8 | OG + Twitter tags present | Covered |
