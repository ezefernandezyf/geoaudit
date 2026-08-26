# Citability Engine Specification

## Purpose

Analyze the main textual content of a page to determine how likely AI systems (ChatGPT, Claude, Perplexity, Gemini) are to cite or quote passages. Segment content by H2/H3 headings into blocks, score each block across five weighted dimensions, and produce top/bottom block analysis with template-based rewrite suggestions.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| RCI-1 | Main content extraction | MUST | Extract main content via Cheerio, excluding nav, footer, sidebar, and ad elements |
| RCI-2 | Content segmentation | MUST | Segment extracted text by H2/H3 headings into discrete content blocks |
| RCI-3 | Answer Block Quality (30%) | MUST | Score each block for answer-block patterns; award partial credit for partial matches, not binary |
| RCI-4 | Self-Containment (25%) | MUST | Score each block: explicit subject mention, no pronoun-first lead, 50-200 word length band |
| RCI-5 | Structural Readability (20%) | MUST | Score structural readability with partial credit for partial compliance, not binary |
| RCI-6 | Statistical Density (15%) | MUST | Award intermediate points per stat density level (percentages, currency, dates, named sources) |
| RCI-7 | Uniqueness (10%) | MUST | Score each block: original-data phrases ("we surveyed…", "our data shows…"), first-person voice — proxy signal |
| RCI-8 | Block composite score | MUST | Compute per-block weighted average of the 5 dimensions (30/25/20/15/10) |
| RCI-9 | Page aggregate score | MUST | Compute page citability score as mean of all validated block scores |
| RCI-10 | Top/bottom block output | MUST | Return top 3 and bottom 3 blocks with individual dimension scores and excerpts |
| RCI-11 | Citability coverage | MUST | Return citability coverage as percentage of blocks scoring ≥ 70 |
| RCI-12 | Rewrite suggestions | MUST | For bottom blocks, generate template-based rewrite suggestions (definition pattern, answer-first, stat injection) |
| RCI-13 | Single-block fallback | MUST | Pages with no H2/H3 headings MUST treat the entire extracted content as one block |
| RCI-14 | Malformed HTML tolerance | MUST | Malformed HTML MUST NOT throw; engine MUST produce best-effort scores on recoverable content |

### Requirement: Main Content Extraction (RCI-1)

The system MUST extract the primary textual content using Cheerio, excluding known non-content regions.

#### Scenario: Standard article page

- GIVEN a HTML page with `<article>`, `<nav>`, `<footer>`, and `<aside class="sidebar">`
- WHEN main content is extracted
- THEN text from `<article>` is included
- AND text from `<nav>`, `<footer>`, and `<aside class="sidebar">` is excluded

#### Scenario: No semantic containers

- GIVEN a HTML page with only `<div>` elements and no `<article>`/`<nav>`/`<footer>`
- WHEN main content is extracted
- THEN the largest text-containing `<div>` is selected
- AND empty or minimal-text divs are excluded

### Requirement: Content Segmentation (RCI-2)

The system MUST segment extracted content by H2/H3 headings into blocks.

#### Scenario: Multiple H2 sections

- GIVEN extracted content with 4 H2 headings, each followed by paragraph text
- WHEN content is segmented
- THEN 4 blocks are produced
- AND each block includes its heading text and the text up to the next H2

#### Scenario: H2 with nested H3

- GIVEN content with H2 "Overview" and two H3 sub-headings beneath it
- WHEN content is segmented
- THEN 3 blocks are produced: one for H2, one per H3
- AND the H2 block contains text before the first H3

### Requirement: Answer Block Quality (RCI-3)

The system MUST score each block for answer-block patterns, awarding partial credit for partial matches (e.g., a definition without an immediate answer, or an answer without a standalone first-60-words) instead of all-or-nothing. Exact thresholds follow the WU-2 calibration decision.
(Previously: binary scoring — full credit only for definition + immediate answer + standalone lead.)

#### Scenario: Definition pattern detected

- GIVEN a block starting with "API rate limiting is a technique used to control…"
- WHEN Answer Block Quality is scored
- THEN the score is ≥ 70 (definition pattern "is" + answer in first sentence)
- AND the first-60-words standalone check contributes positively

#### Scenario: No answer pattern

