# Calibration Diagnosis — Sprint 9 WU-2

> **Artifact**: WU-2 evidence table — input for the WU-3 calibration decision.
> **Date**: 2026-08-26
> **Command**: `pnpm verify:scorehero` (real network, 14 candidate URLs)
> **Script**: `scripts/scorehero-verify.test.ts` (port from `diag/scorehero-breakdown`, WU-2)
> **Engine weights (SPRINT_1)**: crawler 18.75 · citability 31.25 · content/E-E-A-T 25 · schema 12.5 · platform 12.5

## Raw results (12/14 audited; openai.com and notion.so → HTTP 403)

| URL | GEO Score | Band | crawler | citability | content | schema | platform |
|-----|-----------|------|---------|------------|---------|--------|----------|
| moz.com | 48 | poor | 95 | 32.1 | 44 | 0 | 44 |
| llmstxt.org | 41 | poor | 95 | 46.2 | 45 | 0 | 25 |
| react.dev | 18 | critical | 15 | 23.6 | 36 | 0 | 0 |
| nextjs.org | 37 | critical | 95 | 15.5 | 42 | 0 | 13 |
| supabase.com | 44 | poor | 95 | 25.9 | 60 | 0 | 15 |
| tailwindcss.com | 31 | critical | 90 | 29.3 | 33 | 0 | 15 |
| developer.apple.com | 28 | critical | 90 | 26.4 | 26 | 0 | 18 |
| docs.anthropic.com | 25 | critical | 95 | 0 | 44 | 0 | 15 |
| aws.amazon.com | 35 | critical | 95 | 20.8 | 29 | 80 | 36 |
| smashingmagazine.com | 37 | critical | 95 | 39.6 | 27 | 0 | 35 |
| webflow.com | 41 | poor | 95 | 34.5 | 34 | 10 | 15 |
| geoaudit-tau.vercel.app (landing, pre-fix) | 20 | critical | 90 | 19.9 | 12 | 0 | 5 |
| **Average (12 URLs)** | **33.8** | **critical** | **87.1** | **26.2** | **36.0** | **7.5** | **19.7** |

## What crushes the total

| Dimension | Avg | Band (avg) | URLs ≤ 40 | Weight | Avg contribution to total |
|-----------|-----|------------|-----------|--------|---------------------------|
| crawler | 87.1 | excellent | 1/12 | 18.75% | 16.3 pts |
| citability | 26.2 | critical | 10/12 | 31.25% | **8.2 pts** |
| content (E-E-A-T) | 36.0 | critical | 8/12 | 25% | 9.0 pts |
| schema | 7.5 | critical | 11/12 | 12.5% | **0.9 pts** |
| platform | 19.7 | critical | 11/12 | 12.5% | 2.5 pts |

### The crushing pattern

1. **Schema is the #1 killer**: 11 of 12 URLs score ≤ 10, and 10 of 12 score **0**.
   Even aws.amazon.com — the only site with real JSON-LD (80) — lands at 35 total
   because citability/content/platform still drag it down. Schema's weight is
   small (12.5%) but its 0-credits are near-universal, so the engine treats every
   real-world site as "no structured data at all".
2. **Citability is the #2 killer and the heaviest drag**: avg 26.2 at the
   highest weight (31.25%). Only llmstxt.org (46.2) crosses 40; 10 of 12 are
   ≤ 34.5. This is the dimension the engine can never reward with the current
   all-or-nothing rubrics (answer/uniqueness are EN-only; structure/stats/self
   containment are the only partial credit available).
3. **Crawler is NOT the problem**: avg 87.1 excellent; 11 of 12 URLs allow AI
   crawlers. react.dev (15) is the only blocked outlier. Any recalibration that
   rewards crawler further would inflate a dimension that already works.
4. **Content and platform are weak but not the primary crush**: content avg 36
   (supabase 60 is the only fair); platform avg 19.7 with only moz (44) above 40.

### Expected effect of the WU-3 default (b: soften rubrics + c: weights 28/24/20/14/14)

With partial-credit rubrics (citability tiers, schema intermediate points) and
the v2 weights, the same real audits would score roughly:

| URL | v1 total | Est. v2 total | Main v2 gain |
|-----|----------|---------------|--------------|
| moz.com | 48 | ~60-64 | schema 0→partial + citability tiers |
| llmstxt.org | 41 | ~55-58 | schema 0→partial |
| supabase.com | 44 | ~55-60 | citability tiers |
| webflow.com | 41 | ~52-56 | schema 10→partial + citability tiers |
| aws.amazon.com | 35 | ~48-52 | citability tiers |

The landing (currently 20 pre-fix) is expected to clear 50+ after WU-1 deploy +
WU-3 (see `src/app/score-hero-evidence.ts` TODO A3.2).

## Decision for WU-3 (user decides — NOT applied here)

Default from design.md: **option b (soften rubrics) + option c (re-balance
weights)** → `GEO_SCORE_V2_WEIGHTS` 28/24/20/14/14, `scoringModelVersion` 2.0.0.
The evidence above supports it: schema and citability need partial credit (b),
and the two healthiest dimensions (crawler 18.75% → 14%, content 25% → 20%)
should yield weight to the dimensions that currently crush the total.