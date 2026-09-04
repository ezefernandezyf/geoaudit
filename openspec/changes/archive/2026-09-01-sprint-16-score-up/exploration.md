# Exploration: Sprint 16 — Raise relevy.app GEO Score 55 → 70+ with content

**Change**: `2026-09-01-sprint-16-score-up` · **Phase**: explore · **Date**: 2026-09-03
**Scope**: landing content only. No engine code. Verified baseline (evidence `src/app/score-hero-evidence.ts`, audit 2026-09-02): **GEO 62 (fair)** — citability 54.5, E-E-A-T 46, schema 72, platform 70, crawler 95, brand "No medido" (Wikipedia rate-limit, honest null).

---

## Current State

### 1. Byline (E-E-A-T expertise — today 0/5)

- Byline lives at the END of the FAQ section, `src/app/page.tsx:655-668`: `<p>Por <span className="font-medium">{name}</span> · {role}</p>` with a `<time>` above it. **No `.byline` class, no `rel="author"`** → `AUTHOR_SELECTOR = '.byline, [rel="author"], .author, author'` (`src/eeat/expertise.ts:22`) matches nothing → byline bonus 0. Copy source: `LANDING_COPY.contentByline` (`src/lib/copy.ts:305-308`), dates `LANDING_COPY.contentDates` (`src/lib/copy.ts:301-304`).
- The global `Footer` (`src/ui/footer.tsx`, rendered in `src/app/layout.tsx:71`) is minimal: logo, nav (Inicio/Dashboard/Términos/Privacidad), mailto Contacto (already earns trust +5, LND-12), copyright.
- **Engine behavior verified**: `scoreExpertise` queries `$(AUTHOR_SELECTOR).first()` over the FULL DOM (`src/eeat/expertise.ts:67`) — a byline inside `<footer>` IS detected. E-E-A-T `pageText`/`paragraphTexts` strip `footer` (`BOILERPLATE_SELECTOR`, `src/eeat/text.ts:12`) and citability `extractMainContent` strips it too (`EXCLUDE_SELECTOR`, `src/citability/extract.ts:24`) — so a footer byline affects citability **zero** and E-E-A-T word-count **zero** (informational only).
- **Hidden coupling found**: `pageTypeOf` (`src/eeat/meta.ts:70-77`) checks FAQ signals FIRST, then `$(AUTHOR_SELECTOR).length > 0` → "article". The landing already has ≥2 question-form H2s (`¿Cómo analiza…?`, `¿Qué es el GEO Score?`, `¿Por qué Relevy…?`) → classifies "faq" today, and STAYS "faq" after adding `.byline` (FAQ wins). Other pages (login/signup/terms/privacy/report/dashboard) would flip "page" → "article" (benchmark 500→1500) — **informational only, never scored** (`src/eeat/types.ts:11-14`: meta signals are NOT added to the composite). Low risk.

### 2. Person JSON-LD with sameAs (expertise — Person schema already +5, sameAs 0/2)

- `OrganizationJsonLd` (`src/app/page.tsx:60-85`) embeds `founder: FOUNDER` inside the Organization node.
- **KEY ANSWER — founder inside Organization DOES count as Person**: `collectTypeNodes` (`src/eeat/text.ts:114-137`) recurses through `Object.values(record)` — every nested object value, not just `@graph`/arrays. `scoreExpertise` (`src/eeat/expertise.ts:69-73`) therefore already finds the founder Person node → **+5 Person schema is already banked today**. What is missing: `FOUNDER` (`src/lib/brand.ts:35-38`) has **no `sameAs`** → `isPersonSameAs` false → **+2 available**.
- Adding sameAs to FOUNDER reuses the SAME 3 real URLs as `ORG_SAME_AS` (github/linkedin/ezefernandez.com — the only real profiles, honesty rule LND-7). `sameAsUrls` (`src/eeat/text.ts:72-108`) dedupes → **no authoritativeness gain** (already capped at 10 from the 3 org URLs); the +2 comes only from the Person-node check.
- **Two tests break with `sameAs` on FOUNDER** (strict `toEqual`): `src/lib/brand.test.ts` ("exposes the real founder as a Person") and `src/app/__tests__/page.test.tsx:346-349` (`expect(org.founder).toEqual({ "@type": "Person", name: … })`).

### 3. Case Study section (experience — today 0/25)

