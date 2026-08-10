# Exploration: Sprint 1 — Core Audit Engine

**Change:** `sprint-1-audit-engine` · **Phase:** explore · **Date:** 2026-08-06 · **Mode:** hybrid

## Executive Summary

Sprint 1 builds the **Core Audit Engine** as pure, deterministic, fixture-tested domain modules in `src/crawlers/`, `src/citability/`, `src/schema/`, `src/eeat/`, `src/platform/`, `src/scoring/` (screaming architecture per AGENTS.md), plus a shared SSRF-safe fetch layer and a pure `runAudit(url)` orchestrator that Sprint 2's Server Action will call — **no DB, no report UI**. The engine mirrors the consulting workflow: 17-bot crawler access map (brief §8.2 list is the authoritative product contract; the geo-crawlers skill enriches tier/impact data), 5-dimension citability scorer (30/25/20/15/10) over H2/H3-segmented content blocks, JSON-LD parse/validate/generate against an 8-type Schema.org registry, single-page E-E-A-T proxy scoring (4×25), on-page platform readiness, and a weighted composite GEO Score with the brief §8.1 weights.

Two scope gaps must be resolved in propose: **Brand Authority (20% weight) has no engine in Sprint 1** (recommend renormalizing the remaining 80%), and **Core Web Vitals are not measurable from a single server-side fetch** (exclude; use TTFB/size/compression/SSR as Technical proxies). Dependency additions are minimal and justified: **cheerio** for DOM parsing (regex on HTML is rejected as an anti-pattern) and a hand-rolled RFC 9309 robots.txt subset (or `robots-parser` as fallback). Full scope is ~2,500+ authored lines — well over the 400-line review budget — so it must ship as **4 chained changes**, each reviewed in slices via the chained-pr skill.

## Current State

- Sprint 0 archived (`openspec/changes/archive/2026-08-06-sprint-0-setup-scaffold/`). Branch `develop`, clean. `pnpm dev`/`test`/lint/typecheck green, **strict TDD active** (`openspec/config.yaml`: `strict_tdd: true`).
- **Zero domain code.** `src/` contains only: `app/**` (routing + auth handler + dashboard shell), `lib/{auth,auth-guard,prisma,contracts/url-input}.ts`, generated Prisma client, tests.
- **Deps:** no scraping/parsing libraries (no cheerio, htmlparser2, robots-parser, undici). Global `fetch` available (Node 24). `jsdom` 30 is a devDependency (test env). Vitest configured with `@/* → ./src` alias, jsdom env, `src/test/setup.ts`.
- Brief §17 Sprint 1 bullets: Crawler Access Map, Citability Engine, Schema Engine (parser + validator + **generator**), Content E-E-A-T Engine, Platform Engine, GEO Score Calculator.

## Domain Understanding per Engine (from skills + brief §8)

### Crawler Access Map (`src/crawlers/`)
Brief §8.2 defines **17 user agents** (GPTBot, CCBot, anthropic-ai, Claude-Web, Googlebot, Google-Extended, Bingbot, PerplexityBot, Applebot-Extended, meta-externalagent, cohere-ai, Bytespider, Omgili, Omgilibot, ImagesiftBot, Diffbot, FacebookBot) — *authoritative for the product*; geo-crawlers skill adds tier semantics (Tier 1 critical: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot), impact labels, and the scoring rubric (Tier1 50% / Tier2 25% / no-blanket-block 15% / AI files 10%). Per-bot output: `Allowed | Blocked | Not Mentioned` + matched rule + `Critical/High/Medium` impact. Inputs: robots.txt body+status, page `X-Robots-Tag` header (incl. bot-scoped values), meta robots (`noindex/nofollow/noai/noimageai` + bot-specific). Also parse `Crawl-delay`, `Sitemap`, and `Content-Signal:` (IETF draft — informational).

### Citability (`src/citability/`)
Brief §8.3 = skill rubric verbatim: segment main content (exclude nav/footer/sidebar/ads) by **H2/H3 into blocks**; per block compute 5 sub-scores:
- Answer Block Quality **30%** (definition patterns "X is…", answer in first 1-2 sentences, first-60-words standalone)
- Self-Containment **25%** (explicit subject, no pronoun-lead, 50-200 word band)
- Structural Readability **20%** (clean H1>H2>H3, 2-4 sentence paragraphs, tables/lists, question headings)
- Statistical Density **15%** (≥1 concrete stat per 500 words: percentages, $, dates, named sources)
- Uniqueness **10%** (original-data phrases "we surveyed…", first-person — *proxy only*)

Page score = mean of block scores; outputs top 3 / bottom 3 blocks + citability coverage (% blocks ≥ 70) + template-based rewrite suggestions.

