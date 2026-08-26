# Schema Engine Specification

## Purpose

Extract, parse, and validate JSON-LD structured data from a web page against an 8-type Schema.org type registry. Detect missing required properties, flag deprecated schema types, verify `sameAs` links, detect the site's business type from on-page signals, and generate corrected JSON-LD that fills gaps.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| RSC-1 | JSON-LD extraction | MUST | Extract all `<script type="application/ld+json">` blocks from the parsed DOM |
| RSC-2 | JSON-LD parsing | MUST | Parse each block via `JSON.parse`; collect successes, log per-block errors, never crash |
| RSC-3 | Type registry | MUST | Validate `@type` against a static 8-type registry (Organization, LocalBusiness, Article, Product, FAQPage, WebSite+SearchAction, BreadcrumbList, SoftwareApplication) with required/recommended property tables per type |
| RSC-4 | Required property check | MUST | Flag missing required properties per the type registry |
| RSC-5 | Recommended property check | SHOULD | Flag absent recommended properties per the type registry |
| RSC-6 | sameAs verification | MUST | Check for `sameAs` presence; flag missing or invalid (non-URL) values |
| RSC-7 | Deprecated type flags | MUST | Flag deprecated schema types (HowTo snippets, FAQPage rich-result restrictions post-2024, etc.) |
| RSC-8 | Business-type detection | MUST | Detect business type from on-page signals: SaaS, local, ecommerce, publisher, agency, or hybrid |
| RSC-9 | Corrected JSON-LD generation | MUST | Generate corrected JSON-LD from per-business-type templates, filling missing required properties with sensible defaults or TODO markers |
| RSC-10 | @graph handling | MUST | When JSON-LD uses `@graph`, flatten and validate each node individually |
| RSC-11 | Empty JSON-LD handling | MUST | Pages with no JSON-LD blocks MUST produce an empty detection result with reason "no_structured_data", not an error |
| RSC-12 | Invalid JSON handling | MUST | Per-block JSON parse errors MUST be collected as warnings; valid blocks still processed |
| RSC-13 | Partial-credit schema scoring | New | MUST | Schema criteria MUST award intermediate points, not only 0/5/10/15 |

### Requirement: JSON-LD Extraction (RSC-1)

The system MUST extract all `<script type="application/ld+json">` blocks from the Cheerio-parsed DOM.

#### Scenario: Multiple JSON-LD blocks

- GIVEN HTML with two `<script type="application/ld+json">` blocks (Organization + WebSite)
- WHEN blocks are extracted
- THEN 2 blocks are returned with their raw text content
- AND each block preserves its original string exactly

#### Scenario: No JSON-LD blocks

- GIVEN HTML with zero `<script type="application/ld+json">` elements
- WHEN extraction runs
- THEN an empty array is returned
- AND the result carries reason "no_structured_data"

### Requirement: JSON-LD Parsing (RSC-2)

Valid JSON-LD blocks MUST be parsed; invalid blocks MUST be captured as warnings.

#### Scenario: Valid JSON-LD

- GIVEN extracted block text `{"@context":"https://schema.org","@type":"Organization","name":"Acme"}`
- WHEN the block is parsed
- THEN parsing succeeds with the parsed object
- AND no warning is recorded for this block

#### Scenario: Invalid JSON in one block

- GIVEN two blocks: one valid JSON-LD, one with broken JSON (`{bad`)
- WHEN both blocks are parsed
- THEN the valid block is successfully parsed and included
- AND the invalid block produces a warning with the block index
- AND no exception is thrown

### Requirement: Type Registry Validation (RSC-3)

Each parsed JSON-LD node's `@type` MUST be validated against the 8-type registry.

#### Scenario: Known type with all required properties

- GIVEN a JSON-LD node with `@type: "Organization"` and required properties: `name`, `url`
- WHEN validated against the Organization registry entry
- THEN no missing-required flags are raised
- AND recommended-property flags reference the Organization entry

#### Scenario: Unknown @type

- GIVEN a JSON-LD node with `@type: "UnknownType"`
- WHEN validated against the registry
- THEN the type is flagged as "unknown"
- AND no required/recommended checks are performed
- AND the node is still included in output