- GIVEN a block starting with "In this section, we will discuss various features…" (no definition)
- WHEN Answer Block Quality is scored
- THEN the score is < 40 (no definition, no immediate answer)

#### Scenario: Partial answer pattern earns intermediate credit

- GIVEN a block with a definition but the answer buried after 3 sentences
- WHEN Answer Block Quality is scored
- THEN the block earns partial credit (> 0, below full) rather than 0

### Requirement: Self-Containment (RCI-4)

The system MUST score blocks for contextual independence.

#### Scenario: Self-contained block

- GIVEN a block of 120 words starting with "The GeoAudit platform scans websites…" (explicit subject, no pronoun lead)
- WHEN Self-Containment is scored
- THEN the score is ≥ 70 (explicit subject, within 50-200 words)

#### Scenario: Pronoun-led block

- GIVEN a block starting with "It also provides detailed analytics…" (pronoun-lead, no subject)
- WHEN Self-Containment is scored
- THEN the score is < 30 (pronoun-first, requires external context)

### Requirement: Structural Readability (RCI-5)

The system MUST score structural readability with partial credit for partial compliance (e.g., clean hierarchy but no lists/tables, or question-as-heading but paragraphs longer than 4 sentences). Exact thresholds follow the WU-2 calibration decision.
(Previously: full credit only when all sub-checks passed.)

#### Scenario: Partial structure earns intermediate credit

- GIVEN a block with a clean H1>H2>H3 hierarchy but no tables/lists
- WHEN Structural Readability is scored
- THEN the block earns partial credit instead of the minimum

### Requirement: Statistical Density (RCI-6)

The system MUST award intermediate points by stat-density level (percentages, currency, dates, named sources) rather than a binary rich/poor split. Exact tiers follow the WU-2 calibration decision.
(Previously: binary — ≥1 stat/500 words full credit, else ≤ 10.)

#### Scenario: Stats-rich block

- GIVEN a 400-word block containing "According to a 2025 McKinsey report, 67% of companies…" and "the average cost is $12,000 per incident"
- WHEN Statistical Density is scored
- THEN the score is ≥ 70 (≥1 stat per 500 words with named source + percentage + dollar amount)

#### Scenario: Partial stat block earns intermediate credit

- GIVEN a 400-word block with one bare percentage but no named source
- WHEN Statistical Density is scored
- THEN the block earns intermediate credit (between 10 and full), not the minimum

#### Scenario: Stats-poor block

- GIVEN a 400-word block with no numbers, percentages, dollar amounts, or named sources
- WHEN Statistical Density is scored
- THEN the score is ≤ 10

### Requirement: Malformed HTML Tolerance (RCI-14)

The system MUST handle malformed HTML without throwing exceptions.

#### Scenario: Unclosed tags

- GIVEN HTML with `<p>` tags that are never closed
- WHEN content is extracted and segmented via Cheerio
- THEN the engine produces scores (Cheerio recovers)
- AND no exception is thrown

#### Scenario: Empty body

- GIVEN HTML with no `<body>` content
- WHEN content extraction runs
- THEN the engine returns a score of 0 with an empty blocks array
- AND no exception is thrown

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RCI-1 | Standard article page, No semantic containers | Covered |
| RCI-2 | Multiple H2 sections, H2 with nested H3 | Covered |
| RCI-3 | Definition pattern detected, No answer pattern, Partial answer pattern earns intermediate credit | Covered |
| RCI-4 | Self-contained block, Pronoun-led block | Covered |
| RCI-5 | Partial structure earns intermediate credit | Covered |
| RCI-6 | Stats-rich block, Partial stat block earns intermediate credit, Stats-poor block | Covered |
| RCI-7 | (tested via RCI-8 composite + first-person fixtures) | Implicit |
| RCI-8 | (tested via all dimension scenarios — composite assertion) | Implicit |
| RCI-9 | (tested via RCI-10 top/bottom output + score assertion) | Implicit |
| RCI-10 | (fixture with known-good blocks → top/bottom exact match) | Covered |
| RCI-11 | (fixture with mixed scores → coverage % assertion) | Covered |
| RCI-12 | (bottom block fixture → template key present in suggestion) | Covered |
| RCI-13 | (no-heading fixture → single block with full text) | Covered |
| RCI-14 | Unclosed tags, Empty body | Covered |
