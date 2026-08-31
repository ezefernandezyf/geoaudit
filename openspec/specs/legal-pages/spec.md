# Legal Pages Specification

> **Change**: `sprint-7-ui-fidelity` + `sprint-11-rebrand-polish` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

Static Server Components `/terms` and `/privacy`, rendered with the Gemini visual language (hex directos, same shell), written in neutral Spanish. They are static legal content — no dynamic data, no interactivity beyond the shared navbar/footer — and are reachable from the footer (and navbar where applicable). Since Sprint 11, the legal copy describes a single free model with no paid plans, billing, subscription, or payment-processing references (LGL-6).

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| LGL-1 | Terms route | New | MUST | `/terms` MUST render static terms content |
| LGL-2 | Privacy route | New | MUST | `/privacy` MUST render static privacy content |
| LGL-3 | Gemini visual language | New | MUST | Both pages MUST use the shared shell and Gemini hex/font styling |
| LGL-4 | Neutral copy | New | MUST | All legal copy MUST be neutral Spanish (no voseo) |
| LGL-5 | Footer reachability | New | MUST | Both pages MUST be linked from the footer |
| LGL-6 | Free-model legal copy | New | MUST | Legal copy MUST describe a single free model with no paid plans, billing, subscription, or payment-processing references |

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

### Requirement: Free-Model Legal Copy (LGL-6)

The legal copy (`LEGAL_COPY`) MUST describe a single free model. It MUST NOT contain paid plans, billing, subscription, or payment-processing references. The "Planes y facturación" terms section MUST be rewritten or removed, and the privacy policy MUST NOT mention processing payments.

#### Scenario: Terms has no paid plans

- GIVEN the `/terms` content
- WHEN it is inspected
- THEN no paid plans, billing, or pricing section appears

#### Scenario: Privacy has no payments

- GIVEN the `/privacy` content
- WHEN it is inspected
- THEN no payment-processing reference appears

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| LGL-1 | Terms render statically | Covered |
| LGL-2 | Privacy renders statically | Covered |
| LGL-3 | Shared shell applied | Covered |
| LGL-4 | No voseo | Covered |
| LGL-5 | Footer links present | Covered |
| LGL-6 | Terms has no paid plans, Privacy has no payments | Covered |
