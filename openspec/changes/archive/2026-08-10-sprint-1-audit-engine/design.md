# Design: Sprint 1 — Core Audit Engine

## Technical Approach

Six pure domain modules (`src/crawlers/`, `src/citability/`, `src/schema/`, `src/eeat/`, `src/platform/`, `src/scoring/`) plus a shared SSRF-safe fetch layer (`src/lib/fetch/`) and the `runAudit(url)` orchestrator (`src/audit/`). Each engine is a deterministic function over parsed inputs — no network, no side effects. The orchestrator validates the URL, runs parallel bounded fetches, parses HTML once via Cheerio, invokes all engines, and returns a typed `AuditResult`. Injectable fetcher enables full fixture-driven TDD without network calls.

## Architecture Overview

**Dependency direction**: contracts → fetch → engines → orchestrator. Engines depend on contracts + the Cheerio DOM, NOT on each other. No cycles.

| Layer | Location | Role |
|-------|----------|------|
| Shared contracts | `src/lib/contracts/` | Zod schemas for AuditResult, FetchResult, ParsedPage, RobotsTxt |
| Fetch layer | `src/lib/fetch/` | SSRF guard, HTTP fetch, redirect loop, charset, content gate |
| Domain engines (6) | `src/<domain>/` | Pure scorer functions — crawlers, citability, schema, eeat, platform, scoring |
| Orchestrator | `src/audit/` | `runAudit(url, deps?)` — the core product behavior |

**Orchestrator location justification** (`src/audit/`): The audit orchestrator IS a business domain — "running an audit" is the product. AGENTS.md screaming architecture reserves top-level `src/` folders for business domains. It's cross-domain by nature (composing engines), but cross-domain ≠ not-a-domain. `src/lib/audit/` was considered and rejected: the orchestrator is not a utility — it's the primary business entry point that Sprint 2's Server Action will call.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Orchestrator location | `src/audit/` (top-level) | Core product behavior, consistent with screaming architecture |
| Engine I/O types | Engine-local (`src/<domain>/types.ts`) | Keeps engines self-contained, avoids contract-bloat |
| Cross-engine shared types | `src/lib/contracts/` | Only types consumed by ≥2 modules (AuditResult, FetchResult, ParsedPage, RobotsTxt) |
| Fetch injection | `type FetchImpl = (input: string \| URL, init?: RequestInit) => Promise<Response>` | Simplest interface — native fetch default, mock in tests |
| Engine error model | Return partial results, NEVER throw | Per RAO-12/ROR: orchestrator catches, records in `meta.errors` |
| robots.txt parser | Hand-rolled RFC 9309 subset in `src/crawlers/robots-parser.ts` | ~150 lines, zero deps, fully fixture-testable per D2 |

## Shared Contracts (`src/lib/contracts/`)

**`audit-result.ts`**: `AuditResult` Zod schema — `{ summary: { url, geoScore, severityBand, durationMs }, crawlers: <per-bot map + composite>, citability: { pageScore, coverage, top3/bottom3, suggestions[] }, schema: { detected: ParsedBlock[], issues, generated, businessType }, platform: { headers, meta, og, twitter, ssr, probes, perPlatform }, content: { experience/expertise/authoritativeness/trustworthiness (0-25 each), wordCount/headings/freshness/topicalAuthority }, scoringModelVersion, meta: { auditVersion, startedAt, completedAt, errors[] } }`.

**`fetch-types.ts`**: `ParsedPage { html, $, headers, finalUrl, charset, statusCode, contentType }`, `FetchResult` discriminated union (`{ ok: true, parsed: ParsedPage } | { ok: false, reason: 'unsupported_content_type', contentType } | { ok: false, error: FetchError }`), `FetchError { code: 'SSRF_BLOCKED' | 'TIMEOUT' | 'NETWORK_ERROR' | 'DNS_FAILURE' | 'HTTP_STATUS' | 'TOO_LARGE' | 'TOO_MANY_REDIRECTS', message }`, `RobotsTxt { groups: RuleGroup[], sitemaps: string[], crawlDelay: number | null }`.

