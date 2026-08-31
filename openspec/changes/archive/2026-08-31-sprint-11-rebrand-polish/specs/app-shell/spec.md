# Delta for App Shell

> **Change**: `sprint-11-rebrand-polish` · **Type**: Delta (MODIFIED) + New requirements (ADDED)

## MODIFIED Requirements

### Requirement: Logo (SHL-4)

When the navbar renders, then it MUST show the Relevy mark — the user-generated Relevy icon + wordmark — replacing the previous "GeoAudit" logo. The same Relevy mark MUST be served as the site favicon via `src/app/icon.svg`.
(Previously: navbar showed the "G" serif + wave + globe logo with the "GeoAudit" wordmark.)

#### Scenario: Relevy wordmark

- GIVEN the navbar
- WHEN it renders
- THEN the Relevy logo and "Relevy" wordmark appear (no "GeoAudit" text)

#### Scenario: Relevy favicon

- GIVEN a request for the site favicon
- WHEN the App Router serves `icon.svg`
- THEN it renders the Relevy mark (not the legacy "G" tile)

## ADDED Requirements

### Requirement: Support Email Constant (SHL-8)

The footer MUST render the support contact using the single shared support email constant (`ezefernandezyf@gmail.com`). The literal email MUST NOT be hardcoded anywhere else.

#### Scenario: Footer support mailto

- GIVEN the shared footer
- WHEN it renders the support link
- THEN the `mailto:` target resolves to the shared support email constant

### Requirement: Brand Metadata + Copyright (SHL-9)

The app MUST emit "Relevy" as the page `<title>`/metadata template and in the shared OG helper's `siteName`/`alt` fields. The footer MUST show a copyright line reading "© Relevy".

#### Scenario: Page title is Relevy

- GIVEN any route
- WHEN the `<head>` metadata renders
- THEN the title template resolves to "Relevy"

#### Scenario: OG siteName is Relevy

- GIVEN the shared OG helper
- WHEN OG metadata is generated
- THEN `siteName` and image `alt` read "Relevy"

#### Scenario: Footer copyright

- GIVEN the shared footer
- WHEN it renders
- THEN the copyright line reads "© Relevy"
