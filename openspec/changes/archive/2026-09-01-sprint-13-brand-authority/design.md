# Design: Sprint 13 — Brand Authority (6º engine) + Polish landing

## Context

Relevy scores GEO visibility across 5 engines (crawler 20% / citability 28% / eeat 24% / schema 14% / platform 14%, v2.0.0). Brand Authority — the 6th dimension declared at 20% in brief §8.1 — was renormalized *out* of v2.0.0 because no engine measured it. 24 external criteria in `src/platform/per-platform.ts` are `not_measured` ("Requires brand-mention scanner"). This change adds a keyless Wikipedia/Wikidata engine, re-enters the brand dimension at v3.0.0 (22.4/19.2/16/11.2/11.2/20), wires 4 of those criteria to measured, and polishes the landing for citability.

Key facts verified in code: `computeGeoScore` already rebalances (RGS-9); `weights.weights` is `Record<DimensionKey, number>`; the contract `auditResultSchema` pins `z.literal("2.0.0")`; persistence reads `audit.result as unknown as AuditResult` **without Zod re-parse** (PDF route, domain-metrics) — so no data migration, only contract tolerance + presenter honesty; `rowScore` has a `default: return 0` trap; `fetchAuditResource` gates content-type to HTML so the brand engine needs its own JSON fetch.

## Architecture Decisions

### Decision 1 — Domain shape `src/brand/` (mirrors `src/schema/` + `src/platform/`)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Single `index.ts` | Unreadable for 4 concerns | No |
| `types.ts` + `probes.ts` + `scoring.ts` + `index.ts` | Matches schema/platform split; probes (network) separated from scoring (pure) | **Yes** |
| Reuse `fetchAuditResource` | It gates content-type to HTML and returns parsed HTML; Wikipedia/Wikidata return JSON | No — build a JSON fetch in `probes.ts` |

`probes.ts` reuses the fetch-layer primitives `assertPublicHost` (SSRF) + `followRedirects` (redirect/timeout) with an injectable `fetcher`/`lookup` (same `FetchImpl`/`LookupFn` contract), then `response.json()`. No axios, no new content-type gate in the shared layer.

### Decision 2 — Brand composite formula (BRA-5, trace `geo-brand-mentions`)

The skill weights **Wikipedia 20%** of the total brand authority and gives a Wikipedia rubric (0-100) whose floor for "article exists" is the 50-69 band, with Wikidata completeness layered on top. MVP signals are the 3 machine-checkable ones. Hard gate first:

```
if (!entityPresence) return 0            // BRA-5; skill "0-9 no presence" band

score = presence(60) + completeness(25) + consistency(15)
presence        = 40 base (article exists) + 20 if title is not "(disambiguation)"
completeness    = 10 entity found + 5 description + 5 official-website(P856) matches domain + 5 if claimCount ≥ 10
consistency     = 15 if Wikipedia title AND Wikidata label normalize-match brand; 7 if one matches; else 0
```

This honors the proposal's 60/25/15 split (the 60 decomposed into presence 40 + title-quality 20), sums to 100, and every sub-signal traces to BRA-3/BRA-4 and the skill's Wikipedia bands. Normalization: lowercase, strip legal suffixes (ltd/llc/inc/srl/sl/sa/corp), strip punctuation. Brand name derived from domain (`relevy.app` → `relevy`).

### Decision 3 — Wikidata entity-type filter (BRA-2)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Accept any `wbsearchentities` top hit | False positives on same-name people | No |
| Name-only match | Rejected by BRA-2 | No |
| Label/description OR P856 domain match, **plus** P31 instance-of gate | Needs `wbgetentities` claims (rides R3, no extra request) | **Yes** |

Accept when the candidate's P31 ∈ {Q43229 organization, Q4830453 business, Q783794 company, Q6881511 enterprise (+ subclasses)}. Reject Q5 (human) and Q95074 (fictional character). When P31 is absent (bare entity), accept only on P856 official-website domain match — the strongest disambiguation signal (BRA-2 scenario). Final QID set is validated against `wbgetentities` at impl.

### Decision 4 — Contract `brandAuthorityResultSchema` (BRA-6)

```ts
brandAuthorityResultSchema = z.object({
  status: z.enum(["success", "error"]),
  reason: z.string().nullable(),                  // null on success; rate-limit/timeout/block reason on error
  score: z.number().min(0).max(100),
  signals: z.object({
    entityPresence: z.boolean(),
    entityConsistency: z.boolean(),
    wikidataCompleteness: z.number().min(0).max(100),
  }),
  entity: z.object({
    wikipediaTitle: z.string().nullable(),
    wikidataId: z.string().nullable(),            // Q-number or null
    wikidataLabel: z.string().nullable(),
  }),
});
```