- `scoreExperience` (`src/eeat/experience.ts:60-115`): first-person paragraph leads `/^(?:we|our team|i)\b/i` (5 each, cap 10); case phrases list (5 each, cap 10); `CASE_HEADING_PATTERN = /\bcase\s*study\b/i` on h1-h4 (+5); `CHANGELOG_HEADING_PATTERN` (+10); max 25.
- **Current landing copy earns 0 experience**: all copy is neutral Spanish ("Relevy…", "La citabilidad…"), zero first-person, zero case phrases, no "Case Study" heading, no changelog heading.
- **THE language trap**: every trigger (`we|our team|i`, `we built|we measured|in our experience…`, `case study`, `changelog`) is **English-only**. Spanish copy scores 0 on first-person and case phrases; English case-study paragraphs score the full 25. This is the single most important design decision of the sprint (see Approaches).
- **Real numbers verified** (do not invent):
  - relevy.app total GEO: **47** (sprint 12, 2026-09-01) → **62** (sprint 14 verify, live 2026-09-02). Evidence comment `score-hero-evidence.ts:18-21`.
  - **14-URL benchmark corpus** = `CANDIDATE_URLS` (`scripts/scorehero-verify.test.ts:47-61`, 14 entries incl. relevy.app). Sprint 15 verify: "moz 57, relevy 55, avg 42.4, 14-URL corpus" (`openspec/changes/archive/2026-09-01-sprint-15-polish-final/proposal.md:17`).
  - The "46→55" framing mixes two metrics: 46 is the E-E-A-T dimension (2026-09-02 audit); 55 is the corpus total. An honest narrative: "E-E-A-T era 46; en el corpus de 14 URLs Relevy medía 55 vs. moz.com 57 (promedio 42.4)". Propose must pick one verifiable narrative.

### 4. Mini changelog (experience +10 / citability semver stats)

- `CHANGELOG_HEADING_PATTERN = /\b(release notes?|changelog|what'?s new|whats new)\b/i` (+10, `src/eeat/experience.ts:49-52`). "Changelog" is a natural Spanish-tech loanword → no language friction.
- **Real versions verified** (git log + archive deltas):
  - **v3.1.0** — sprint 14 (2026-09-01): calibrated weights 24/23/15/12/14/12, bands 80/65/50/30, citability v3.1 (uniqueness floor, semver stats, coverage 60). Live 2026-09-02.
  - **v3.0.0** — sprint 13 (2026-09-01): 6th dimension Brand Authority (Wikipedia+Wikidata), brand 20%.
  - **v2.0.0** — sprint 9 (~2026-08-26): first calibrated scoring model, weights 28/24/20/14/14.
  - Contract union `2.0.0 | 3.0.0 | 3.1.0` (`src/lib/contracts/__tests__/audit-result.test.ts:88`). Semver strings also hit citability `STAT_PATTERN` (`src/citability/constants.ts:64-65`) → strong stats score for the block.

### 5. Citability (54.5 → ~70) — block-by-block reality

Pipeline: `extractMainContent` picks `<main>` (landing has one, `page.tsx:209`) → `segmentBlocks` by h2/h3 (`src/citability/segment.ts:56-110`). The landing yields ~22 blocks: hero prelude (merges into block 1), howItWorks intro, 6 feature H3s, references H3, scorecard H2, 2 H3s (category + bands), platforms H2, 6 platform H3s, comparison H2, FAQ H2, CTA H2.

Scored dimensions per block (weights 30/25/20/15/10):
- **answer**: base 20; `DEFINITION_PATTERN /\bis\s+(?:a|an)\s+/` +40; copula `/\b(?:is|are|was|were)\b/` first-sentence ≤60 words +50/25 — **all English-only** → Spanish blocks stay at base 20. English blocks ("Relevy is a GEO audit platform…") hit ~100.
- **selfContainment**: pronoun/conjunction lead → 10; else 10+40, +30 in the 50-200 word band. Spanish feature bodies (~80-90 words, explicit subject) already score 80 ✓.
- **structure**: heading +20; all paragraphs 2-4 sentences +40 (partial +20); table/list +20; question heading (h2/h3 ending "?") +20. **Question bonus only fires on H2/H3 ending `?`** — FAQ questions are `<summary>` elements (NOT headings, `page.tsx:638-651`) → FAQ block gets no question bonus today.
- **stats**: `STAT_PATTERN` (% / currency / 4-digit year / semver); 70 at one stat per 500 words. Feature bodies (12-24 % weights) ≈ 100; platform cards have **0 stats** → 0.
- **uniqueness**: floor 35 + 35/hit; `FIRST_PERSON_LEAD /^(?:we|our|i)\b/` + English phrases only → Spanish blocks sit at floor 35; English case-study copy can hit 100.

**Where the mean leaks (why 54.5):** the 6 platform H3 blocks (desc = 1 sentence, ~35 words, no stats) score ≈ 26 each (`PLATFORMS` array, `page.tsx:158-202` — NOT in copy.ts); CTA (~30 words, no stats) ≈ 30-40; bands/category H3s short. Feature blocks ≈ 60. A single platform-card rewrite (2-4 sentences, 50-200 words, one stat) adds ≈ +40/block; the 6 cards together move the mean ≈ +9-10. Two new 85-95 blocks (Case Study EN, Changelog) add ≈ +7-8 more. Combined with FAQ/question tweaks, 70 is reachable but needs the platform descriptions + the two new sections + minor copy passes — not just the two new sections.

