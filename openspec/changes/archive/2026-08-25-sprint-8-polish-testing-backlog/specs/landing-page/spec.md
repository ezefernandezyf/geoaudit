# Delta: Landing Page

> **Change**: `sprint-8-polish-testing-backlog` · **Type**: Delta (MODIFIED)

## Purpose

Make the landing page session-aware and truthful: the primary CTA adapts to auth state via `auth()` (Home becomes dynamic), the demo ScoreHero shows a REAL score from `runAudit()` against candidate URLs with its honest band (never an invented number), and OpenGraph/Twitter metadata is emitted. Existing composition (LND-1..LND-5) is unchanged.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| LND-6 | Authenticated CTA | New | MUST | Home MUST call `auth()`; session → "Ir al dashboard", else keep plan CTA |
| LND-7 | Veracious ScoreHero | New | MUST | ScoreHero MUST show the best REAL score from `runAudit()` with honest band; never invented |
| LND-8 | OG/SEO tags | New | MUST | Landing MUST emit OpenGraph + Twitter metadata |

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
| LND-6 | Logged-in user sees dashboard CTA, Anonymous visitor sees plans CTA | Covered |
| LND-7 | Best real score shown honestly, No candidate reaches 90+ | Covered |
| LND-8 | OG + Twitter tags present | Covered |