`auditResultSchema` gains `brandAuthority: brandAuthorityResultSchema.optional()` (optional so legacy 2.0.0 rows validate) and `scoringModelVersion: z.union([z.literal("2.0.0"), z.literal("3.0.0")])`. `emptyBrandResult(reason)` returns `{ status: "error", reason, score: 0, signals: {false,false,0}, entity: {null,null,null} }`.

### Decision 5 — Scoring v3 (RGS-1/7/8/11)

`GEO_SCORE_V3_WEIGHTS`: `citability 22.4, eeat 19.2, technical 16, schema 11.2, platform 11.2, brand_authority 20` (sum 100, citability dominant). `DimensionKey` += `"brand_authority"`; `DIMENSIONS` += `"brand_authority"`. `GeoScoreWeights.weights` becomes `Partial<Record<DimensionKey, number>>` (historical SPRINT_1/V2 keep 5 keys — brand absent = "renormalized out"); the calculator's two reduces gain `?? 0` guards. `computeGeoScore` maps `brand_authority` into `dimensions`, `failures.brand_authority`, and adds a `"brand 0: no external presence"` note when measured 0 (RGS-11). Default weight param → `GEO_SCORE_V3_WEIGHTS`.

### Decision 6 — Derivation + presenters (APT-6/11)

- `DOMAIN_ROWS` += `{ engine: "brand", label: "Autoridad de marca" }`.
- Add `deriveBrandScore(result): number | null` → `null` when `brandAuthority` absent **or** `status !== "success"`; else the score.
- `CategoryScore.score` becomes `number | null` (matches existing `PlatformRow.readiness: number | null` pattern). `null` renders "No medido" (weight still shown). `ENGINE_WEIGHT` points at V3 (`brand → 20`), `CATEGORY_DESCRIPTION` += brand entry. `rowScore`'s `default: return 0` stays for the 5 on-page rows; the adapter reads the brand row via `deriveBrandScore`, never `rowScore`'s default (APT-11).

### Decision 7 — Persistence migration (RAO-16)

No DB migration: rows persist as JSONB and are read via `as unknown as AuditResult` (no re-parse). Migration = contract tolerance: union literal + optional `brandAuthority`. New audits write `"3.0.0"` + `brandAuthority`. Legacy 2.0.0 rows → presenters render brand row "No medido".

### Decision 8 — `not_measured` → brand wiring (RPL-11)

Platform stays the owner of its criteria. `per-platform.ts` gains a pure `applyBrandCriteria(platforms, brandSignals)` that flips exactly 4 keys to `measured` and sources points from brand signals: `chatgpt.wikipedia`(15) `entityPresence?15:0`, `chatgpt.wikidata`(10) `wikidataId?10:0`, `chatgpt.entity_consistency`(5) `entityConsistency?5:0`, `perplexity.wikipedia_wikidata`(5) `entityPresence?5:0`. Remaining external criteria keep `not_measured` with the v3 TODO note. The orchestrator calls this on the **rich** `PlatformEngineResult` before `platformToContract`. Brand points land in `chatgpt`/`perplexity` — **not** `aio`, which feeds the platform dimension — so there is no double-counting with the 20% brand dimension.

### Decision 9 — Orchestrator integration (RAO-3/12/15)

`EngineName`/`EngineRun`/`AuditDeps` gain `brand`. The engine runs on **every** audit (anonymous included) with `target.hostname` (not the DOM — RAO-3). `await scoreBrandEngine(domain, { fetcher, lookup })` in its own try/catch; on failure → `brandAuthority = emptyBrandResult(reason)` + `meta.errors` `brand: {reason}` + `brand_authority: null` into `computeGeoScore` (RGS-9). `auditUnsupportedPage` becomes async and also runs brand (domain-only).

### Decision 10 — Landing polish (LND-11/13/14)

Copy lives in `copy.ts`, structure in `page.tsx`. Changes: hero subtitle + FAQ "¿Qué es el GEO Score?" updated to **6 dimensiones** with the new weights (truthfulness); add `features[5]` "Autoridad de marca" card (20%, Wikipedia/Wikidata signals, 50-200 words); add a 6th FAQ question (≥5 recognizable); add a comparison `<table>` (Relevy vs auditoría manual/tradicional) with real product facts only; question-form H2/H3 on key sections; dates/byline already present. `SCOREHERO_EVIDENCE` regenerated via `pnpm verify:scorehero` (6 categoryScores, real audit — never hand-authored).

## Components / Files

