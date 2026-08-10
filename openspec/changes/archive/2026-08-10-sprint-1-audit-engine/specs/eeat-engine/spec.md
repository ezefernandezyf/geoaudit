# E-E-A-T Engine Specification

## Purpose

Assess a single page's Experience, Expertise, Authoritativeness, and Trustworthiness signals as a proxy for AI system ranking confidence. Each dimension scores 0-25, with a composite 0-100. This is a single-page subset — the Topical Authority modifier is excluded per proposal D8 and explicitly labeled "not_measured".

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| REE-1 | Experience score (0-25) | MUST | Score first-person language, case-study patterns, and hands-on operational indicators |
| REE-2 | Expertise score (0-25) | MUST | Score author byline/bio presence, author Person schema, and technical-depth proxy (domain terms, code blocks, citation density) |
| REE-3 | Authoritativeness score (0-25) | MUST | Score external source citations to authority domains and author `sameAs` link presence |
| REE-4 | Trustworthiness score (0-25) | MUST | Score contact info, privacy/ToS links, HTTPS, and review/testimonial patterns with disclosure |
| REE-5 | Word count benchmarking | MUST | Compute word count and compare to page-type benchmark thresholds |
| REE-6 | Heading hierarchy | MUST | Check heading depth and flag skipped levels (e.g., H1 → H3 without H2) |
| REE-7 | Freshness signals | MUST | Extract `datePublished` and `dateModified` from DOM, meta tags, or JSON-LD |
| REE-8 | Topical Authority placeholder | MUST | Output field `topicalAuthority: "not_measured"` with rationale per D8 |
| REE-9 | Composite E-E-A-T score | MUST | Return sum of the four dimension scores (0-100) plus per-dimension breakdowns |
| REE-10 | Graceful absence handling | MUST | Missing author signals, citations, or contact info MUST produce partial scores (not errors) |

### Requirement: Experience Score (REE-1)

The system MUST detect first-person language and case-study patterns.

#### Scenario: Rich first-person case-study content

- GIVEN a page containing "We deployed this solution across 50 stores…" and "Our team found that…" and "Case Study:"
- WHEN the Experience dimension is scored
- THEN the score is ≥ 15 (first-person + case-study indicators)
- AND the detected patterns are enumerated in the dimension breakdown

#### Scenario: Impersonal third-party content

- GIVEN a page with exclusively third-person voice ("The company reported…", "Users can…") and no case-study patterns
- WHEN the Experience dimension is scored
- THEN the score is ≤ 5

### Requirement: Expertise Score (REE-2)

The system MUST detect author identity signals and technical depth.

#### Scenario: Author with byline and schema

- GIVEN a page with visible author byline ("By Dr. Jane Smith") and author Person JSON-LD with sameAs links
- WHEN the Expertise dimension is scored
- THEN the score is ≥ 15
- AND author schema presence is noted in findings

#### Scenario: No author signals

- GIVEN a page with no author byline, no author schema, no bio link
- WHEN the Expertise dimension is scored
- THEN the score is ≤ 5
- AND the finding indicates "no_author_detected"

#### Scenario: Technical depth detected

- GIVEN a page containing domain-specific terms, code blocks (`<code>`/`<pre>`), and ≥3 external citations
- WHEN the Expertise dimension is evaluated
- THEN technical-depth proxy contributes ≥ 5 points (partial credit even without explicit author)

### Requirement: Trustworthiness Score (REE-4)

The system MUST verify trust signals: contact info, legal links, HTTPS, and review patterns.

#### Scenario: Full trust signals present

- GIVEN a page served over HTTPS with visible contact page link, privacy policy link, terms of service link, and a review section with disclosure note
- WHEN the Trustworthiness dimension is scored
- THEN the score is ≥ 18

#### Scenario: No legal links, no contact

- GIVEN a page with no privacy policy link, no terms link, and no visible contact information
- WHEN the Trustworthiness dimension is scored
- THEN the score is ≤ 8
- AND findings list "missing_privacy_policy", "missing_contact_info"

### Requirement: Heading Hierarchy (REE-6)

The system MUST detect skipped heading levels.

#### Scenario: Clean H1 → H2 → H3 hierarchy

- GIVEN a page with H1 "Title", H2 "Section A", H2 "Section B", H3 "Subsection" under Section B
- WHEN heading hierarchy is checked
- THEN no skip warnings are raised
- AND the heading depth count contributes positively

#### Scenario: H1 → H3 skip

- GIVEN a page with H1 "Title" directly followed by H3 "Subsection" (no H2)
- WHEN heading hierarchy is checked
- THEN an "H2_skipped" warning is raised
- AND the score reflects the hierarchy violation

### Requirement: Freshness Signals (REE-7)

The system MUST extract publication and modification dates from available sources.

#### Scenario: datePublished in JSON-LD Article

- GIVEN a page with JSON-LD Article containing `datePublished: "2025-03-15"` and `dateModified: "2025-06-01"`
- WHEN freshness signals are extracted
- THEN both dates are captured
- AND the result includes days-since-modification

#### Scenario: No date signals

- GIVEN a page with no datePublished, no dateModified, no meta date
- WHEN freshness is evaluated
- THEN the freshness finding is "no_date_detected"
- AND the freshness contribution to the composite is documented (not scored separately — Trust dimension indicator)

### Requirement: Topical Authority Placeholder (REE-8)

The system MUST explicitly report topicalAuthority as "not_measured".

#### Scenario: All engine runs include the placeholder

- GIVEN any valid page input
- WHEN the E-E-A-T engine completes
- THEN the output contains `topicalAuthority: "not_measured"`
- AND a rationale field explains: "Single-page limit; multi-page crawl required (Sprint 5+)"

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| REE-1 | Rich first-person case-study, Impersonal third-party | Covered |
| REE-2 | Author with byline and schema, No author signals, Technical depth | Covered |
| REE-3 | (fixture with external citations → domain-match assertion) | Covered |
| REE-4 | Full trust signals, No legal links/contact | Covered |
| REE-5 | (fixture with known word count → benchmark comparison) | Covered |
| REE-6 | Clean hierarchy, H1→H3 skip | Covered |
| REE-7 | datePublished in JSON-LD, No date signals | Covered |
| REE-8 | All engine runs include the placeholder | Covered |
| REE-9 | (tested via all dimension scenario score sums) | Implicit |
| REE-10 | (tested via No author signals + No date signals — no exceptions) | Implicit |