#### Scenario: @type with @graph children of mixed types

- GIVEN a `@graph` containing Organization and WebSite nodes
- WHEN validated
- THEN each node is validated against its own type entry
- AND the graph wrapper is preserved in output

### Requirement: sameAs Verification (RSC-6)

The system MUST check for `sameAs` property presence and validity on Organization, LocalBusiness, and Person types.

#### Scenario: sameAs present with valid URLs

- GIVEN Organization JSON-LD with `sameAs: ["https://twitter.com/acme", "https://linkedin.com/company/acme"]`
- WHEN sameAs is verified
- THEN no missing-sameAs flag is raised
- AND each URL is validated as a proper URL

#### Scenario: sameAs missing

- GIVEN Organization JSON-LD with no `sameAs` property
- WHEN sameAs is verified
- THEN a "missing_sameAs" flag is raised
- AND the severity is Warning (not Error)

### Requirement: Corrected JSON-LD Generation (RSC-9)

The system MUST generate corrected JSON-LD using per-business-type templates with gap-filling.

#### Scenario: Organization missing required url

- GIVEN parsed Organization block with `name: "Acme"` but no `url`
- AND the business-type detection returns "SaaS"
- WHEN corrected JSON-LD is generated
- THEN the output includes a `url` field with a `TODO: fill from page URL` marker
- AND all existing valid properties are preserved

#### Scenario: No existing JSON-LD

- GIVEN a page with zero structured data
- AND business-type detection returns "local"
- WHEN corrected JSON-LD is generated
- THEN a full LocalBusiness JSON-LD template is output with TODO markers for unfillable fields
- AND the template includes required LocalBusiness properties (name, address, url)

### Requirement: Empty JSON-LD Handling (RSC-11)

Pages with no structured data MUST produce a clean empty result, not an error.

#### Scenario: Zero ld+json scripts

- GIVEN a page with no `<script type="application/ld+json">` elements
- WHEN the schema engine runs
- THEN the result has `detected: []`, `warnings: []`, `generated` JSON-LD, and `businessType`
- AND no error or exception is raised

### Requirement: Partial-Credit Schema Scoring (RSC-13)

The schema dimension MUST award intermediate points per criterion (not only the discrete 0/5/10/15 steps), so partial compliance (e.g., an Organization node missing one recommended property, or one valid node among several missing) earns partial credit instead of a hard floor. Exact point tiers follow the WU-2 calibration decision.

#### Scenario: Partial schema earns intermediate credit

- GIVEN a page with a valid Organization node that is missing one recommended property
- WHEN the schema dimension is scored
- THEN the criterion earns an intermediate point value between 0 and 15 (not just 0/5/10/15)

#### Scenario: Full schema earns the cap

- GIVEN a page with Organization + WebSite nodes and all required/recommended properties present
- WHEN the schema dimension is scored
- THEN the criterion reaches the full point value

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RSC-1 | Multiple JSON-LD blocks, No JSON-LD blocks | Covered |
| RSC-2 | Valid JSON-LD, Invalid JSON in one block | Covered |
| RSC-3 | Known type with all required, Unknown @type, @graph with mixed types | Covered |
| RSC-4 | (tested via RSC-3 registry validation scenarios) | Implicit |
| RSC-5 | (tested via RSC-3 registry validation scenarios) | Implicit |
| RSC-6 | sameAs present with valid URLs, sameAs missing | Covered |
| RSC-7 | (fixture with HowTo/FAQPage deprecated → flag raised) | Covered |
| RSC-8 | (fixture with SaaS/ecommerce on-page signals → detection assertion) | Covered |
| RSC-9 | Organization missing required url, No existing JSON-LD | Covered |
| RSC-10 | (tested via RSC-3 @graph scenario) | Implicit |
| RSC-11 | Zero ld+json scripts | Covered |
| RSC-12 | (tested via RSC-2 invalid JSON scenario) | Implicit |
| RSC-13 | Partial schema earns intermediate credit, Full schema earns the cap | Covered |
