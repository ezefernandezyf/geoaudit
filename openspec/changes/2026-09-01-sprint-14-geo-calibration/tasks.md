# Tasks: Sprint 14 — Calibración GEO Score v3.1

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~400-450 (prod ~160 + tests ~250) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 (feature-branch-chain) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High
```

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Core scoring v3.1: weights + bandas + union contrato + fixture + casts orquestador | PR 1 (base: tracker `feat/sprint-14-geo-calibration`) | `pnpm vitest run src/scoring/__tests__/calculator.test.ts src/lib/contracts/__tests__/audit-result.test.ts src/audit/__tests__/run-audit.test.ts` | N/A — cálculo puro + contrato, sin red | Revert de weights.ts/calculator.ts/audit-result.ts + casts sin tocar motores |
| 2 | Fixes de motores: rescale platform, citability (semver/floor/coverage), eeat changelog proxy, brand eTLD+1 | PR 2 (base: rama PR 1) | `pnpm vitest run src/platform/__tests__/per-platform.test.ts src/citability/__tests__/scorer.test.ts src/citability/__tests__/index.test.ts src/eeat/__tests__/experience.test.ts src/brand/__tests__/scoring.test.ts` | `pnpm dev` + audit 1 URL real (docs.anthropic.com → brand "Anthropic") | Revert de per-platform.ts/constants.ts/scorer.ts/experience.ts/scoring.ts — independiente del core |
| 3 | Presenters + UI + evidencia: ENGINE_WEIGHT v3.1, score-hero rows/segments, comentarios de umbral, benchmark re-run | PR 3 (base: rama PR 2) | `pnpm vitest run src/report/presenters/__tests__/toGeminiViewModel.test.ts src/report/__tests__/score-hero.test.tsx` | `pnpm verify:scorehero` (red real) — gate final | Revert de toGeminiViewModel.ts/score-hero.tsx/score-hero-evidence.ts; UI re-renderiza sola |

## Phase 1: Core Scoring v3.1 (PR 1)

- [x] **T1** — Descripción: Agregar `GEO_SCORE_V3_1_WEIGHTS` en `src/scoring/weights.ts` (version `"3.1.0"`, pesos 24/23/15/12/14/12, `renormalizationNote` documenta brand 20% v3.0.0 → 12% v3.1.0). `GEO_SCORE_V3_WEIGHTS` intacto (D1). Requisitos: RGS-1, RGS-7, RGS-8. Criterios: seis pesos suman 100; citability 24% dominante; const v3.0.0 sin mutar. Tests: `calculator.test.ts` — describe v3.1: all-80 → 80; uneven (60/90/50/100/40/70) → 69; citability dominante; suma = 100. Dependencias: —
- [x] **T2** — Descripción: En `src/scoring/calculator.ts`, `severityForScore` → bandas 80/65/50/30 y default de `computeGeoScore` → `GEO_SCORE_V3_1_WEIGHTS` (D8). Requisitos: RGS-5, RGS-1. Criterios: 92→Excellent, 74→Good, 39→Poor, 100 cap→Excellent, límites exactos 80/65/50/30/29. Tests: `calculator.test.ts` — escenarios RGS-5 + brand 0: all-80 con brand 0 → 70; all-100 con brand 0 → 88 Excellent. Dependencias: T1.
- [x] **T3** — Descripción: Re-exportar `GEO_SCORE_V3_1_WEIGHTS` en `src/scoring/index.ts`. Requisitos: RGS-1. Criterios: importable desde `@/scoring`. Tests: cubierto por imports de T1/T2. Dependencias: T1.
- [x] **T4** — Descripción: En `src/lib/contracts/audit-result.ts`, union `scoringModelVersion` → `2.0.0 | 3.0.0 | 3.1.0` (RGS-7, sin migración DB). Requisitos: RGS-7. Criterios: filas legacy 2.0.0/3.0.0 validan; 3.1.0 aceptado. Tests: `audit-result.test.ts` — legacy rows validan + 3.1.0 parsea. Dependencias: —
- [x] **T5** — Descripción: Agregar `auditResultV31Fixture` en `src/lib/contracts/__fixtures__/audit-result.ts` (`scoringModelVersion: "3.1.0"`); conservar fixtures v3.0.0/v2.0.0. Requisitos: RGS-7. Criterios: fixture pasa `auditResultSchema`. Tests: `audit-result.test.ts` — fixture v3.1 valida. Dependencias: T4.
- [x] **T6** — Descripción: En `src/audit/index.ts`, casts `as "3.0.0"` (líneas 433, 580) → `as "3.1.0"`; path degraded URL inválida (línea 226) sigue `"2.0.0"`. Requisitos: RGS-7, RAO-16. Criterios: audit normal escribe 3.1.0; degraded escribe 2.0.0. Tests: `run-audit.test.ts` — assert `scoringModelVersion === "3.1.0"` (línea 149) + caso URL inválida sigue "2.0.0". Dependencias: T4, T5.

## Phase 2: Fixes de Motores (PR 2)

- **T7** — Descripción: En `src/platform/per-platform.ts`, const `AIO_MEASURED_MAX = 70` + helper puro exportado `rescaleAioScore(score) = min(100, round(score × 100/70))`; aplicar UNA vez en `scorePlatforms` sobre `aio` (D2): return `{ aio: {…aio, score: rescaled}, chatgpt, perplexity, gemini, copilot }`. Requisitos: RPL-12. Criterios: AIO raw 70 → 100; raw 35 → 50; chatgpt/perplexity/gemini/copilot sin rescale (techos distintos); sin re-rescale downstream. Tests: `per-platform.test.ts` (70→100, 35→50, otros platform intactos); `index.test.ts` platform — `platform` (14%) y `composeTechnical` consumen el MISMO valor rescalado (single-source). Dependencias: —
- **T8** — Descripción: En `src/citability/constants.ts` + `scorer.ts`, `UNIQUENESS_FLOOR = 35` y `scoreUniqueness` → `min(100, UNIQUENESS_FLOOR + hits × UNIQUENESS_PER_HIT)` (D4). Requisitos: RCI-7. Criterios: bloque autocontenido sin frases first-party ≥ 35 (nunca 0); 1 hit ≥ 70; lead first-person ≥ 70. Tests: `scorer.test.ts` — escenarios RCI-7. Dependencias: —
- **T9** — Descripción: En `src/citability/constants.ts`, `STAT_PATTERN` += `|\bv?\d+\.\d+\.\d+\b` (semver, D5). Requisitos: RCI-6. Criterios: bloque con "v18.2.0" sin otros stats gana crédito intermedio (> 10). Tests: `scorer.test.ts` — semver matchea y bloque > 10. Dependencias: —
- **T10** — Descripción: En `src/citability/constants.ts`, `COVERAGE_THRESHOLD` 70 → 60 (D6); `REWRITE_THRESHOLD` intacto (60, coherente). Requisitos: RCI-11. Criterios: bloques 82/65/40 → coverage 67%. Tests: `index.test.ts` citability — caso 3 bloques (50→67). Dependencias: —
- **T11** — Descripción: En `src/eeat/experience.ts`, `CHANGELOG_HEADING_PATTERN = /\b(release notes?|changelog|what'?s new|whats new)\b/i` escaneando h1-h4 + `EXPERIENCE_CHANGELOG_PROXY_BONUS = 10` + finding `{ key: "changelog_proxy", label: "Changelog/release notes detected" }` (D7). Requisitos: REE-1. Criterios: página con heading "Release notes" + versiones sin first-person ≥ 10 con finding `changelog_proxy`; impersonal sin señales ≤ 5; caso first-person/case-study ≥ 15 sin regresión. Tests: `experience.test.ts` — 3 escenarios REE-1. Dependencias: —
- **T12** — Descripción: En `src/brand/scoring.ts`, `brandFromDomain` → eTLD+1 heurística (D3): labels últimos 2, o últimos 3 si el TLD de 2 partes está en `MULTI_PART_TLDS` (`.co.uk`, `.com.ar`, `.com.br`, `.co.jp`, `.com.au`, `.co.nz`, `.com.mx`…); capitalizar primera letra; `www.` ya strippado. Requisitos: BRA-1. Criterios: `docs.anthropic.com` → "Anthropic"; `www.moz.com` → "Moz"; fallback `.co.uk` correcto; limitación documentada en comentario. Tests: `scoring.test.ts` — escenarios BRA-1 (subdomain + www + multi-part). Dependencias: —

## Phase 3: Presenters + UI + Evidencia (PR 3)

- **T13** — Descripción: En `src/report/presenters/toGeminiViewModel.ts`, `ENGINE_WEIGHT` → `GEO_SCORE_V3_1_WEIGHTS` (crawler 15, citability 24, content 23, schema 12, platform 14, brand 12) + comentarios de umbral 80/65/50/30. Requisitos: APT-6, APT-2. Criterios: weights del view model = 24/23/15/12/14/12; 74 → "good"; 47 → "poor" (discrimina de Gemini 80/65/45/25). Tests: `toGeminiViewModel.test.ts` — ENGINE_WEIGHT v3.1, bandFor 74/47; `page.test.tsx` (bandFor) actualizado. Dependencias: T1.
- **T14** — Descripción: En `src/report/score-hero.tsx`, `BENCHMARK_ROWS` → 80-100 / 65-79 / 50-64 / 30-49 / <30 y `BENCHMARK_SEGMENTS` anchos 20% / 15% / 15% / 20% / 30% (ARU-11, D8); single source con `severityForScore`. Requisitos: ARU-11. Criterios: score 68 posiciona en Good (65-79); rows/segments igualan 80/65/50/30. Tests: `score-hero.test.tsx` — 68 → banda Good. Dependencias: T2 (bandas), T13.
- **T15** — Descripción: Actualizar comentarios de umbral 90/75/60/40 → 80/65/50/30 en `score-bar.tsx`, `findings.ts`, `src/app/score-hero-evidence.ts`; re-correr `pnpm verify:scorehero` y reemplazar `SCOREHERO_EVIDENCE` con el mejor real v3.1 (banda vía `severityForScore`, nunca hardcodeada). Requisitos: RGS-5, ARU-11. Criterios: `pnpm verify:scorehero` verde: promedio 40-60, moz 58-63, relevy 50-54, bandas discriminan, `docs.anthropic.com` → "Anthropic". Tests: suite verify (scripts/) + evidence actualizado. Dependencias: T13, T14.

**Gate de aceptación final**: `pnpm test` · `pnpm run lint` · `pnpm run typecheck` · `pnpm verify:scorehero` verdes.