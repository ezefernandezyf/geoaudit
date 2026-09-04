# Proposal: Sprint 16 — Raise relevy.app GEO Score to 70+ with landing content

## Intent

Raise the live relevy.app GEO Score from **62** (verified baseline 2026-09-02, evidence `score-hero-evidence.ts`; 14-URL corpus: relevy 55 vs moz 57, avg 42.4) to **70+** using landing content only. No engine changes, no monetization. Engine E-E-A-T triggers are English-only (`we|i` leads, case phrases, `case study`/`changelog` headings); **locked**: English headings, Spanish neutral bodies → experience caps at 15/25.

## Scope

### In Scope
1. Byline → global footer with `.byline` (+5 expertise; today 0/5 — byline has no class, page.tsx:655-668)
2. `FOUNDER.sameAs = ORG_SAME_AS` (+2 expertise; Person +5 already banked via nested node — verify/document)
3. "Case Study" section: EN heading, ES body, real dogfooding story (+5 experience)
4. "Changelog" section: v3.1.0 / v3.0.0 / v2.0.0 (+10 experience + semver stats)
5. Rewrite 6 `PLATFORMS` desc → 2-4 sentences / 50-200 words with real stats (+~40/block citability)

### Out of Scope
- Engine scoring/rubrics; monetization; brand presence (Wikipedia/Wikidata → sprint-17-close-free)
- English phrases in Case Study body; renaming existing headings; FAQ/bands/CTA micro-pass

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `landing-page`: LND-13 byline relocates to footer; new Case Study/Changelog sections; LND-4 platform desc 50-200 words
- `app-shell`: footer gains author byline block (extends SHL-5/6)

## Approach

1. **Byline** — move `contentByline` render into `src/ui/footer.tsx` as `<p className="byline">`; `<time>` stays in FAQ. Update page.test.tsx LND-13 (render shell) + extend footer.test.tsx. Footer is stripped from citability/E-E-A-T text (BOILERPLATE/EXCLUDE) → no collateral.
2. **sameAs** — `FOUNDER.sameAs = ORG_SAME_AS` (real profiles only); update strict `toEqual` in brand.test.ts + page.test.tsx:346-349.
3. **Case Study** (between comparison and FAQ) — H2 "Case Study" + 2-3 Spanish `<p>`, third-person neutral ("Relevy auditó su propio sitio…"), verified numbers only (14 URLs; 55 vs 57 vs 42.4; total 47→62). No "we built"/"in our experience".
4. **Changelog** (after Case Study) — H2 "Changelog" + `<ul>`: v3.1.0 (calibración pesos/bandas, citability v3.1), v3.0.0 (Brand Authority), v2.0.0 (primer modelo calibrado). Keep block ≥50 words.
5. **Platforms** — rewrite `PLATFORMS[].desc`: 2-4 sentences, explicit subject, one real stat each (6 engines, 17 agentes, <30s). H3 titles untouched.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/ui/footer.tsx` | Modified | `.byline` block under copyright |
| `src/lib/brand.ts` | Modified | `FOUNDER.sameAs` |
| `src/app/page.tsx` | Modified | Case Study + Changelog sections; PLATFORMS desc; byline removed from FAQ |
| `src/lib/copy.ts` | Modified | `caseStudy`/`changelog` keys |
| Tests ×3 | Modified | toEqual updates, LND-13, footer byline |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Composite lands 67-70, under target (ES-only bodies cap experience 15/25) | Med | Verify with `pnpm verify:scorehero`; document shortfall honestly, never fake |
| Test churn (toEqual, LND-13 page-only render, VOSEO_PATTERN, "92" ban, exact H2s) | High | Blast radius enumerated in exploration; copy passes VOSEO_PATTERN, avoids "92" |
| Copy honesty ("46→55" conflates E-E-A-T dim with corpus total) | Med | Only verified numbers: 47→62, 46, 55/57/42.4, 14 URLs, 6 engines |
| pageTypeOf "article" flip on other pages | Low | Informational only, never scored (meta.ts) |
| Axe violations / heading order | Low | New H2s additive between comparison and FAQ; shell axe test |

## Rollback Plan

Revert the single content commit (`git revert`) — copy/sections are isolated from engine and DB. Footer byline and `FOUNDER.sameAs` are independently reversible. Evidence re-pin via `pnpm verify:scorehero`.

## Dependencies

- Live deploy needed for `verify:scorehero`; local `pnpm dev` audit validates first.

## Success Criteria

- [ ] `pnpm verify:scorehero` ≥ 70 on live relevy.app, or documented honest shortfall
- [ ] E-E-A-T ≥ 60 (46 + expertise +7 + experience 15); platform blocks ≥ 60 each
- [ ] `pnpm lint && pnpm format && pnpm test` green; axe clean on full shell

## Open Questions

1. Case Study heading form: locked as "Case Study"; a question suffix ("…¿qué pasó…?") would add +20 citability question bonus on that block — confirm in spec phase or keep exact heading.
2. If verify lands < 70: accept ~68 or spin a follow-up micro-change (FAQ question-form H3 / bands-CTA micro-pass)?