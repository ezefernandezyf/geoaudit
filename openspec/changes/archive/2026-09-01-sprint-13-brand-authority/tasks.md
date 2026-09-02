# Tasks: Sprint 13 — Brand Authority (6º engine) + Polish landing

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2000 (autoredas; ~2015 = 9 tasks + fixtures + evidencia) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 (ver Work Units) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Brand scoring puro: `src/brand/types.ts` + `scoring.ts` + fixtures + tests | PR 1 | `pnpm vitest run src/brand/__tests__/scoring.test.ts` | N/A — función pura, sin red | revert `src/brand/scoring.ts` + `types.ts` |
| 2 | Brand network: `probes.ts` + `index.ts` + `emptyBrandResult` + tests | PR 2 | `pnpm vitest run src/brand` | mock fetcher sobre fixtures JSON (sin red real) | revert `src/brand/probes.ts` + `index.ts` |
| 3 | Contrato + scoring v3: `audit-result.ts`, `weights.ts`, `calculator.ts` + tests | PR 3 | `pnpm vitest run src/lib/contracts/__tests__/audit-result.test.ts src/scoring` | N/A — schemas/cálculo puros | revert contrato + weights + calculator |
| 4 | Orquestador + platform: `src/audit/index.ts` + `per-platform.ts` + tests | PR 4 | `pnpm vitest run src/audit src/platform` | `pnpm dev` + audit anónima real sobre fixture | revert `audit/index.ts` + `per-platform.ts` |
| 5 | Presenters + landing + evidencia: `domain-metrics.ts`, `toGeminiViewModel.ts`, `types.ts`, `copy.ts`, `page.tsx`, `score-hero-evidence.ts` + tests | PR 5 | `pnpm vitest run src/report src/app/__tests__/page.test.tsx` | `pnpm dev` + `/` + `pnpm verify:scorehero` | revert presenters + copy + page + evidencia |

---

## Phase 1: Brand engine (dominio nuevo, TDD RED→GREEN)

- [x] **T1 — Scoring puro**: `src/brand/types.ts` (BrandEngineResult, BrandSignals, Entity) + `src/brand/scoring.ts` (fórmula 60/25/15: gate `!entityPresence → 0`; presence 40+20 anti-disambiguation; completeness 10+5+5+5; consistency 15/7/0; normalización lowercase + sufijos legales; filtro P31 Q43229/Q4830453/Q783794/Q6881511, rechazo Q5/Q95074, bare→P856).
  - Requisitos: BRA-2, BRA-3, BRA-4, BRA-5, BRA-8
  - Aceptación: presence false→0; full→≥70; label mismatch→score reducido; bare entity→completeness bajo; mismo input→mismo score; P31 persona rechazada.
  - Tests: RED `src/brand/__tests__/scoring.test.ts` (fixtures: full, mismatch, bare, no-article, disambiguation).
  - Deps: —
- [x] **T2 — Probes red**: `src/brand/probes.ts` — fetch JSON propio (reusa `assertPublicHost` + `followRedirects`, fetcher/lookup inyectables): Wikipedia action API search + `wbsearchentities` + `wbgetentities` (claims P31/P856 en la misma llamada, ≤4 req/audit, solo hosts Wikipedia/Wikidata). 429/timeout/block → resultado error con razón, nunca throw.
  - Requisitos: BRA-1, BRA-2, BRA-7, BRA-8
  - Aceptación: ≤4 requests; 429 → `{ error }` sin throw; candidates same-name rechazados por descripción/website; QID validado contra wbgetentities.
  - Tests: RED `src/brand/__tests__/probes.test.ts` con mock fetcher + `src/brand/__fixtures__/*.json` (article-exists, no-article, same-name, rate-limit).
  - Deps: T1
- [x] **T3 — Contrato brand**: `src/lib/contracts/audit-result.ts` — `brandAuthorityResultSchema` (status/reason/score/signals/entity), `brandAuthority.optional()`, `scoringModelVersion: z.union(["2.0.0","3.0.0"])`.
  - Requisitos: BRA-6, RAO-16
  - Aceptación: acepta "3.0.0"+brandAuthority; rechaza "1.0.0"/"9.9.9"; fila legacy 2.0.0 sin brandAuthority valida.
  - Tests: RED/actualizar `src/lib/contracts/__tests__/audit-result.test.ts` + fixture (brandAuthority + "3.0.0").
  - Deps: —
- [x] **T4 — Index brand**: `src/brand/index.ts` — `scoreBrand(domain, opts)` (encadena probes→scoring), `toContractResult` → schema T3, `emptyBrandResult(reason)`.
  - Requisitos: BRA-6, BRA-7
  - Aceptación: contract mapping correcto; fallo → `emptyBrandResult` con razón; 0 real medido se conserva (no error).
  - Tests: RED `src/brand/__tests__/index.test.ts` (success, error, emptyBrandResult).
  - Deps: T2, T3

## Phase 2: Scoring v3 (rebalanceo)

