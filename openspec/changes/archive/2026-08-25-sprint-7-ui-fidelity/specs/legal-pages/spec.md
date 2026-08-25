# Legal Pages Specification

> **Change**: `sprint-7-ui-fidelity` · **Type**: New capability (ADDED)

## Purpose

Static Server Components `/terms` and `/privacy`, rendered with the Gemini visual language (hex directos, same shell), written in neutral Spanish. They are static legal content — no dynamic data, no interactivity beyond the shared navbar/footer — and are reachable from the footer (and navbar where applicable).

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| LGL-1 | Terms route | New | MUST | `/terms` MUST render static terms content |
| LGL-2 | Privacy route | New | MUST | `/privacy` MUST render static privacy content |
| LGL-3 | Gemini visual language | New | MUST | Both pages MUST use the shared shell and Gemini hex/font styling |
| LGL-4 | Neutral copy | New | MUST | All legal copy MUST be neutral Spanish (no voseo) |
| LGL-5 | Footer reachability | New | MUST | Both pages MUST be linked from the footer |

### Requirement: Terms Route (LGL-1)

When a visitor navigates to `/terms`, then the system MUST render static terms-of-service content as a Server Component with no client interactivity.

#### Scenario: Terms render statically

- GIVEN a request to `/terms`
- WHEN the page renders
- THEN the terms content is displayed with no `"use client"` interactivity

### Requirement: Privacy Route (LGL-2)

When a visitor navigates to `/privacy`, then the system MUST render static privacy-policy content as a Server Component with no client interactivity.

#### Scenario: Privacy renders statically

- GIVEN a request to `/privacy`
- WHEN the page renders
- THEN the privacy content is displayed with no `"use client"` interactivity

### Requirement: Gemini Visual Language (LGL-3)

When either legal page renders, then it MUST reuse the shared app shell (navbar + footer) and apply the Gemini hex/font styling so the pages are visually consistent with the rest of the app.

#### Scenario: Shared shell applied

- GIVEN the legal pages
- WHEN either renders
- THEN the shared navbar and footer are present and the Gemini styling is applied

### Requirement: Neutral Copy (LGL-4)

When the legal copy is authored, then it MUST be written in neutral Spanish, free of voseo and regional slang.

#### Scenario: No voseo

- GIVEN the legal content strings
- WHEN they are inspected
- THEN no voseo forms (e.g. "tu", "vos", "hacé") are present

### Requirement: Footer Reachability (LGL-5)

When the footer renders, then it MUST link to both `/terms` and `/privacy`.

#### Scenario: Footer links present

- GIVEN the shared footer
- WHEN it renders
- THEN links to `/terms` and `/privacy` are present

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| LGL-1 | Terms render statically | Covered |
| LGL-2 | Privacy renders statically | Covered |
| LGL-3 | Shared shell applied | Covered |
| LGL-4 | No voseo | Covered |
| LGL-5 | Footer links present | Covered |
