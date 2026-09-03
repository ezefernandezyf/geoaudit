# Tasks: Sprint 15 — Polish Final

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~320-370 (prod ~160 + tests ~170) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR (work-unit commits, monitor lines) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

```text
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium
```

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | UI: bar order, score box, hamburger, table | PR 1 (single) | `pnpm vitest run src/report/__tests__/score-hero.test.tsx src/ui/__tests__/nav-links.test.tsx src/ui/__tests__/navbar.test.tsx src/app/__tests__/page.test.tsx` | `pnpm dev` — viewport <md: hamburger panel + score 100/100 sin clip; tabla scrollea a 360px | Reverts independientes: score-hero.tsx · nav-links.tsx/navbar.tsx · page.tsx |
| 2 | Copy v3.1 + names-only hero | PR 1 | `pnpm vitest run src/lib/__tests__/copy.test.ts` | `pnpm dev` — hero/features/FAQ visual v3.1 | Revert copy.ts + copy.test.ts (viajan juntos) |
| 3 | PDF entry + tech debts | PR 1 | `pnpm vitest run src/report/__tests__/audit-report.test.tsx src/audit/__tests__/run-audit-edge-cases.test.ts` | `pnpm dev` — audit logueado → "Exportar PDF" → `/api/report/{id}/pdf` (auth/ownership); anónimo → CTA signup | Reverts: audit-runner/toGeminiViewModel/audit-report(+REPORT_COPY.export) · index.ts:226+edge test · eslint.config.mjs |

Threat matrix: N/A (no routing/shell/subprocess boundary — PDF route untouched, hamburger is pure client state) → no threat-matrix RED tasks.

## Phase 1: Report UI (ARU-11/ARU-15)

- [x] **T1** — `src/report/score-hero.tsx`: reverse `BENCHMARK_SEGMENTS` → critical 30% → excellent 20% left→right (red `#ef4444` left, green `#10b981` right); marker/widths/colors intact; score box stacks `/100` under number (`flex-col`), keep `text-6xl/7xl` + `#047857` (D4/D5). Req: ARU-11, ARU-15. Tests RED first: `score-hero.test.tsx` — segment order/colors/width-sum 100, marker 85→85% / 15→15%; 100 unclipped + `/100` stacked.

## Phase 2: Shell (SHL-10)

- [x] **T2** — `src/ui/nav-links.tsx`: `useState(open)`, hamburger `<button>` (lucide Menu/X, `aria-expanded`/`aria-controls`), panel < md with links + session actions (login/signup | plan pill + user chip + logout), closes on navigate; serializable props `isAuthenticated`/`displayName`/`initials`/`plan`/`showMultiPage`. `src/ui/navbar.tsx`: wrap desktop actions `hidden md:flex`, pass serializable props (D3). Req: SHL-10. Tests RED first: NEW `nav-links.test.tsx` — toggle opens panel (anon + auth), toggle closes, desktop md+ unchanged; confirm `navbar.test.tsx` stays green (co-update only if broken).

## Phase 3: Landing (LND-14, LND-11/15)

- [x] **T3** — `src/app/page.tsx` (:580): table wrapper `overflow-hidden` → `overflow-x-auto`, `<table>` gains `min-w-[640px]`; semantic `<table>` preserved. Req: LND-14. Tests RED first: `page.test.tsx` — table present at 360px, wrapper scrollable.
- [x] **T4** — `src/lib/copy.ts`: v3.1.0 weights — features[01..06] (15/24/23/12/14/12 %), faq[0]+faq[4] ("12 %"/"octava parte"), hero `subtitleHighlight` names-only (exact D7 string, ≥50w passage); keep "24 puntos" (:174) + "12 criterios" (:179). Co-update `copy.test.ts` :289,:294-298,:308,:322-323. Req: LND-11, LND-15. Tests RED first: `copy.test.ts` green.

## Phase 4: PDF Export (PDF-10)

- [x] **T5** — `src/report/audit-runner.tsx`: capture `persisted.id` (best-effort), pass `ctx={{ exportPdfHref: id ? \`/api/report/${id}/pdf\` : null, exportAnonCta: !userId }}`; `src/report/presenters/toGeminiViewModel.ts`: `ViewModelContext` += `exportPdfHref?`/`exportAnonCta?`; `src/report/audit-report.tsx`: conditional strip — href → "Exportar PDF" (direct link), anon → signup CTA, no id → nothing (D1/D2); new `REPORT_COPY.export` strings in `src/lib/copy.ts`. Req: PDF-10. Tests RED first: `audit-report.test.tsx` — href link `/api/report/123/pdf`, no-id → no entry, anon → CTA.

## Phase 5: Tech Debts (RAO-10/16, R8, RGS-1)

- [x] **T6** — `src/audit/index.ts:226`: `"2.0.0"` → `"3.1.0"` (degraded invalid-URL branch); co-update `run-audit-edge-cases.test.ts:89-91` (assert + RAO-16 comment). Req: RAO-10, RAO-16. Tests RED first: edge-case suite green.
- [x] **T7** — `eslint.config.mjs`: `ignores` += `"coverage/**"`. Req: R8. Verify: `pnpm run lint` green with `coverage/` present.
- [x] **T8** — RGS-1 delta (docs/spec only): confirm `specs/geo-score-calculator/spec.md` scenario "Benchmark re-verification discriminates" matches measured corpus (moz 57, relevy 55, avg 42.4, 14 URLs, Anthropic eTLD+1); sprint-14 archive untouched. No code change. Verify: `pnpm verify:scorehero`.

**Acceptance gate**: `pnpm test` · `pnpm run lint` · `pnpm run typecheck` green.