# Landing Page Specification

> **Change**: `sprint-6-ui-redesign` · **Type**: New capability (ADDED)

## Purpose

Full marketing landing replacing the minimal hero (`src/app/page.tsx`). The landing MUST drive the real audit flow (URL form → `auditAction` → `/report`), explain "how it works" using the five real domains, preview the score bands, and tease pricing — all without inventing features. Copy stays in Spanish, aligned to the real product.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| LND-1 | Hero with real form | New | MUST | Hero MUST render the real `AuditForm` bound to `auditAction` |
| LND-2 | How it works | New | MUST | MUST present the 5 real domains (crawlers/citability/content/schema/platform) |
| LND-3 | Scorecard preview | New | MUST | MUST preview score bands using the real `SeverityBand` mapping |
| LND-4 | Platform matrix teaser | New | MUST | MUST name the 6 supported AI platforms |
| LND-5 | Pricing teaser | New | MUST | MUST link to `/pricing` with no invented features/prices |

### Requirement: Hero with Real Form (LND-1)

When the landing renders, then the hero MUST render the same `AuditForm` + `auditAction` used by the `/report` empty state, so the landing drives the real audit flow.

#### Scenario: Form submits a real audit

- GIVEN the landing hero
- WHEN a user submits a URL
- THEN `auditAction` runs and the user is routed to `/report?url=...`
- AND no standalone/mock form is used

### Requirement: How It Works (LND-2)

When the "how it works" section renders, then it MUST present the five real audit domains and MUST NOT invent domains or features.

#### Scenario: Five real domains

- GIVEN the how-it-works section
- WHEN rendered
- THEN it lists: Acceso de bots, Citabilidad, E-E-A-T, Datos estructurados, Plataforma
- AND no sixth or invented domain appears

### Requirement: Scorecard Preview (LND-3)

When the score preview renders, then it MUST use the real severity bands and their Spanish labels, not fabricated scores.

#### Scenario: Band chips shown

- GIVEN the scorecard preview
- WHEN rendered
- THEN the five `SeverityBand` bands render with real labels (Excelente…Crítico)
- AND the preview reads as illustrative, not as a live score

### Requirement: Platform Matrix Teaser (LND-4)

When the platform section renders, then it MUST name exactly the six supported platforms.

#### Scenario: Six platforms

- GIVEN the platform teaser
- WHEN rendered
- THEN it lists ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews, Bing Copilot

### Requirement: Pricing Teaser (LND-5)

When the pricing teaser renders, then it MUST link to `/pricing` and MUST NOT state prices or limits that differ from the plan catalog.

#### Scenario: Teaser links to pricing

- GIVEN the pricing teaser
- WHEN rendered
- THEN a CTA links to `/pricing`
- AND no price or feature is shown that the `/pricing` catalog does not contain