### Test blast radius (verified by reading)

| Test | Impact |
|---|---|
| `src/app/__tests__/page.test.tsx:346-349` | BREAKS if FOUNDER gains sameAs (`toEqual` strict) |
| `src/lib/brand.test.ts` ("real founder as a Person") | BREAKS if FOUNDER gains sameAs (`toEqual` strict) |
| `src/app/__tests__/page.test.tsx:427-434` (LND-13 byline) | BREAKS if byline moves to Footer: `renderPage()` renders `<Page/>` only, no layout → footer not in tree. Fix: assert byline in `src/ui/__tests__/footer.test.tsx` and/or render the shell (a11y pattern). Date (`Publicado el 2026-08-20`) stays in page.tsx → unaffected if date stays |
| `src/app/__tests__/page.test.tsx:225-235` | new copy must NOT contain "92" or "Desglose de ejemplo por categoría" |
| `src/app/__tests__/page.test.tsx:69-92, 94-108` | six domain names + `0[1-6]` numbers are exact-match within the features section — do not reword feature H3 titles; new numbered blocks outside that section are safe |
| `src/app/__tests__/page.test.tsx:398-409, 496-507` | FAQ title + question H2 names exact — do not reword existing H2s; new H2s are additive-safe |
| `src/lib/__tests__/copy.test.ts` | hero `subtitleLead` exact string; 50-200 word band; "no % in subtitle"; v3.1 weights `24/23/15/12/14`; **VOSEO_PATTERN** (bans "prueba", "Comienza", "te citan", "Crea tu"…) — new Spanish copy must stay neutral-usted |
| `src/app/__tests__/a11y.test.tsx` | axe on page + full shell (incl. Footer) — new sections must be axe-clean; heading order respected |
| `src/eeat/__tests__/*` (engine) | **Stable** — fixtures are self-contained; engine untouched by this change |
| `src/ui/__tests__/footer.test.tsx` | Stable; extend with byline assertions if byline lands in Footer |

---

## Affected Areas

