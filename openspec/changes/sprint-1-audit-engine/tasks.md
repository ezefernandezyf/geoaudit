# Tasks: Sprint 1 — Core Audit Engine (sprint-1-audit-engine)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2,595 authored (code + tests + hand-written fixtures; excludes lockfile) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 8 chained PRs (2 per D5 slice) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain (decided 2026-08-06) |

**Decision needed before apply: Yes** · Chained PRs recommended: Yes · 400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| U1 (T1-T7) | Fetch layer + shared contracts | PR 1 (~410) | `pnpm test src/lib/fetch src/lib/contracts` | N/A — pure modules, mocked FetchImpl, zero network | Revert `src/lib/fetch/` + 2 contract files |
| U2 (T8-T10) | Crawler access map | PR 2 (~335) | `pnpm test src/crawlers` | N/A — pure parser over robots fixtures | Revert `src/crawlers/` |
| U3 (T11-T14) | Citability engine | PR 3 (~380) | `pnpm test src/citability` | N/A — Cheerio fixture pages | Revert `src/citability/` |
| U4 (T15-T16) | E-E-A-T engine | PR 4 (~300) | `pnpm test src/eeat` | N/A — fixture pages | Revert `src/eeat/` |
| U5 (T17-T20) | Schema engine | PR 5 (~400) | `pnpm test src/schema` | N/A — ld+json fixtures | Revert `src/schema/` |
| U6 (T21-T23) | Platform readiness | PR 6 (~330) | `pnpm test src/platform` | N/A — header/meta fixtures | Revert `src/platform/` |
| U7 (T24) | GEO Score calculator | PR 7 (~180) | `pnpm test src/scoring` | N/A — pure math | Revert `src/scoring/` |
| U8 (T25) | Orchestrator runAudit | PR 8 (~260) | `pnpm test src/audit` | N/A — mocked fetch; P99 via wall-clock fixture test | Revert `src/audit/` + engine wiring |

**Global acceptance (all tasks)**: write failing test FIRST (strict TDD, config.yaml) → implement → `pnpm test` green + `pnpm run typecheck` + `pnpm run lint` pass. Zero network in tests.

## Slice 1 — crawler-engine (~745; sub 1a T1-T7=410, 1b T8-T10=335)

- [x] T1 [1] Install cheerio@^1.0 (`pnpm add cheerio`) | no reqs (D1) | RED: N/A (config) | deps: none | ~5
- [x] T2 [1] Contracts: `src/lib/contracts/fetch-types.ts` + `audit-result.ts` (+tests) | RFL-8/11, RCR-7, RGS-7/8, RAO-10 | RED: AuditResult fixture parses; FetchResult union discriminates | T1 | ~85
- [x] T3 [1] SSRF guard: `src/lib/fetch/ssrf.ts` | RFL-2, RFL-3 | RED: IP matrix — 127.0.0.1/169.254.169.254/10.x/192.168.x/::1/fc00::1/fe80::1 rejected, 93.184.216.34 passes | T2 | ~80
- [x] T4 [1] Redirect loop: `src/lib/fetch/redirect.ts` | RFL-6, RFL-2(redirect) | RED: 3-hop chain OK; 6-hop → TOO_MANY_REDIRECTS; hop→private IP → SSRF_BLOCKED | T2,T3 | ~60
- [x] T5 [1] Charset: `src/lib/fetch/charset.ts` | RFL-9, RFL-10 | RED: latin-1 "réseau électrique" 1-char decode; header/meta/default paths | T2 | ~50
- [x] T6 [1] Body reader: `src/lib/fetch/body-reader.ts` | RFL-7 | RED: >5MB stream aborted → TOO_LARGE | T2 | ~50
- [x] T7 [1] Fetch API: `src/lib/fetch/index.ts` | RFL-1, RFL-4/5, RFL-8, RFL-11, RFL-12 | RED: mock fetcher; http→https; ftp rejected; PDF → unsupported_content_type; timeout → TIMEOUT | T3-T6 | ~80
- [x] T8 [1] Bot registry: `src/crawlers/bots.ts` | RCR-1 | RED: 17 unique agents w/ tier+impact; 5 Tier1 Critical | T2 | ~45
- [x] T9 [1] robots parser: `src/crawlers/robots-parser.ts` | RCR-2, RCR-3, RCR-7, RCR-10, RCR-11 | RED: pathological fixtures — exact>wildcard, Allow-tie, $ anchor, case-insensitive, longest-match, empty/404, disallow-all | T2 | ~160
- [x] T10 [1] Access map: `src/crawlers/access-map.ts` + `index.ts` | RCR-4, RCR-5, RCR-6, RCR-8, RCR-9, RCR-11 | RED: all-allowed → 100; GPTBot blocked → reduced; X-Robots-Tag global/bot-scoped; meta noai; disallow-all + bot-specific Allow | T8,T9 | ~130

## Slice 2 — content-engines (~680; sub 2a T11-T14=380, 2b T15-T16=300)

