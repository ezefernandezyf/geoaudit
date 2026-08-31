# Delta for Landing Page

> **Change**: `sprint-11-rebrand-polish` · **Type**: Delta (MODIFIED)

## MODIFIED Requirements

### Requirement: JSON-LD Organization (LND-9)

When the landing page renders, then it MUST emit `Organization` and `WebSite` structured data via a `<script type="application/ld+json">` block with `name` set to "Relevy", `url` set to the production domain (`relevy.app`), and `sameAs` linking the GitHub repo `relevy`.
(Previously: JSON-LD name was "GeoAudit" and `sameAs` linked `geo-saas`.)

#### Scenario: Relevy Organization + WebSite

- GIVEN the landing page
- WHEN it renders
- THEN the JSON-LD `name` is "Relevy" and `sameAs`/`url` reference Relevy (no "GeoAudit")

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