**`url-input.ts`**: existing — reused as-is by orchestrator (RAO-1).

## Fetch Layer (`src/lib/fetch/`)

| File | Purpose |
|------|---------|
| `index.ts` | `fetchAuditResource(url, opts): Promise<FetchResult>` — public entry point |
| `ssrf.ts` | `assertPublicHost(hostname): Promise<void>` — DNS resolve + `isPrivateIp()` (exact range checks per D6) |
| `redirect.ts` | Manual redirect loop (≤5 hops, re-validate DNS per hop, reject scheme downgrades) |
| `charset.ts` | Resolve charset: Content-Type header → `<meta charset>` → UTF-8; decode via TextDecoder |
| `body-reader.ts` | Stream body with decoded-size cap (~5MB); abort if exceeded |

**Signature**: `fetchAuditResource(url: string, opts: { timeoutMs: number, kind: 'page' | 'probe', maxBytes: number, fetcher?: FetchImpl }): Promise<FetchResult>`. Default `timeoutMs`: 15000 for `'page'`, 10000 for `'probe'` (P4). Non-HTML Content-Type → `{ ok: false, reason: 'unsupported_content_type' }` per RFL-8.

**Injectable fetcher** (RFL-12, RAO-11): `fetcher` parameter defaults to global `fetch`. Tests inject a mock returning known fixtures — no network, no `vi.stubGlobal`.

## Engine Designs

All engines share this layout: `src/<domain>/index.ts` (public `score(input) → typedOutput`), `parse.ts` (DOM extraction), `score.ts` (algorithm), `types.ts` (Zod), `constants.ts` (weights/rubrics), `__fixtures__/`, `__tests__/`.

### Crawler Access Map (`src/crawlers/`)

- `bots.ts`: 17-bot registry (brief §8.2) — `{ userAgent, tier: Tier1 | Tier2 | Other, impact: Critical | High | Medium }[]`
- `robots-parser.ts`: `parseRobotsTxt(body: string): RobotsTxt` — RFC 9309 subset: case-insensitive, exact>`*`, longest-match, Allow-wins-ties, `$` anchor
- `access-map.ts`: `scoreAccess(robots: RobotsTxt, headers: Headers, $: CheerioAPI): CrawlerResult` — per-bot status + composite: Tier1×50% + Tier2×25% + no-blanket-block×15% + AI-files×10%

### Citability Engine (`src/citability/`)

- `extract.ts`: `extractMainContent($): Cheerio` — selectors: `article, main, [role="main"], .content` excluding `nav, footer, aside, .sidebar, .ads`
- `segment.ts`: `segmentBlocks($): ContentBlock[]` — H2/H3 segmentation, single-block fallback (RCI-13)
- `scorer.ts`: per-block 5-dim weighted scorer with documented step-by-step algorithms (definition patterns via regex `/is\s+a(n)?\s+/`, first-60-words, pronoun-lead `/^(It|This|That|These|Those)\b/`, 50-200 word band, 2-4 sentence paragraphs, stat regex `/[\d,.]+?\s*%|\$\s*[\d,]+|\b(?:20\d{2}|19\d{2})\b/`, uniqueness proxy phrases)
- `rewrite.ts`: template-based suggestion keys

### Schema Engine (`src/schema/`)

- `extract.ts`: `extractJsonLd($): RawBlock[]` — `<script type="application/ld+json">` blocks
- `parse.ts`: `parseBlocks(blocks): ParsedBlock[]` + per-block error collection (RSC-12)
- `registry.ts`: 8-type static registry (required + recommended props per type)
- `validate.ts`: type validation, `sameAs` check, deprecated flags (HowTo/FAQPage)
- `classify.ts`: `detectBusinessType($, blocks): BusinessType` — SaaS/local/ecommerce/publisher/agency/hybrid
- `generate.ts`: `generateCorrected(blocks, businessType): JsonLd` — gap-fill with TODO markers

