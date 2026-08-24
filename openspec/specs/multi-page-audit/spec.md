# Multi-Page Audit Specification

> **Change**: `sprint-5-pro-features` · **Type**: New capability (ADDED)

## Purpose

Audit up to 5 pages of a site in one run, driven by sitemap discovery, and persist the result as one master `Audit` plus N `AuditPage` rows. Multi-page reuses the single-page `runAudit` per URL, bounds concurrency to 2–3, and relaxes the fetch layer's content-type gate (`RFL-8`) to accept `application/xml` for sitemap probes only. One multi-page audit counts as exactly one audit toward the tier limit, and the feature is gated to PRO/Enterprise.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| MPA-1 | Multi-page orchestration | New | MUST | `runMultiPageAudit` MUST audit a set of pages by reusing `runAudit` per URL and return one composite result |
| MPA-2 | Page cap (5) | New | MUST | A multi-page audit MUST audit at most 5 pages; excess URLs are ignored |
| MPA-3 | Bounded concurrency | New | MUST | Page fetches MUST run with bounded concurrency of 2–3, never unbounded |
| MPA-4 | Sitemap discovery | New | MUST | URLs MUST be discovered from `RobotsTxt.sitemaps` and/or `/sitemap.xml` |
| MPA-5 | Sitemap content-type gate | New | MUST | Relax `RFL-8` to accept `application/xml` for sitemap probes only |
| MPA-6 | AuditPage 1:N persistence | New | MUST | Persist one master `Audit` + N `AuditPage` rows (1:N) |
| MPA-7 | One audit toward tier | New | MUST | One multi-page audit MUST count as exactly one audit toward the tier limit |
| MPA-8 | PRO feature gate | New | MUST | Multi-page MUST be gated to PRO/Enterprise; FREE sees an upgrade CTA |
| MPA-9 | Single-page preservation | New | MUST | Single-page `runAudit` behavior MUST remain unchanged |

### Requirement: Multi-page Orchestration (MPA-1)

When a paid user runs a multi-page audit, then the system MUST invoke `runMultiPageAudit`, which audits each discovered page by reusing the single-page `runAudit` and returns one composite result with per-page results and an aggregate view.

#### Scenario: Composite result assembled

- GIVEN a list of 3 discovered page URLs
- WHEN `runMultiPageAudit` runs
- THEN `runAudit` executes once per URL
- AND one composite result aggregates the 3 per-page results

#### Scenario: Per-page isolation

- GIVEN one page fetch fails while others succeed
- WHEN `runMultiPageAudit` runs
- THEN the failed page is recorded with its error and the remaining pages still complete

### Requirement: Page Cap (MPA-2)

When a multi-page audit runs, then the system MUST audit at most 5 pages, ignoring URLs beyond the cap.

#### Scenario: More than five URLs discovered

- GIVEN sitemap discovery returns 8 URLs
- WHEN `runMultiPageAudit` runs
- THEN only the first 5 URLs are audited and the remaining 3 are ignored

### Requirement: Bounded Concurrency (MPA-3)

When pages are fetched, then the system MUST bound concurrency to 2–3 in-flight requests and MUST NOT launch all fetches in parallel.

#### Scenario: Concurrency stays bounded

- GIVEN 5 pages to audit
- WHEN `runMultiPageAudit` runs
- THEN no more than 3 page fetches are in flight at any instant

### Requirement: Sitemap Discovery (MPA-4)

When a multi-page audit needs its URL set, then the system MUST discover candidate URLs from `RobotsTxt.sitemaps` and, when absent, from `/sitemap.xml`.

#### Scenario: Sitemaps from robots.txt

- GIVEN `robots.txt` declares a `Sitemap:` entry
- WHEN URL discovery runs
- THEN the sitemap URL is fetched to extract page URLs

#### Scenario: Fallback to /sitemap.xml

- GIVEN `robots.txt` declares no sitemap
- WHEN URL discovery runs
- THEN `/sitemap.xml` is fetched as the fallback source

### Requirement: Sitemap Content-Type Gate (MPA-5)

When a sitemap probe fetches a URL, then the fetch layer MUST accept `application/xml` (and `text/xml`) responses for sitemap probes only, relaxing `RFL-8` without affecting other content-type gates.

#### Scenario: XML sitemap accepted

- GIVEN a sitemap endpoint returning `Content-Type: application/xml`
- WHEN the sitemap is probed
- THEN the body is accepted and parsed
- AND `RFL-8` behavior for `text/html` and `application/pdf` is unchanged

### Requirement: AuditPage 1:N Persistence (MPA-6)

When a multi-page audit completes, then the system MUST persist one master `Audit` row and N `AuditPage` rows, each referencing the master `Audit`.

#### Scenario: Rows persisted 1:N

- GIVEN a 4-page multi-page audit completes
- WHEN it is persisted
- THEN one `Audit` row and four `AuditPage` rows are written
- AND each `AuditPage` references the master `Audit`

### Requirement: One Audit Toward Tier (MPA-7)

When a multi-page audit is counted against the user's tier, then it MUST count as exactly one audit.

#### Scenario: Multi-page counts once

- GIVEN a PRO user runs a 5-page multi-page audit
- WHEN the tier counter is updated
- THEN `auditsUsed` increments by one, not five

### Requirement: PRO Feature Gate (MPA-8)

When an authenticated user attempts a multi-page audit, then the system MUST allow it only when `isPaidTier(user.tier)` is true; otherwise it MUST deny and show an upgrade CTA.

#### Scenario: FREE user is blocked

- GIVEN a `FREE` user
- WHEN they attempt a multi-page audit
- THEN the audit is denied with an upgrade CTA

#### Scenario: PRO user is allowed

- GIVEN a PRO user
- WHEN they attempt a multi-page audit
- THEN the multi-page audit proceeds

### Requirement: Single-page Preservation (MPA-9)

When the single-page flow runs, then the system MUST keep existing single-page `runAudit` behavior unchanged.

#### Scenario: Existing single-page tests stay green

- GIVEN the single-page audit flow
- WHEN `runAudit` is invoked directly
- THEN its behavior is unchanged and no multi-page coupling is introduced
