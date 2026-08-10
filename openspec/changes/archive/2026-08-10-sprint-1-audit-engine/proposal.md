# Proposal: Sprint 1 — Core Audit Engine

**Change:** `sprint-1-audit-engine` · **Date:** 2026-08-06 · **Parent change** tracking 4 chained implementation changes.

## Intent

Build the deterministic, fixture-tested Core Audit Engine: SSRF-safe fetch layer, 5 domain engines (crawler access map, citability, schema, E-E-A-T, platform), GEO Score calculator, and a pure `runAudit(url)` orchestrator. No DB, no report UI (Sprint 2). Aligns with brief §17 Sprint 1 deliverables.

## Resolved Decisions

> All 10 exploration open questions resolved. User decisions P1-P5 are **product contract** (non-negotiable); remaining are **implementation** (recommendation with veto at review).

| ID | Decision | Rationale |
|----|----------|-----------|
| P1 | **Brand Authority**: renormalize 5 engines to sum 100 (citability 31.25 / E-E-A-T 25 / Technical 18.75 / Schema 12.5 / Platform 12.5). BA 20% re-enters later via brand scanner with `scoringModelVersion`. | No engine exists; placeholder 0 distorts scores. Renormalization is transparent and reversible. |
| P2 | **HTTPS-only**: normalize `http://` → `https://`; reject non-https URLs. | Reduces SSRF surface. Aligns with brief §7.1 "HTTPS preferido." |
| P3 | **Severity bands**: 90-100 Excellent / 75-89 Good / 60-74 Fair / 40-59 Poor / 0-39 Critical. | Product contract — consistent across all report surfaces. |
| P4 | **Timeouts**: 15s page fetch / 10s auxiliary probes. | Aligns with brief §16 P99 < 8s per audit (fetch is ~15s worst case, engines are CPU-fast). |
| P5 | **llms.txt + sitemap.xml**: informational presence probe only (HEAD request → yes/no). No parsing or generation. | Sprint 1 scope. Full parsing is platform-external-criteria work (Sprint 5+). |
| D1 | **Cheerio** as DOM parser. Pin `cheerio@^1.0`. | Real HTML needs a real parser. Regex rejected. htmlparser2 requires more custom tree code. Cheerio: mature, jQuery-style, 8kB, works in Node. |
| D2 | **robots.txt**: hand-rolled RFC 9309 subset (group select: exact token > `*`; longest-match; Allow wins ties; `$` anchor; case-insensitive). | Highly fixture-testable. Subset needed is ~150 lines. Avoids `robots-parser` dep risk and API skew. |
| D3 | **`AuditResult` shape** aligned with brief `AuditReport` Json fields: `{ summary, crawlers, citability, schema, platform, content, scoringModelVersion, meta }`. | Sprint 3 persistence maps 1:1. Define in `src/lib/contracts/audit-result.ts` (Zod). |
| D4 | **`scoringModelVersion`**: single weights config object + `version: "1.0.0"` field. Renormalization (P1) documented as v1.0.0 base. | Enables traceable weight evolution across sprints. |
| D5 | **Change split**: ONE parent change `sprint-1-audit-engine` tracking 4 chained implementation changes: `crawler-engine` → `content-engines` → `schema-engine` → `platform-scoring`. Spec/design/tasks written for all 4, applied in slices. | Treats Sprint 1 as one deliverable (brief §17). 400-line budget honored via chained PRs at apply phase. |
| D6 | **SSRF guard**: scheme whitelist `https` only. `dns.lookup` v4+v6 → reject private/link-local/reserved (10/8, 172.16/12, 192.168/16, 127/8, 169.254/16 incl. 169.254.169.254, 100.64/10, ::1, fc00::/7, fe80::/10). Port 443. Redirect re-validation per hop (≤5). TOCTOU documented acceptance. | CRITICAL risk. DNS-resolve + redirect-recheck covers the practical attack surface. |
| D7 | **Size/encoding**: decoded-size cap ~5MB. Content-Type gate: HTML only; non-HTML → per-engine "unsupported" result, not audit failure. Charset from Content-Type + `<meta>` fallback → TextDecoder. Latin-1 fixtures. | Prevents compression bombs, garble scores, audit crashes. |
| D8 | **Topical-authority**: excluded (single-page limit). Output field `topicalAuthority: "not_measured"` with rationale. Enters with multi-page crawl (Sprint 5). | Honest proxy — no fake precision. |

## Scope

**In scope:** SSRF-safe `src/lib/fetch/` layer + shared Zod contracts; 17-bot crawler access map (robots.txt parser + meta/X-Robots-Tag + Content-Signal informational, per brief §8.2 authoritative list); citability engine (H2/H3 segmentation, 5-dim scorer 30/25/20/15/10, top/bottom blocks, rewrite templates); schema engine (JSON-LD extract/parse/validate, 8-type registry, simplified business-type detection, corrected JSON-LD generation); E-E-A-T single-page subset (4×25, author/word-count/heading/freshness/trust; topical-authority excluded); platform on-page readiness (headers, meta/OG/Twitter, SSR detection, sitemap/llms.txt presence probes); GEO Score calculator (renormalized weights, 5 severity bands, `scoringModelVersion`); `runAudit(url)` orchestrator with injectable fetcher; strict-TDD fixture suites per engine.

