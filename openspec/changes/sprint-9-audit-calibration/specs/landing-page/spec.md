# Landing Page Specification (Delta)

> **Change**: `sprint-9-audit-calibration` · **Type**: Delta (MODIFIED + ADDED)

## Purpose

Dogfooding fix: the landing was audited at GEO Score 20 (Critical) — no JSON-LD, no robots/sitemap/llms.txt, no citable passages, weak E-E-A-T. This delta adds the machine-readable and citable signals the audit engine rewards, and closes A3.2 by backing the ScoreHero with verified evidence.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| LND-7 | Veracious ScoreHero | Partial | MUST | ScoreHero MUST show verified score + `auditDate` + `categoryScores` (no placeholder) |
| LND-9 | JSON-LD organization | New | MUST | Landing MUST emit Organization + WebSite JSON-LD via `application/ld+json` |
| LND-10 | Crawl/AI assets | New | MUST | Landing MUST serve robots.txt, sitemap.xml, and llms.txt |
| LND-11 | Citable passages | New | MUST | Hero/feature copy MUST be answer-first with concrete stats |
| LND-12 | E-E-A-T signals | New | MUST | Landing MUST surface author/org trust signals (legal links, contact, HTTPS) |

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

### Requirement: JSON-LD Organization (LND-9)

When the landing page renders, then it MUST emit `Organization` and `WebSite` structured data via a `<script type="application/ld+json">` block with `name`, `url`, and `sameAs` links.

#### Scenario: Organization + WebSite present

- GIVEN the landing page
- WHEN it renders
- THEN an `application/ld+json` block contains Organization and WebSite nodes with name/url/sameAs

### Requirement: Crawl/AI Assets (LND-10)

When the site serves static assets, then the landing MUST expose `robots.txt`, `sitemap.xml`, and `llms.txt` at the site root.

#### Scenario: Assets served at root

- GIVEN a request to `/robots.txt`, `/sitemap.xml`, and `/llms.txt`
- WHEN each is fetched
- THEN each returns 200 with valid content

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

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| LND-7 | Verified evidence shown, No candidate reaches 90+ | Covered |
| LND-9 | Organization + WebSite present | Covered |
| LND-10 | Assets served at root | Covered |
| LND-11 | Answer-first copy with stats | Covered |
| LND-12 | Trust signals present | Covered |