- `src/ui/footer.tsx` — byline block (+`.byline` class, name, role) under the copyright line.
- `src/lib/brand.ts` — `FOUNDER.sameAs` = ORG_SAME_AS (real profiles only).
- `src/app/page.tsx` — Case Study + Changelog sections (new H2 blocks); optional platform `desc` rewrites; FAQ block copy tweaks (item 5).
- `src/lib/copy.ts` — new `LANDING_COPY.caseStudy`, `LANDING_COPY.changelog`, optional FAQ/platform copy keys; byline/date may migrate here for the footer.
- `src/app/__tests__/page.test.tsx` — update founder `toEqual` → `toMatchObject`/include sameAs; byline assertions move/adapt.
- `src/lib/brand.test.ts` — FOUNDER `toEqual` update.
- `src/ui/__tests__/footer.test.tsx` — add byline presence + `.byline` class assertions.
- `scripts/scorehero-verify.test.ts` + `src/app/score-hero-evidence.ts` — post-change re-audit of relevy.app and re-pin (verify phase, not this change's code).

---

## Approaches

### Item 1 — Byline

1. **Footer with `.byline` (user's plan)** — move name/role to `src/ui/footer.tsx` inside `<p className="byline">` (keep `<time>` in the FAQ section or move it too). Every page gets the byline → +5 expertise on the landing audit and on any audited subpage. Pros: matches user intent, semantic home for bylines, one place. Cons: LND-13 test churn (footer not in page-only render); footer is stripped from citability/word-count (no impact, both are non-scored or unaffected); other pages flip pageTypeOf to "article" (informational only).
2. **Keep in page.tsx, add `.byline` class** — minimal diff, zero test churn for the byline assertions (name/role stay in Page's render). Cons: only the landing benefits; violates "all pages" intent; byline remains visually coupled to the FAQ.
   → **Recommendation: Option 1** (footer), with the `<time>` staying in the FAQ section (date is content-specific; byline is authorship). Update LND-13 test to render the shell OR assert in footer.test.

### Item 2 — Person sameAs

1. **`FOUNDER.sameAs = ORG_SAME_AS`** — +2 expertise, reuses only real profiles. Two `toEqual` test updates.
2. **Separate top-level Person JSON-LD block** — NOT needed (founder already counts as Person via recursion); a standalone block adds nothing the nested node doesn't already earn, and risks schema-engine duplication findings.
   → **Recommendation: Option 1.** Expect +2. (Person schema +5 is already banked.)

### Items 3 + 4 — Case Study + Changelog (one combined section pair)

1. **English first-person case study + Spanish changelog (recommended)** — Case Study section written in English (it's a product-story block, not marketing copy): heading `Case Study: ¿qué pasó cuando auditamos nuestro propio sitio?` (contains "Case Study" + question form → +5 case heading AND +20 citability question bonus), 3-4 `<p>` starting "We built…", "We measured…", "In our experience…" (→ first-person 10 + case phrases 10, caps; citability uniqueness 100, definition/copula answer ~100, stats via 2026/62/55). Changelog as a compact `<ul>` with `v3.1.0/v3.0.0/v2.0.0` + one honest line each → +10 experience, semver stats, list bonus. Total experience 0→25 (max). English block composites ≈ 85-95 each.
   - Pros: maximum verified score impact (experience 25, two strong citability blocks), honest (all numbers real), "Case Study"/"Changelog" are natural loanwords in Spanish tech copy (heading can stay Spanish around the English loanword if preferred).
   - Cons: English prose inside a Spanish landing (intentional editorial choice — dogfooding stories are commonly published as-is); must pass VOSEO_PATTERN only for Spanish parts.
2. **All-Spanish sections** — "Caso de estudio" heading (does NOT match `case study` pattern), Spanish first-person ("Construimos…") (does NOT match `we|i`). Result: experience ≈ 15 (changelog 10 + case heading 0 + phrases 0 + leads 0) — **fails the 70 target** (46+7+15=68, and citability gains much smaller). Viable only if the user accepts sub-70 or allows engine changes (out of scope).
   → **Recommendation: Option 1.** This is the fork the user must confirm in propose: the engine's trigger phrases are English-only, so a Spanish-only implementation cannot reach the objective.

### Item 5 — Citability copy

1. **Platform descriptions (highest lever)** — rewrite the 6 `PLATFORMS[].desc` (`page.tsx:158-202`) to 2-4 sentences, 50-200 words, one concrete stat each (engine facts: crawler names, 17 agents, docs links). Lifts ≈ 6 blocks from ~26 to ~60-65 (+≈40 each ≈ +9-10 mean).
2. **FAQ question-heading bonus** — either convert the FAQ H2 to a question ("¿Cómo mejoro la visibilidad de mi sitio en los motores de IA?") — breaks page.test:399 (title exact) → update test; or add question-form H3s. Smaller lift; weigh test churn.
3. **Bands/CTA micro-pass** — lengthen `BAND_ROWS[].description` and CTA subtitle into 2-4 sentence paragraphs with a stat; keep "92" out.
   → **Recommendation: 1 + 3 first (biggest lift, low churn), 2 optional.** Verify per-block deltas with `pnpm verify:scorehero` after apply; iterate copy until pageScore ≥ 70.

---

## Recommendation

Execute all five items with these choices: (1) byline → global footer with `.byline`; (2) `FOUNDER.sameAs` = ORG_SAME_AS (+2); (3) English first-person Case Study section with question-form "Case Study" heading (max experience + citability); (4) compact Changelog `<ul>` with the three real versions (v3.1.0/v3.0.0/v2.0.0); (5) platform `desc` rewrites + bands/CTA micro-pass. Expected outcome: E-E-A-T 46 → ~78 (experience 25 + expertise +7); citability 54.5 → 70+ (two 85-95 blocks + six platform blocks ~60). Update the 4 affected tests; re-audit and re-pin evidence in verify.

## Risks

- **Language fork (item 3)**: English-only trigger phrases in the engine mean Spanish-only copy cannot reach 70. Must be confirmed by the user in propose — this is the one decision that changes the score outcome materially.
- **Test churn**: FOUNDER `toEqual` (2 files), LND-13 byline (page-only render), FAQ title if reworded, platform H3 titles if reworded (they shouldn't be — six-domain test).
- **Copy honesty**: "46→55" conflates the E-E-A-T dimension (46) with the 14-URL corpus total (55). Use only verifiable numbers: 47→62 (total), 46 (E-E-A-T), 55 vs 57 vs 42.4 (14-URL corpus), 6 engines/dimensions, 14 URLs.
- **Axe**: new sections must keep heading order and pass `toHaveNoViolations` on the full shell.
- **VOSEO_PATTERN**: new Spanish copy must stay neutral-usted (banned: "prueba", "Comienza", "te citan", "Crea tu", …).
- **Word-count band**: new blocks should sit 50-200 words (self-containment band); the changelog `<ul>` is short — keep the block ≥50 words via the version lines.
- **Post-change verification requires a deploy**: `verify:scorehero` audits the LIVE site; local `pnpm dev` can validate with a local audit first.

## Ready for Proposal

**Yes** — exploration complete, numbers verified against archives/git, engine rubrics mapped exactly, test impact enumerated. The orchestrator should tell the user: the one decision needed is the **language of the Case Study section** (English first-person = reachable 70+; Spanish-only = ~68 ceiling without engine changes).