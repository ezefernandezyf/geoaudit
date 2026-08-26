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

---

# Post-calibration — Sprint 9 WU-3 (applied 2026-08-26)

> **Artifact**: re-run of `pnpm verify:scorehero` AFTER the WU-3 calibration
> shipped (v2.0.0: partial-credit rubrics in citability/eeat/schema + weights
> 28/24/20/14/14). Same 14 candidate URLs; openai.com and notion.so still
> return HTTP 403, so 12 URLs are compared.

## Raw results (v2.0.0)

| URL | v1 total | **v2 total** | Band | crawler | citability | content | schema | platform |
|-----|----------|--------------|------|---------|------------|---------|--------|----------|
| moz.com | 48 | **53** | poor | 95 | 36.9 (32.1) | 54 (44) | 0 | 44 |
| llmstxt.org | 41 | **42** | poor | 95 | 51.3 (46.2) | 45 | 0 | 25 |
| react.dev | 18 | **18** | critical | 15 | 27.3 (23.6) | 36 | 0 | 0 |
| nextjs.org | 37 | **39** | critical | 95 | 18.5 (15.5) | 42 | 0 | 13 |
| supabase.com | 44 | **46** | poor | 95 | 31.8 (25.9) | 60 | 0 | 15 |
| tailwindcss.com | 31 | **32** | critical | 90 | 35.1 (29.3) | 33 | 0 | 15 |
| developer.apple.com | 28 | **29** | critical | 90 | 29.4 (26.4) | 26 | 0 | 18 |
| docs.anthropic.com | 25 | **25** | critical | 95 | 0 | 44 | 0 | 15 |
| aws.amazon.com | 35 | **37** | critical | 95 | 23.8 (20.8) | 29 | 80 | 36 |
| smashingmagazine.com | 37 | **39** | critical | 95 | 44.6 (39.6) | 32 (27) | 0 | 35 |
| webflow.com | 41 | **46** | poor | 95 | 41.5 (34.5) | 44 (34) | 10 | 15 |
| geoaudit-tau.vercel.app (landing, pre-fix deploy) | 20 | **21** | critical | 90 | 22.9 (19.9) | 12 | 0 | 5 |
| **Average (12 URLs)** | **33.8** | **35.6** | **critical** | **87.1** | **30.3** | **38.1** | **7.5** | **19.7** |

(parenthesized citability/content values = the v1 score from the WU-2 run)

## What moved and what did not

1. **Citability tiers delivered (+4.1 avg on the dimension)**: the answer-floor
   raise (10→20) + intermediate structure tiers lifted every site that had
   extractable content: moz 32.1→36.9, llmstxt 46.2→51.3, webflow 34.5→41.5,
   smashing 39.6→44.6. docs.anthropic.com stays 0 (no extractable blocks).
2. **Every best-site gain came from citability + weights rebalance, not
   schema**: moz 48→53 (+5), webflow 41→46 (+5), supabase 44→46 (+2). The
   v1 estimate assumed "schema 0→partial" would add points for moz/supabase/
   llmstxt — **those sites ship NO JSON-LD at all**, so the RSC-13 partial
   rubric cannot fire (no blocks → the 12 criteria stay 0). Schema avg stays
   7.5; only aws (80) and webflow (10) have any structured data.
3. **The 60-75+ target was NOT reached** (best: moz 53, poor). The remaining
   crush is structural, not rubric-shaped: 10/12 sites have zero JSON-LD
   (schema 0 with weight 14%), content avg 38.1 (only supabase 60 clears
   fair), platform avg 19.7. No rubric softening can credit structured data
   that is absent.
4. **Bands stayed honest** (RGS-5): no re-mapping; every band above derives
   from the same 90/75/60/40 thresholds.

## Evidence-backed next levers (for a future calibration decision)

- Content E-E-A-T rubrics (REE-1..4) are the heaviest un-softened dimension
  (24% weight, avg 38.1): experience/expertise floors on real docs sites are
  the analog of what citability was in v1.
- Schema "no structured data" is a data-absence problem: only detectable via
  deeper discovery (llms.txt/sitemap presence already probed in platform) —
  out of scope for a rubric change.
- The landing (21) still audits the PRE-fix live deploy; re-audit after WU-1
  ships to production for the real A3.2 number.