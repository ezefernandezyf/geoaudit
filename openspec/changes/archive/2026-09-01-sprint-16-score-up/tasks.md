# Tasks: Sprint 16 — Raise GEO Score 70+ (landing content)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~180 (prod ~75 + tests ~105) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR — 5 work-unit commits |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

```text
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: feature-branch-chain
400-line budget risk: Low
```

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | FOUNDER.sameAs (LND-9) | PR 1 | `pnpm vitest run src/lib/brand.test.ts src/app/__tests__/page.test.tsx` | `pnpm dev` — JSON-LD founder sameAs en `<head>` | Revert brand.ts + brand.test.ts + page.test founder block |
| 2 | Footer byline (LND-13/SHL-11) | PR 1 | `pnpm vitest run src/ui/__tests__/footer.test.tsx src/app/__tests__/page.test.tsx` | `pnpm dev` — `.byline` en footer de toda ruta; FAQ solo `<time>` | Revert footer.tsx + SHELL_COPY.byline + tests byline |
| 3 | Case Study (LND-16) | PR 1 | `pnpm vitest run src/lib/__tests__/copy.test.ts src/app/__tests__/page.test.tsx` | `pnpm dev` — H2 exacto entre comparativa y FAQ | Revert copy.ts caseStudy + page.tsx section + tests |
| 4 | Changelog (LND-17) | PR 1 | `pnpm vitest run src/lib/__tests__/copy.test.ts src/app/__tests__/page.test.tsx` | `pnpm dev` — H2 "Changelog" + 3 versiones tras Case Study | Revert copy.ts changelog + page.tsx section + tests |
| 5 | PLATFORMS descs (LND-4) | PR 1 | `pnpm vitest run src/app/__tests__/page.test.tsx` | `pnpm dev` — 6 cards 50-200w con stat | Revert page.tsx descs + platform tests |

Threat matrix: N/A (no routing/shell/subprocess boundary) → no threat-matrix RED tasks.

## Phase 1: Brand + Shell (foundation)

- [x] **T1 — FOUNDER.sameAs (LND-9/D2)** — T1.1 RED: `src/lib/brand.test.ts:53` toEqual += `sameAs: ORG_SAME_AS`; `src/app/__tests__/page.test.tsx:346-349` founder toEqual += sameAs. T1.2 GREEN: `src/lib/brand.ts:37` `sameAs: ORG_SAME_AS` (shared const; dedupe → +0 authoritativeness). Commit `feat(brand): expose founder sameAs (LND-9)`.
- [x] **T2 — Byline → footer (LND-13/SHL-11, D1)** — T2.1 RED: `footer.test.tsx` += byline (p.byline + name + role); `page.test.tsx:427-434` split — keep date, drop name/role. T2.2 GREEN: `copy.ts` SHELL_COPY.byline `{role:"Fundador de Relevy"}`, delete contentByline; `footer.tsx` += `<p className="byline">`; `page.tsx:657-668` keep `<time>` only. Commit `feat(shell): byline in global footer (SHL-11)`.

## Phase 2: Landing sections

- [x] **T3 — Case Study (LND-16, D3)** — T3.1 RED: `copy.test.ts` += caseStudy — VOSEO_PATTERN (:42), 50-200w, números verificados, sin "92"; `page.test.tsx` += H2 exacto entre comparativa/FAQ. T3.2 GREEN: `copy.ts` += LANDING_COPY.caseStudy (heading + 2 p ES neutro, diseño D3); `page.tsx` += section tras comparativa (:623). Commit `feat(landing): case study section (LND-16)`.
- [x] **T4 — Changelog (LND-17, D4)** — T4.1 RED: `copy.test.ts` += changelog — 3 semver v3.1.0/v3.0.0/v2.0.0, 50-200w, VOSEO; `page.test.tsx` += H2 "Changelog" tras Case Study. T4.2 GREEN: `copy.ts` += LANDING_COPY.changelog (3 li 16-23w diseño D4); `page.tsx` += `<ul>` tras Case Study. Commit `feat(landing): changelog section (LND-17)`.

## Phase 3: Platform descs

- [x] **T5 — PLATFORMS descs (LND-4, D5)** — T5.1 RED: `page.test.tsx` += por card — 2-4 oraciones, 50-200w, subject lead, ≥1 stat STAT_PATTERN (`%`/2026/semver); name/bot/company/H3 intactos; VOSEO. T5.2 GREEN: `page.tsx:158-202` rewrite solo `desc` (receta D5; un stat honesto c/u; sin "17 agentes"/"<30s" sueltos; sin "92"). Commit `feat(landing): platform descs with real stats (LND-4)`.

## Phase 4: Verification gate

- [x] **T6 — Gate** — `pnpm test` · `pnpm run lint` · `pnpm run format` · `pnpm run typecheck` verdes; axe shell `a11y.test.tsx` (co-update solo si rompe — heading order comparativa→Case Study→Changelog→FAQ); `pnpm dev` smoke: `<time>` en FAQ, `.byline` en footer, 6 cards con desc larga. Commit final si hay co-update de tests.