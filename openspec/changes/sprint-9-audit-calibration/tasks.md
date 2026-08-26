# Tasks: Sprint 9 — Audit Calibration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900-1.750 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (WU-1) → PR 2 (WU-2) → PR 3 (WU-3) → PR 4 (WU-4) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Landing fixes + A3.2 | PR 1 (base=tracker) | `pnpm test -- src/lib/copy` + `pnpm verify:scorehero` | `pnpm dev` + fetch `/robots.txt` `/sitemap.xml` `/llms.txt` | `public/` + `page.tsx`/`copy.ts` revert; assets additive |
| 2 | Calibration diagnostic | PR 2 (base=PR1) | `pnpm test -- scripts/scorehero-verify` | `pnpm verify:scorehero` → 13-URL breakdown table | Revert `scripts/scorehero-verify.test.ts` only |
| 3 | Calibration v2.0.0 | PR 3 (base=PR2) | `pnpm test -- src/scoring src/citability src/eeat src/schema src/lib/contracts` | `pnpm verify:scorehero` re-run → best sites 60-75+ | Restore `z.literal("1.0.0")` + `SPRINT_1_WEIGHTS` + rubrics + delta spec |
| 4 | Code audit fixes | PR 4 (base=PR3) | `pnpm test -- src/dashboard src/ui src/billing` + E2E axe | Playwright headers/axe on landing/pricing/report | Revert `next.config.ts`, copy, README, docs |

## WU-1 — Landing fixes + A3.2

- [x] 1.1 RED: test `src/lib/copy.ts` — LANDING_COPY hero/features are answer-first + ≥1 stat (LND-11)
- [x] 1.2 Modify `src/lib/copy.ts` + `src/app/page.tsx`: citable answer-first copy con stats (LND-11, LND-12)
- [x] 1.3 Add inline `application/ld+json` (Organization+WebSite+SearchAction+sameAs) en `page.tsx` (LND-9)
- [x] 1.4 Create `app/robots.ts` + `app/sitemap.ts` (allow AI crawlers, list routes) (LND-10)
- [x] 1.5 Create `public/llms.txt` (summary + links) (LND-10)
- [x] 1.6 Footer trust signals: terms/privacy/contact, HTTPS-only (LND-12)
- [x] 1.7 Modify `src/app/score-hero-evidence.ts`: real `GeminiView` + `auditDate` + `categoryScores` from `pnpm verify:scorehero` (A3.2/LND-7)
- [x] 1.8 Gate: `pnpm verify:scorehero` → capture SCOREHERO_EVIDENCE; full `pnpm test` verde

## WU-2 — Calibration diagnostic

- [x] 2.1 Port `diag/scorehero-breakdown` (13 URLs + `categories` + per-category print) into `scripts/scorehero-verify.test.ts`
- [x] 2.2 Run `pnpm verify:scorehero` → consolidar tabla por categoría (crawler/citability/content/schema/platform)
- [x] 2.3 Presentar tabla + decisión de calibración al usuario (default design: b+c, pesos 28/24/20/14/14); NO recalibrar sin evidencia

## WU-3 — Calibration v2.0.0 (según decisión de WU-2; default 28/24/20/14/14)

- [x] 3.1 RED: contract test `audit-result.test.ts` rechaza `1.0.0`/`0.9.0`, acepta `2.0.0` (RGS-7)
- [x] 3.2 Modify `src/lib/contracts/audit-result.ts:88` `z.literal("2.0.0")` + casts `audit/index.ts:205/366/474` + fixture `__fixtures__/audit-result.ts:92` (RGS-7)
- [x] 3.3 RED: citability partial-credit tiers → update/add `citability` tests (RCI-3/5/6)
- [x] 3.4 Modify `src/citability/scorer.ts`+`constants.ts`: crédito parcial answer/structure/stats (RCI-3/5/6)
- [x] 3.5 RED: eeat partial authority → `eeat/authoritativeness.ts` tests (REE-3)
- [x] 3.6 Modify `src/eeat/authoritativeness.ts`: crédito parcial citations/sameAs (REE-3)
- [x] 3.7 RED: schema intermediate points → `schema` tests (RSC-13)
- [x] 3.8 Modify `src/schema/index.ts`: criterios con puntos intermedios (RSC-13)
- [x] 3.9 Modify `src/scoring/weights.ts`: add `GEO_SCORE_V2_WEIGHTS` (28/24/20/14/14); keep `SPRINT_1_WEIGHTS` (RGS-1)
- [x] 3.10 Modify `src/report/presenters/toGeminiViewModel.ts` `ENGINE_WEIGHT` → V2 (RGS-1)
- [x] 3.11 RED/update: `calculator.test.ts` + `run-audit.test.ts` — invariantes "all 80→80", "sum=100", citability dominant, version `2.0.0` (RGS-1/5/7)
- [x] 3.12 Modify `openspec/specs/geo-score-calculator/spec.md` delta RGS-1/5/7 v2.0.0
- [x] 3.13 Gate: `pnpm verify:scorehero` re-run → mejores reales 60-75+; full `pnpm test` verde (la suite completa la corre el gatekeeper al cerrar WU-3)

## WU-4 — Code audit fixes

- [ ] 4.1 Modify `next.config.ts` `async headers()`: CSP report-only→enforce + HSTS + X-Content-Type-Options + Referrer-Policy (SHL-7)
- [ ] 4.2 RED: test `DashboardEmptyState` renders `DASHBOARD_COPY.empty`, sin voseo (DSH-4)
- [ ] 4.3 Modify `src/dashboard/dashboard-empty-state.tsx` → consume `DASHBOARD_COPY.empty` + ampliar `copy.test.ts` (DSH-4)
- [ ] 4.4 Modify `src/ui/score-bar.tsx` aria-label; `src/billing/pricing-cards.tsx` `#047857`; `src/ui/navbar.tsx` brand label (A11Y-6)
- [ ] 4.5 E2E: axe (progressbar-name, contrast, label-content-name-mismatch) + headers presentes (A11Y-6, SHL-7)
- [ ] 4.6 README real; `.env.example`/`AGENTS.md` docs stale (docs)
- [ ] 4.7 Gate: full `pnpm test` + lint + typecheck + build

## Notas

- Tests ACOTADOS por WU (`pnpm test -- <ruta>`); suite completa SOLO al gate final de cada WU.
- Commits atómicos por tarea; conventional commits (título EN, descripción ES); lint/format antes de push.
- Copy de UI neutro (usted, sin voseo). Brand Authority → Sprint 11 (fuera de scope).
- Cada WU = PR revertible en feature-branch-chain; PR #1 base=tracker, hijos base=PR anterior.
