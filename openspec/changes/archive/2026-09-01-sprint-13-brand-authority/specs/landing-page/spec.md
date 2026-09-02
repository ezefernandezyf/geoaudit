# Delta for Landing Page

> **Change**: `sprint-13-brand-authority` · **Type**: Delta (MODIFIED)

## Racional

Polish de citabilidad completo (~51→65): los pasajes hero/feature pasan a la banda de extracción del engine (50-200 palabras) manteniendo answer-first con stats; el FAQ llega a 5+ preguntas reconocibles con H2/H3 en forma de pregunta (query-matchable, RCI-5/RPL-8); se agrega una tabla comparativa con datos reales (gana puntos de estructura RCI-5 y extracción RPL-10). Byline y fechas ya existentes se conservan.

| # | Change | Summary |
|---|--------|---------|
| LND-11 | MODIFIED | Pasajes citables en banda 50-200 palabras (antes: answer-first con stats, sin banda) |
| LND-13 | MODIFIED | FAQ 5+ preguntas reconocibles + H2/H3 en forma de pregunta |
| LND-14 | ADDED | Tabla comparativa con celdas de datos reales |

## MODIFIED Requirements

### Requirement: Citable Passages (LND-11)

When the hero and feature sections render, then the copy MUST be answer-first (definition/claim in the first 1-2 sentences), MUST include concrete statistics, and each passage MUST sit in the 50-200 word band (the citability engine's extraction band) so passages are self-contained and citable.
(Previously: answer-first with stats; no word-band requirement.)

#### Scenario: Answer-first copy with stats

- GIVEN the landing hero and feature cards
- WHEN their copy is inspected
- THEN each block leads with an answer/claim and carries at least one concrete stat

#### Scenario: Passages in the 50-200 word band

- GIVEN each hero/feature passage
- WHEN its word count is measured
- THEN it contains between 50 and 200 words
- AND the claim is fully stated in the first 1-2 sentences (no dangling references)

### Requirement: Content Signals (LND-13)

When the landing renders, then it MUST surface structured content signals: a visible FAQ section with 5+ recognizable questions (the FAQPage JSON-LD block is intentionally NOT emitted — documented product decision: the schema engine docks FAQPage as deprecated under RSC-7); H2/H3 content headings phrased as questions; `datePublished` on content sections with real dates; an author byline on content; and descriptive `alt` text on every image.
(Previously: visible FAQ with real questions — no count, recognizability, or question-heading requirements.)

#### Scenario: FAQ with 5+ recognizable questions, FAQPage JSON-LD omitted

- GIVEN the landing page
- WHEN it renders
- THEN a visible FAQ section with at least 5 questions in recognizable question form (what is / how to / …?) is present
- AND no `<script type="application/ld+json">` block of `@type` FAQPage is emitted (asserted by `page.test.tsx`)

#### Scenario: Question-form H2/H3 headings

- GIVEN the landing content sections
- WHEN their headings are inspected
- THEN the key H2/H3 headings are phrased as questions (query-matchable, RCI-5/RPL-8)

#### Scenario: Dates and byline on content

- GIVEN a content section on the landing
- WHEN it renders
- THEN it carries a real `datePublished` value and an author byline
- AND the value is not a placeholder

#### Scenario: Every image has alt text

- GIVEN all `<img>` elements on the landing
- WHEN they are inspected
- THEN each has a non-empty `alt` attribute describing the image

## ADDED Requirements

### Requirement: Comparative Table (LND-14)

The landing MUST render a comparison table (product vs alternatives / feature comparison) whose cells carry real Relevy facts — tables earn citability structure points (RCI-5) and AI extraction (RPL-10).

#### Scenario: Comparison table present

- GIVEN the landing page
- WHEN the comparison section renders
- THEN a `<table>` with at least 3 rows of real comparison data is present

#### Scenario: No invented cells

- GIVEN the comparison table
- WHEN its cells are inspected
- THEN every value traces to real product facts (no placeholder or fabricated numbers)

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| LND-11 | Answer-first copy with stats, Passages in the 50-200 word band | Covered |
| LND-13 | FAQ 5+ recognizable (FAQPage omitted), Question-form H2/H3, Dates and byline, Every image has alt | Covered |
| LND-14 | Comparison table present, No invented cells | Covered |