### E-E-A-T Engine (`src/eeat/`)

- `experience.ts`: first-person patterns (`/^(we|our team|I)\b/i`), case-study phrase list
- `expertise.ts`: author byline (`.byline, [rel="author"], author` selectors), Person schema, domain-term density
- `authoritativeness.ts`: external citation count → authority-domain list match
- `trustworthiness.ts`: contact/privacy/ToS/HTTPS link detection, review section + disclosure patterns
- `meta.ts`: word count vs page-type benchmarks, heading hierarchy (skip detection per REE-6), freshness from DOM/meta/JSON-LD
- `index.ts`: returns `{ experience, expertise, authoritativeness, trustworthiness, composite, wordCount, headings, freshness, topicalAuthority: "not_measured" }`

### Platform Readiness (`src/platform/`)

- `headers.ts`: X-Robots-Tag, Content-Type, canonical Link, HSTS check
- `meta.ts`: title/description/viewport, OG, Twitter Cards
- `ssr.ts`: text-to-HTML ratio (≥500 chars visible text → "ssr_present", else "client_side_shell")
- `probes.ts`: `probeSitemap(origin)`, `probeLlmsTxt(origin)` — HEAD requests, yes/no
- `per-platform.ts`: 5-platform rubric — question headings, direct answers, tables/lists, FAQ section, dates, author byline (on-page only; external criteria labeled "not_measured")

### GEO Score Calculator (`src/scoring/`)

- `weights.ts`: `{ version: '1.0.0', weights: { citability: 31.25, eeat: 25, technical: 18.75, schema: 12.5, platform: 12.5 }, renormalizationNote: '...' }`
- `calculator.ts`: `computeGeoScore(engineScores, weights): GeoScoreResult` — weighted avg, round, cap 100, assign severity band (P3), handle missing engines (re-balance weights per RGS-9)
- Technical dimension: composed from `crawler.compositeScore × 0.6 + platform.onPageScore × 0.4` (no standalone technical engine)

### Orchestrator (`src/audit/`)

- `index.ts`: `runAudit(url: string, deps?: { fetcher?: FetchImpl, now?: () => number }): Promise<AuditResult>`
- Flow: Zod-validate (reuse `url-input.ts`) → resolve normalized `https://...` → `Promise.allSettled` parallel fetches (page 15s + robots.txt 10s + probes 10s each per P4) → shared Cheerio `load()` (once, per RAO-3) → run 5 engines (catch per-engine → `meta.errors`) → compute score → return `AuditResult`

## Concurrency, Errors, Test Strategy