### Schema (`src/schema/`)
Extract all `<script type="application/ld+json">` blocks via DOM (parse raw HTML, never markdown-stripped content), `JSON.parse` each (collect all, tolerate per-block errors), validate `@type` against a static registry — Organization, LocalBusiness, Article/Person, Product, FAQPage, WebSite+SearchAction, BreadcrumbList, SoftwareApplication — with required/recommended property tables per type, `sameAs` presence check, deprecated-schema flags (HowTo/FAQPage rich-result changes), and **generation of corrected JSON-LD** via per-business-type templates. Simplified business-type detection (SaaS/local/ecommerce/publisher/agency/hybrid) from on-page signals.

### Content E-E-A-T (`src/eeat/`)
4 dimensions × 25 points, **single-page subset**: Experience (first-person language, case-study patterns), Expertise (author byline/bio, author schema, technical-depth proxy), Authoritativeness (external source citations to authority domains, author `sameAs` — degraded proxy), Trustworthiness (contact info, privacy policy/ToS links, HTTPS, review/testimonial + disclosure patterns). Plus word count vs. page-type benchmarks, heading depth/skips, freshness (datePublished/dateModified). Topical-authority modifier (+10/-5) is **not computable on one page → exclude**, noted in output.

### Platform (`src/platform/`)
Header checker (X-Robots-Tag, Content-Type, canonical self-reference) + meta analyzer (title/description/viewport, Open Graph, Twitter Cards) + **SSR detection** (meaningful content in raw HTML vs. empty shell) + presence probes (sitemap.xml, llms.txt — *informational only*). Per-platform rubrics are mostly **external-presence criteria** (Wikipedia, Reddit, YouTube, Bing WMT, IndexNow) that a single fetch cannot see — Sprint 1 computes the **on-page readiness subset** (question headings, direct answers after headings, tables/lists, FAQ section, visible dates, author byline) for the 5 platforms (AIO, ChatGPT, Perplexity, Gemini, Copilot), explicitly labeling external criteria "not measured" (arrives with the brand-mention scanner later).

### GEO Score Calculator (`src/scoring/`)
Brief §8.1 weights: AI Citability **25%**, Brand Authority **20%**, Content E-E-A-T **20%**, Technical GEO **15%** (AI crawler access + SSR + headers + TTFB/size/compression proxies; **no CWV**), Schema **10%**, Platform **10%**. Rounded, capped 100. Severity label = 5-band rating (90-100 Excellent / 75-89 Good / 60-74 Fair / 40-59 Poor / 0-39 Critical) + findings tagged Critical/High/Medium/Low. Technical dimension is *composed* from crawler + platform sub-signals (no standalone technical engine). Weights live in one config with a `scoringModelVersion` for future changes.

### Orchestrator (`runAudit(url)`)
Pure function: Zod-validate URL → parallel bounded fetches (page + robots.txt + optional probes, `Promise.allSettled`) → run engines over shared parsed inputs → compute score → return a typed, JSON-serializable `AuditResult` shaped to match the future `AuditReport` Json columns. Injectable fetcher → fully unit-testable without network. Sprint 2 wires it into the Server Action + report page.

## Technical Approaches + Tradeoffs