- [x] T11 [2] Extract: `src/citability/extract.ts` | RCI-1, RCI-14 | RED: article vs nav/footer/aside excluded; div-only → largest div; malformed no-throw; empty → score 0 | T1 | ~90
- [x] T12 [2] Segment: `src/citability/segment.ts` | RCI-2, RCI-13 | RED: 4×H2 → 4 blocks; H2+H3 → 3 blocks; no-heading → single block | T11 | ~70
- [x] T13 [2] Scorer: `src/citability/scorer.ts` + `constants.ts` | RCI-3..RCI-9 | RED: definition ≥70; pronoun-lead <30; stats-rich ≥70; stats-poor ≤10; weighted avg 30/25/20/15/10 | T12 | ~140
- [x] T14 [2] Output: `src/citability/rewrite.ts` + `index.ts` | RCI-10, RCI-11, RCI-12 | RED: top3/bottom3 exact; coverage %; bottom block → template key | T13 | ~80
- [x] T15 [2] E-E-A-T dims: `src/eeat/{experience,expertise,authoritativeness,trustworthiness}.ts` | REE-1..REE-4 | RED: first-person ≥15; third-person ≤5; byline+schema ≥15; no-author ≤5 + no_author_detected; tech-depth ≥5; trust ≥18; no-legal ≤8 | T1 | ~160
- [x] T16 [2] E-E-A-T meta+composite: `src/eeat/meta.ts` + `index.ts` | REE-5..REE-10 | RED: clean H1→H2→H3; H1→H3 → H2_skipped; datePublished + days-since; no-date; topicalAuthority not_measured + rationale; composite = sum | T15 | ~140

## Slice 3 — schema-engine (~400)

- [x] T17 [3] Extract+parse: `src/schema/extract.ts` + `parse.ts` | RSC-1, RSC-2, RSC-12 | RED: 2 blocks preserved exactly; zero → no_structured_data; invalid JSON → warning+index, no throw | T1 | ~110
- [x] T18 [3] Registry+validate: `src/schema/registry.ts` + `validate.ts` | RSC-3..RSC-7, RSC-10 | RED: known type clean; unknown flagged + still included; @graph per-node; sameAs valid/missing; HowTo/FAQPage deprecated | T17 | ~140
- [x] T19 [3] Business type: `src/schema/classify.ts` | RSC-8 | RED: SaaS signals → SaaS; ecommerce signals → ecommerce | T17 | ~60
- [x] T20 [3] Generate+index: `src/schema/generate.ts` + `index.ts` | RSC-9, RSC-11 | RED: Org missing url → TODO marker + props preserved; zero JSON-LD + local → LocalBusiness template; clean empty result | T18,T19 | ~90

## Slice 4 — platform-scoring (~770; sub 4a T21-T23=330, 4b T24=180, 4c T25=260)

- [x] T21 [4] Headers+meta: `src/platform/headers.ts` + `meta.ts` | RPL-1..RPL-4 | RED: complete headers no warnings + HSTS; missing canonical → Low; OG full/absent → High; twitter:card; title/desc/viewport | T2 | ~120
- [x] T22 [4] SSR+questions: `src/platform/ssr.ts` | RPL-5, RPL-8, RPL-9 | RED: ≥500 chars → ssr_present + ratio; <100 → client_side_shell Critical; question-H2 count; answer `<p>` detected | T1 | ~90
- [x] T23 [4] Probes+platforms: `src/platform/probes.ts` + `per-platform.ts` + `index.ts` | RPL-6, RPL-7, RPL-10, RPL-11 | RED: HEAD 200 → present, no parse; 404 → absent + Low findings; AIO-ready ≥70; external signals not_measured | T7,T21,T22 | ~120
- [ ] T24 [4] Calculator: `src/scoring/weights.ts` + `calculator.ts` | RGS-1..RGS-10 | RED: all-80 → 80; uneven → 68; 92.3→Excellent; 73.8→Fair; 39→Critical; 103→100; schema-fail rebalance+note; empty → valid not NaN; version 1.0.0 + BA note | T2 | ~180
- [ ] T25 [4] Orchestrator: `src/audit/index.ts` | RAO-1..RAO-14 | RED: mock-fetch full audit → deterministic AuditResult, zero network; invalid URL → Zod error, no fetch; robots 404 → all allowed; citability-throws → isolation + meta.errors; PDF → 4 unsupported + crawler runs; single Cheerio load | T7,T10,T14,T16,T20,T23,T24 | ~260

## Slice Mapping (D5 apply order T1→T25; chain via work units)

| Slice | Tasks | Est. | Deps | Indep. verification |
|-------|-------|------|------|---------------------|
| 1 crawler-engine | T1-T10 (745; sub 1a T1-T7=410, 1b T8-T10=335) | 745 | none → self-contained | SSRF matrix + robots fixtures all green w/o other slices |
| 2 content-engines | T11-T16 (680; sub 2a T11-T14=380, 2b T15-T16=300) | 680 | T1 (cheerio), contracts shape | Citability/EEAT scores over shared fixture pages |
| 3 schema-engine | T17-T20 | 400 | T1 | JSON-LD extract→generate pipeline on ld+json fixtures |
| 4 platform-scoring | T21-T25 (770; sub 4a T21-T23=330, 4b T24=180, 4c T25=260) | 770 | T2, T7; engine outputs for T25 | Full runAudit with mocked fetch → deterministic AuditResult |

## Risks

- R10 size: ~2,595 authored total; every slice >400 → chained PRs mandatory; ask-on-risk → decision needed before apply.
- Chain strategy `pending`: orchestrator must ask user (stacked-to-main vs feature-branch-chain); child PR bases must be set to previous PR branch, else diff leaks.
- Strict TDD: apply must follow T1→T25; each task commits as RED→GREEN; skipping RED violates config strict_tdd.
- T25 needs a citability-throw edge fixture (RAO-12) — build in T11 corpus.
- cheerio@^1.0 may trigger `pnpm approve-builds` prompt; pin major (D1).
- Fixture corpus is hand-authored (counts in 2,595), not golden-generated.