| File | Action | Responsibility |
|------|--------|----------------|
| `src/brand/types.ts` | Create | `BrandEngineResult`, `BrandSignals`, `Entity`, `BrandAuthorityResult` re-export |
| `src/brand/probes.ts` | Create | Wikipedia search + Wikidata search + `wbgetentities` (≤4 req, SSRF/redirect reuse, injectable fetcher) |
| `src/brand/scoring.ts` | Create | Composite formula, disambiguation + P31 filter, name normalization |
| `src/brand/index.ts` | Create | `scoreBrand(domain, opts)`, `toContractResult`, `emptyBrandResult` |
| `src/brand/__fixtures__/*.json` | Create | Mock Wikipedia/Wikidata responses (deterministic) |
| `src/lib/contracts/audit-result.ts` | Modify | `brandAuthorityResultSchema`, optional field, version union |
| `src/scoring/weights.ts` | Modify | `GEO_SCORE_V3_WEIGHTS`, `brand_authority` key, `Partial` weights, v3 note |
| `src/scoring/calculator.ts` | Modify | 6th dimension, brand=0 note, `?? 0` guards, default V3 |
| `src/scoring/index.ts` | Modify | Export `GEO_SCORE_V3_WEIGHTS` |
| `src/audit/index.ts` | Modify | 6th engine, `emptyBrandResult`, brand→platform bridge, async unsupported path |
| `src/platform/per-platform.ts` | Modify | `applyBrandCriteria`, v3 TODO note |
| `src/report/domain-metrics.ts` | Modify | `DOMAIN_ROWS`+brand, `deriveBrandScore` |
| `src/report/presenters/toGeminiViewModel.ts` | Modify | 6 rows, V3 `ENGINE_WEIGHT`, brand description, null score |
| `src/report/presenters/types.ts` | Modify | `CategoryScore.score: number | null` |
| `src/lib/copy.ts` | Modify | 6-dim copy, 6th feature card, 6th FAQ, comparison table copy |
| `src/app/page.tsx` | Modify | 6th feature card render, comparison table section |
| `src/app/score-hero-evidence.ts` | Modify | Regenerated 6-row evidence |
| Tests + fixtures | Modify | `calculator`, `toGeminiViewModel`, `audit-result`, `run-audit*`, `variants`, platform |

## Testing Strategy (TDD order)

1. **Brand engine first (RED)** — `scoring.test.ts` (formula: presence gate → 0, full → ≥70, consistency mismatch reduces, completeness tiers) and `probes.test.ts` (mock fetcher over JSON fixtures; disambiguation rejects same-name person; type filter; ≤4 requests; error → never throws). Then `index.test.ts` (contract mapping + `emptyBrandResult`).
2. **Contract** — `audit-result.test.ts`: accept "3.0.0" + `brandAuthority`, reject "1.0.0"/"9.9.9", legacy 2.0.0 without `brandAuthority` validates. Fixture gains `brandAuthority` + "3.0.0".
3. **Calculator** — v3 weights (all-80→80, uneven→68, brand=0→64, brand excluded→rebalanced, sum 100, citability dominant, default→V3).
4. **Presenters** — `toGeminiViewModel.test.ts`: 6 categoryScores, brand weight "20%", measured 0 → 0/"sin presencia externa", absent → "No medido". `variants.ts`: add legacy-v2 variant (no `brandAuthority`) + `emptyBrand`.
5. **Orchestrator** — `run-audit*.test.ts`: 6 engines, brand success/failure isolation, anonymous runs brand, `meta.errors` brand entry.
6. **Platform** — migrated 4 criteria `measured` + points; remaining external stay `not_measured`.
7. **Landing** — `page.test.tsx`: `<table>` present, FAQ ≥5, question-form H2/H3, no FAQPage JSON-LD, dates/byline/alt.

## Trade-offs & Risks

- **Brand=0 drags GEO Score 20%** (relevy.app currently ~47 with no external presence → drops). Mitigation: honest (spec mandates), polish compensates, note documents "no external presence".
- **Scoring is heuristic** (toolkit `.py` is scaffold). Mitigation: formula grounded in the skill's rubric; deterministic; revisit with real data.
- **Wikipedia/Wikidata flakiness/rate-limit** (429). Mitigation: failure isolation (BRA-7/RAO-12), ≤4 requests, SSRF + timeouts.
- **`Partial` weights** touches the calculator reduce — low risk, covered by existing 5-dim regression tests (brand null → excluded).
- **`CategoryScore.score: number | null`** ripples to presenters/evidence — honest, mirrors `PlatformRow.readiness`.

## Implementation Order

1. `src/brand/` engine + fixtures + tests (RED→GREEN).
2. Contract (schema + union + optional) + fixture + contract tests.
3. Scoring v3 (weights + calculator) + tests.
4. Orchestrator (6th engine + emptyBrandResult + bridge) + tests.
5. Presenters/domain-metrics + tests.
6. Platform `applyBrandCriteria` + tests.
7. Landing copy + page + `verify:scorehero` regeneration + tests.