| Concern | Recommendation | Alternatives (rejected/unused) |
|---|---|---|
| Fetch layer | Native `fetch` + wrapper (AbortSignal.timeout, streamed body read to cap decoded bytes ~5MB, manual redirects ≤5, 30s abort) | undici Agent/interceptor (extra dep) |
| SSRF guard | Scheme whitelist (https; http → open question), `dns.lookup` v4+v6 → reject private/link-local/reserved (10/8, 172.16/12, 192.168/16, 127/8, 169.254/16 incl. 169.254.169.254, 100.64/10, ::1, fc00::/7, fe80::/10), ports 80/443, redirect re-validation per hop. Known TOCTOU gap accepted at MVP | — |
| DOM parsing | **cheerio** (mature, jQuery-style selectors, tiny, works in Node; jsdom stays test-only) | htmlparser2 (more custom tree code); regex (rejected — HTML isn't regular) |
| JSON-LD | `JSON.parse` per `ld+json` block; static type/property registry config | live schema.org dump |
| robots.txt | Hand-rolled RFC 9309 subset (group select: exact token > `*`; longest-match; Allow wins ties; `$` anchor; case-insensitive) — highly fixture-testable | `robots-parser` (battle-tested, API skew) |
| Concurrency | 2-3 parallel fetches (`Promise.allSettled`), page 30s (brief §7.1) / probes ~10s. No crawl loop (Sprint 5). | — |
| Engine architecture | Each engine = pure function over parsed inputs → typed score + findings; fixtures in `src/<domain>/__fixtures__/`; network isolated behind injectable fetcher; strict TDD pins exact values | — |

## Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | SSRF: user-supplied URL fetched server-side (internal IPs, cloud metadata, DNS rebinding) | CRITICAL | Scheme whitelist; DNS-resolve + reject private/reserved; port restrict; redirect re-validation (≤5 hops); 30s abort; documented TOCTOU acceptance |
| R2 | HTML parsing correctness (regex mis-parses real-world HTML) | HIGH | Real parser (cheerio); fixture corpus incl. malformed HTML |
| R3 | Citability/E-E-A-T perceived validity (heuristics produce surprising scores; Uniqueness & Authoritativeness unmeasurable on one page) | HIGH | Deterministic documented rubrics; proxy-signal design explicit; output labeled "heuristic"; calibration fixtures; no fake precision |
| R4 | robots.txt semantics (RFC 9309 matching subtleties) | HIGH | Hand-rolled subset with dedicated fixture tests incl. pathological files, or `robots-parser` |
| R5 | Timeouts/size/hostile pages (huge pages, compression bombs, slow servers) | MEDIUM | 30s page/10s aux aborts; decoded-size cap (~5MB); Content-Type gate (HTML only; PDF/image → graceful "unsupported" per-engine result, not audit failure) |
| R6 | Encoding: non-UTF-8 pages garble text → wrong counts/scores | MEDIUM | Charset from Content-Type (+ meta fallback), TextDecoder; latin-1 fixtures |
| R7 | Target sites blocking datacenter IPs (403/Cloudflare) | MEDIUM | GeoAudit UA header; failures become status findings, not crashes; retry once |
| R8 | Brand Authority dimension gap (20% weight, no engine) | HIGH (product) | Renormalize remaining 80% (recommended) vs. fixed weights + 0 placeholder → **open question**; keep `scoringModelVersion` |
| R9 | CWV not measurable server-side | MEDIUM | Exclude; Technical = crawler access + SSR + headers + TTFB/size/compression proxies; documented |
| R10 | Change size vs 400-line budget (~2,500+ authored lines total) | MEDIUM | 4 chained changes; chained-pr review slices; ask-on-risk gate honored |
| R11 | Bot registry drift (lists evolve quarterly) | LOW | Single `src/crawlers/bots.ts` registry; one-file updates; Content-Signal informational |
| R12 | Score stability across sprints (brand scanner lands later) | MEDIUM | Weights + rubric versioning (`scoringModelVersion`); renormalization decision documented |

## Open Questions (for propose to resolve with the user)

1. **Brand Authority weight**: renormalize the 5 available engines to sum 100 (recommended) or keep fixed weights with Brand Authority = 0/"not measured"?
2. **DOM parsing dependency approval**: cheerio (recommended, justified) vs htmlparser2 vs zero-dep hand-rolled?
3. **robots.txt**: hand-rolled RFC 9309 subset (recommended) vs `robots-parser`?
4. **http:// allowed or https-only?** https-only lowers SSRF surface — confirm MVP stance.
5. **llms.txt**: confirm **non-goal** (only an informational presence probe)?
6. **Sitemap.xml**: informational presence check only, or skip entirely in Sprint 1?
7. **Schema generation depth**: full corrected JSON-LD for all detected business types now, or minimal (Organization + WebSite + detected-type)?
8. **Severity bands**: adopt the skill's 5-band rating (90+/75+/60+/40+/0-39) as the product contract?
9. **Page timeout calibration**: brief says 30s but §16 P99 < 8s — confirm target (e.g. 15s page / 10s probes)?
10. **AuditResult JSON shape**: align now with brief's AuditReport Json fields so Sprint 3 persistence maps 1:1 — confirm?

## Scope Recommendation

**In scope:** SSRF-safe fetch layer + shared types/contracts; 17-bot crawler access map (robots.txt parser + meta/X-Robots-Tag checks + Content-Signal informational); citability engine (extraction, segmentation, 5-dim scorer, top/bottom blocks, rewrite templates); schema engine (JSON-LD extraction/parse/validate/generate, business-type detection simplified); E-E-A-T single-page subset (author/word-count/heading/freshness/trust signals); platform on-page readiness (headers, meta/OG/Twitter, SSR detection, structure signals, sitemap/llms.txt informational probes); GEO Score calculator (weights + severity bands + `scoringModelVersion`); pure `runAudit(url)` orchestrator with injectable fetcher; strict-TDD fixture suites per engine.

**Out of scope (non-goals):** DB persistence of audits/reports (Sprint 2-3); report UI (Sprint 2); rate limiting (Sprint 2); brand mention scanner / external-presence data; **llms.txt parsing/generation**; real Core Web Vitals; multi-page crawling (Sprint 5); backoffice/auth changes.

**Change split (recommended — 4 chained changes, each ~500-900 authored lines incl. tests):**
1. `crawler-engine` — fetch layer + SSRF guard + robots parser + bot registry + crawler access map (foundation, first consumer).
2. `content-engines` — main-content extraction/segmentation + citability + E-E-A-T.
3. `schema-engine` — JSON-LD parse/validate/generate + business-type detection.
4. `platform-scoring` — platform engine + GEO Score calculator + `runAudit` orchestrator.

Each is independently verifiable; ordering respects dependencies. If any change's tasks-phase estimate exceeds ~600 authored lines, split further (chained-pr skill available).

**Rough size estimate:** total ~2,400-3,000 authored lines (engines + shared infra ≈ 1,200-1,400; fixtures/tests ≈ 1,200-1,600). Single change = **not viable** (6× review budget).