**Out of scope:** DB persistence, report UI, rate limiting, brand mention scanner, llms.txt parsing/generation, real Core Web Vitals, multi-page crawling, auth changes.

## Capabilities

### New Capabilities
- `crawler-access-map`: 17-bot robots.txt + header analysis with tiered impact scoring.
- `citability-engine`: content segmentation + 5-dim block scoring + rewrite templates.
- `schema-engine`: JSON-LD extraction, validation against 8-type registry, corrected generation.
- `eeat-engine`: single-page E-E-A-T proxy scoring (4 dimensions × 25).
- `platform-readiness`: on-page header/meta/SSR/structure signals + sitemap/llms.txt probes.
- `geo-score-calculator`: weighted composite with 5-band severity labels and model versioning.
- `audit-fetch-layer`: SSRF-safe HTTP(S) fetch with timeout, size cap, encoding resolution.
- `audit-orchestrator`: `runAudit(url)` pure function composing all engines over shared inputs.

### Modified Capabilities
None.

## Approach

**Shared fetch layer** (`src/lib/fetch/`): wraps native `fetch` — scheme whitelist, DNS-resolve SSRF guard, AbortSignal.timeout (15s/10s), decoded-size cap, Content-Type gate, charset resolution, redirect chain ≤5. Injectable → fully testable.

**Per engine** (pure function over parsed inputs): each in `src/<domain>/` with `__fixtures__/`, typed Zod outputs, TDD-first. Crawler engine parses robots.txt (RFC 9309 subset) + checks headers/meta; citability segments main content via cheerio H2/H3; schema extracts `<script type="application/ld+json">` blocks, validates against static registry; E-E-A-T scores 4×25 from DOM signals; platform checks headers, detects SSR, probes sitemap/llms.txt.

**Orchestrator**: Zod-validate URL → parallel bounded fetches (page + robots.txt + probes via `Promise.allSettled`) → run engines over shared parsed inputs → compute weighted score → return typed `AuditResult`.

## Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | SSRF: internal IPs, cloud metadata | CRITICAL | D6 guards; TOCTOU documented |
| R2 | HTML parsing correctness (malformed HTML) | HIGH | Cheerio (real parser); malformed-HTML fixtures |
| R3 | Citability/E-E-A-T perceived validity | HIGH | Documented deterministic rubrics; "heuristic" label; calibration fixtures |
| R4 | robots.txt matching subtleties | HIGH | Hand-rolled subset with pathological fixture tests |
| R5 | Hostile pages (size bombs, slow servers) | MEDIUM | 15s abort; ~5MB cap; Content-Type gate; graceful degradation |
| R6 | Non-UTF-8 encoding garbling scores | MEDIUM | D7 charset resolution; latin-1 fixtures |
| R7 | Target sites blocking datacenter IPs | MEDIUM | GeoAudit UA header; failures = findings, not crashes |
| R8 | Brand Authority dimension gap **(resolved: P1)** | ~~HIGH~~ | Renormalized 5-engine weights; BA re-enters with versioned model |
| R9 | CWV not measurable **(resolved: exclude)** | ~~MEDIUM~~ | TTFB/size/compression/SSR as Technical proxies |
| R10 | Change size (~2,500+ lines) vs 400-line budget | MEDIUM | 4 chained changes; chained-pr slices; ask-on-risk gate |
| R11 | Bot registry drift (quarterly) | LOW | Single `bots.ts` registry; Content-Signal informational |
| R12 | Score stability across sprints | MEDIUM | `scoringModelVersion`; renormalization documented |

## Rollback Plan

Each engine is a pure module with no side effects. Revert: delete `src/<engine>/` + contracts + test files. Orchestrator is compositional — removing an engine only affects composite score. No DB migrations to roll back. All changes under feature branch → squash-merge to `develop`.

## Dependencies

- **cheerio** (`^1.0`) — new dep. Pin major. Zero native addons.
- **Existing:** Node 24 global `fetch`, `dns`, `TextDecoder`. Vitest + jsdom (already installed).
- **Downstream:** Sprint 2 (`sprint-2-free-audit-flow`) depends on `runAudit` + `AuditResult` contract.

## Success Criteria

- [ ] All 6 engines have ≥80% test coverage (fixture-driven, no network in test)
- [ ] `runAudit("https://example.com")` returns valid `AuditResult` in <8s (P99 target per brief §16)
- [ ] SSRF guard rejects 127.0.0.1, 169.254.169.254, 10.x, 192.168.x, ::1
- [ ] Non-HTML response → audit completes with per-engine "unsupported" results, not crash
- [ ] Malformed HTML fixture → citability/E-E-A-T produce scores (not throw)
- [ ] French/latin-1 fixture → correct char counts (Content-Type + meta fallback)
- [ ] `pnpm test && pnpm run lint && pnpm run typecheck` green