- [x] **T5 — Weights + calculator**: `src/scoring/weights.ts` — `GEO_SCORE_V3_WEIGHTS` (22.4/19.2/16/11.2/11.2/20), `DimensionKey += "brand_authority"`, `weights: Partial<Record<DimensionKey, number>>` (SPRINT_1/V2 conservan 5 keys), nota re-entrada v3. `calculator.ts` — `DIMENSIONS` 6, `?? 0` en reduces, mapping brand_authority + `failures.brand_authority`, nota "brand 0: no external presence", default → V3. `src/scoring/index.ts` exporta V3.
  - Requisitos: RGS-1, RGS-7, RGS-8, RGS-9, RGS-10, RGS-11
  - Aceptación: all-80→80; uneven→68; all-80+brand=0→64 + nota; brand excluido (wikidata_rate_limit)→rebalanceo + nota; suma 100; citability dominante; default V3.
  - Tests: actualizar `src/scoring/__tests__/calculator.test.ts` (casos v3 + regresión 5 dims).
  - Deps: —

## Phase 3: Platform + Orquestador (wiring)

- [x] **T6 — Platform brand criteria**: `src/platform/per-platform.ts` — `applyBrandCriteria(platforms, brandSignals)` puro: `chatgpt.wikipedia`(15)/`chatgpt.wikidata`(10)/`chatgpt.entity_consistency`(5)/`perplexity.wikipedia_wikidata`(5) → "measured", puntos desde señales (0 si brand=0); resto externo (YouTube/Reddit/Bing/backlinks/LinkedIn/…) → "not_measured" con nota TODO v3.
  - Requisitos: RPL-10, RPL-11
  - Aceptación: 4 keys measured con note null y puntos por señal; resto not_measured con TODO; puntos SOLO en chatgpt/perplexity (nunca aio → sin doble conteo).
  - Tests: RED `src/platform/__tests__/per-platform.test.ts` (split, brand=0 → 0 pts, señales → pts máximos, pure/no-mutación).
  - Deps: T4
- [x] **T7 — Orquestador 6 engines**: `src/audit/index.ts` — `EngineName`/`EngineRun`/`AuditDeps` += `brand`; corre en TODA auditoría (anónima incluida) con `target.hostname` (no DOM); `scoreBrand` en try/catch → fallo: `emptyBrandResult` + `meta.errors` `brand: {reason}` + `brand_authority: null`; bridge `applyBrandCriteria` sobre el `PlatformEngineResult` rico antes de `platformToContract`; `auditUnsupportedPage` async (también corre brand).
  - Requisitos: RAO-3, RAO-10, RAO-12, RAO-14, RAO-15, RAO-16
  - Aceptación: audit completa trae `brandAuthority` + "3.0.0"; fallo brand → audit 5 engines + meta.errors brand; anónima corre brand; P99 < 8s (proxy en test RAO-14).
  - Tests: actualizar `src/audit/__tests__/run-audit*.test.ts` + `shared-dom.test.ts` (6 engines, isolación brand, anónima, meta.errors).
  - Deps: T4, T5, T6

## Phase 4: Presenters (honestidad fila brand)

- [x] **T8 — Presenters**: `src/report/domain-metrics.ts` — `DOMAIN_ROWS` + `{engine:"brand", label:"Autoridad de marca"}`, `deriveBrandScore(result): number | null` (null si ausente o status≠success), caso `brand` en `rowScore` ANTES del default; `src/report/presenters/types.ts` — `CategoryScore.score: number | null`; `toGeminiViewModel.ts` — 6 filas, `ENGINE_WEIGHT` → V3 (brand 20), `CATEGORY_DESCRIPTION` brand, fila via `deriveBrandScore` (nunca default 0 de rowScore → APT-10).
  - Requisitos: APT-6, APT-11, RAO-16 (render legacy)
  - Aceptación: 6 categoryScores con brand = score del contrato; 0 medido → 0 + "sin presencia externa"; ausente → "No medido" (20% visible); derivación compartida web/PDF/findings.
  - Tests: actualizar `src/report/presenters/__tests__/toGeminiViewModel.test.ts` + variantes (legacy v2 sin brandAuthority, emptyBrand, measured-0) en fixtures.
  - Deps: T3, T5

## Phase 5: Landing polish + evidencia

- [x] **T9 — Landing**: `src/lib/copy.ts` + `src/app/page.tsx` — copy 6 dimensiones (hero + FAQ "¿Qué es el GEO Score?" con pesos v3), `features[5]` "Autoridad de marca" (20%, señales Wikipedia/Wikidata, pasaje 50-200 palabras), 6ª pregunta FAQ (≥5 reconocibles), tabla comparativa `<table>` (≥3 filas datos reales, sin placeholders), H2/H3 en forma de pregunta; conservar datePublished/byline/alt; sin FAQPage JSON-LD. Regenerar `src/app/score-hero-evidence.ts` vía `pnpm verify:scorehero` (NUNCA a mano).
  - Requisitos: LND-11, LND-13, LND-14
  - Aceptación: pasajes 50-200 palabras answer-first con stats; FAQ ≥5 preguntas "what is/how to"; tabla con celdas reales; headings pregunta; `page.test.tsx` no encuentra FAQPage JSON-LD; evidence 6 filas.
  - Tests: actualizar `src/app/__tests__/page.test.tsx` + `scripts/scorehero-verify.test.ts`.
  - Deps: T8