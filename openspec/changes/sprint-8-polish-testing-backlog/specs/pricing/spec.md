# Delta: Pricing

> **Change**: `sprint-8-polish-testing-backlog` · **Type**: Delta (MODIFIED)

## Purpose

Add OpenGraph/Twitter metadata to the `/pricing` page using the shared OG helper, so pricing links preview correctly when shared. Billing logic and plan catalog (PRC-1..PRC-7) are unchanged.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| PRC-8 | OG/SEO tags | New | MUST | `/pricing` MUST emit OpenGraph + Twitter metadata |

### Requirement: OG/SEO Tags (PRC-8)

When the pricing page renders, then it MUST emit OpenGraph and Twitter card metadata via the shared OG helper (reusing the default metadata with OG fields added).

#### Scenario: OG + Twitter tags present on pricing

- GIVEN the `/pricing` page
- WHEN it renders
- THEN `og:title`, `og:description`, `og:image`, and Twitter card tags are present

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| PRC-8 | OG + Twitter tags present on pricing | Covered |