**Concurrency**: 3 fetches in parallel (`Promise.allSettled` — page, robots.txt, probes batch). Engines run sequentially after fetch (they're CPU-bound, Cheerio is not thread-safe). Probe batch: sitemap + llms.txt in parallel via `Promise.all` (both 10s, independent).

**Error taxonomy**: Fetch returns typed `FetchResult` union (never throws). Engines return `{ status, score, ... }` | `{ status: "error", reason }` | `{ status: "unsupported", reason }` (never throw). Orchestrator catches and records.

**Test strategy**: Fixture-driven strict TDD. Fixture corpus needed:
- Robots: empty (RCR-10), 404, disallow-all (RCR-11), pathological case/unicode/latin-1 (RCR-3), Allow-tie, $ anchor, bot-specific
- Pages: normal article (RCI-1), malformed/unclosed tags (RCI-14), empty shell (RPL-5, RCI-14), French latin-1 (RFL-10), non-HTML (RFL-8/RFL-13), no-heading (RCI-13)
- JSON-LD: valid Organization, invalid JSON (RSC-12), multiple blocks (RSC-1), @graph mixed types (RSC-10), deprecated types (RSC-7), no ld+json (RSC-11)
- Headers: X-Robots-Tag (global + bot-scoped), canonical, HSTS
- Ethernet: SSRF rejects 127.0.0.1, 169.254.169.254, 10.x, 192.168.x, ::1 (D6)
- Mock boundary: injectable `FetchImpl` — engines never touch the network.

## Implementation Slicing (D5)

| # | Change | Modules | Files created | Indep. verification | Est. lines |
|---|--------|---------|---------------|---------------------|------------|
| 1 | `crawler-engine` | fetch, contracts | `src/lib/fetch/*`, `src/lib/contracts/{fetch-types,audit-result}.ts`, `src/crawlers/` | fetch + SSRF + robots + access map testable against fixture corpus | ~500-600 |
| 2 | `content-engines` | citability, eeat | `src/citability/`, `src/eeat/` | Both scoring engines testable with shared Cheerio fixtures | ~500-600 |
| 3 | `schema-engine` | schema | `src/schema/` | JSON-LD extract/parse/validate/generate against ld+json fixtures | ~400-500 |
| 4 | `platform-scoring` | platform, scoring, audit | `src/platform/`, `src/scoring/`, `src/audit/` | Full `runAudit(url)` with mocked fetch → deterministic AuditResult | ~500-600 |

Total ~1,900-2,300 authored lines across 4 chained changes. Each under 600-line review budget. Slices ordered by dependency: slice 1 provides fetch + contracts that 2-3-4 consume; slice 2 provides citability/eeat scores needed by scoring in slice 4.

## Threat Matrix

| Threat | Applicable | Expected safe behavior | RED test |
|--------|-----------|----------------------|----------|
| SSRF — internal IP | Yes | DNS resolve → reject private/link-local/reserved IPs; typed `SSRF_BLOCKED` error | `127.0.0.1`, `169.254.169.254`, `10.0.0.1`, `192.168.1.1`, `::1`, `fc00::1`, `fe80::1` all rejected |
| SSRF — redirect chain | Yes | Re-validate DNS at each hop (≤5); block chain if any hop resolves to private IP | Redirect chain to internal IP at hop 3 → blocked |
| SSRF — scheme downgrade | Yes | HTTPS-only; reject `http:` → block | `http://example.com` → `SSRF_BLOCKED` |
| Subprocess / shell injection | N/A | No subprocess/shell execution in audit engine | — |
| VCS/PR automation | N/A | No PR or VCS automation (apply phase only) | — |
| Executable-file classification | N/A | No file execution or binary classification | — |
| Process integration | N/A | Single-process Node; no child processes or external tooling | — |

## Risks (from proposal, with design-level mitigation)

| # | Risk | Design mitigation |
|---|------|-------------------|
| R1 | SSRF | `src/lib/fetch/ssrf.ts` with per-D6 range checks; per-hop re-validation; typed denial |
| R2 | HTML parsing correctness | Cheerio `load()` + malformed-HTML fixture corpus; engine `parse.ts` layers handle Cheerio recovery |
| R3 | Citability/E-E-A-T perceived validity | Documented step-by-step rubrics per engine `score.ts`; "heuristic" label in output; fixture calibration |
| R4 | robots.txt matching subtleties | `robots-parser.ts` RFC 9309 subset; pathological fixture tests (case, unicode, longest-match, Allow-tie) |
| R5 | Hostile pages | 15s timeout, 5MB decoded cap, Content-Type gate, graceful degradation (engines return partial) |
| R6 | Non-UTF-8 encoding | `charset.ts` resolution chain + TextDecoder; latin-1 fixture test |
| R7 | Datacenter IP blocking | GeoAudit UA header; fetch failures = typed errors, not audit crashes |
| R10 | Change size | 4 chained slices per D5, each ≤600 lines |

## Rollback

Each engine is a pure module; rollback = delete `src/<domain>/` + remove from orchestrator. No DB migrations. All under feature branch → squash-merge.
