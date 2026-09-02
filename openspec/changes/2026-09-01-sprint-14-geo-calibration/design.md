# Design: Sprint 14 — Calibración GEO Score v3.1

## Contexto

El benchmark real (10 sitios best-in-class + relevy.app) con engine v3 dio distribución plana 25-56 (promedio 36.1, mediana 34), CERO sitios en 60+ y el 90+ (Excellent) matemáticamente inalcanzable. La vara etiqueta "Deficiente" a los mejores sitios del mundo. Causa raíz: (1) brand 0 con peso 20% fija techo 74.2; (2) rúbricas de citability comprimidas (uniqueness 0 en 100% de bloques, coverage 0% universal); (3) 30 pts `not_measured` de la rúbrica AIO aplanan platform; (4) bandas 90/75/60/40 inalcanzables.

v3.1 recalibra con datos: pesos 24/23/15/12/14/12 (brand 20→12), bandas 80/65/50/30, rescale platform ×100/70, fixes de citability (floor uniqueness, semver, coverage 70→60), fix `brandFromDomain` (eTLD+1) y proxy de experience (changelog/release-notes). No hay migración de DB: `scoringModelVersion` es un literal, los audits persistidos se leen con la unión ampliada (RGS-7).

## Decisiones clave (con trade-offs)

| # | Decisión | Opciones | Elección | Razón (traza) |
|---|---|---|---|---|
| D1 | Pesos: mutar `GEO_SCORE_V3_WEIGHTS` vs. agregar v3.1 | (A) mutar in-place; (B) nuevo `GEO_SCORE_V3_1_WEIGHTS` | **B** | RGS-1/7. `GEO_SCORE_V3_WEIGHTS` lo importan tests de regresión v3.0.0 y `toGeminiViewModel` (ENGINE_WEIGHT). Mutar rompería el histórico y los asserts de "defaults to v3.0.0". El default de `computeGeoScore` y los 2 call-sites de `audit/index.ts` pasan al nuevo const. Compatibilidad total, revert atómico. |
| D2 | Rescale ×100/70: ¿5 rúbricas o solo AIO? | (A) las 5; (B) solo AIO | **B** | RPL-12. El techo medido 70 es SOLO de AIO (la que alimenta la dimensión `platform` y `composeTechnical`). Las demás tienen techos distintos (chatgpt 20→50 con brand, perplexity 40→45, gemini 40, copilot 30): rescalealas ×100/70 las inflaría. El rescale se aplica UNA vez en `scorePlatforms`, sobre el score AIO ya sumado. `applyBrandCriteria` no toca AIO → no hay doble rescale. |
| D3 | eTLD+1: ¿lib `psl` o heurística? | (A) dep `psl`; (B) heurística 2 labels + lista corta | **B** | BRA-1. El repo usa fetch nativo, cero deps (sin axios). Heurística: último 2 labels + lista de excepciones de TLD de 2 partes (`.co.uk`, `.com.ar`, `.com.br`, `.co.jp`, `.com.au`, `.co.nz`, `.com.mx`…). Limitación documentada para TLD compuestos no listados. |
| D4 | Uniqueness floor 35 | `max(current, 35)` vs. base + por-hit | **Base + por-hit** | RCI-7. `score = min(100, FLOOR + hits×35)`. `max()` ensuciaría el crédito real; el floor es "crédito base por pasaje autocontenido", aditivo a los hits. |
| D5 | Semver en `STAT_PATTERN` | solo `vX.Y.Z` vs. con prerelease | **solo `\bv?\d+\.\d+\.\d+\b`** | RCI-6. Suficiente para changelog/release-notes; prerelease es YAGNI. |
| D6 | Coverage 70→60 | — | **60** | RCI-11. Solo el const `COVERAGE_THRESHOLD`; `REWRITE_THRESHOLD` (60) queda coherente: ≥60 cubre, <60 sugiere rewrite. |
| D7 | Experience proxy | (A) 0 honesto; (B) proxy changelog | **B (decisión usuario)** | REE-1. Detección por heading (`release notes`/`changelog`/`what's new`) + refuerzo por versiones en texto. Crédito parcial +10 (finding `changelog_proxy`), sin romper el 0 honesto de contenido impersonal. |
| D8 | Banda `severityForScore` versionada | (A) versionar; (B) single source 80/65/50/30 | **B** | RGS-5/APT-2/ARU-11. El spec declara `severityForScore` single source (findings, PDF, multi-page, score-hero heredan). El band ya se persiste en `summary.severityBand`; solo cambia el cálculo. Multi-page re-deriva con los umbrales nuevos — aceptado (no hay historial de bandas que re-renderizar, el score ya está fijo). |

## Architecture / approach por dominio

**1. `src/scoring/` (RGS-1/5/7/8/11)**
- `weights.ts`: agregar `GEO_SCORE_V3_1_WEIGHTS` (version `"3.1.0"`, pesos 24/23/15/12/14/12, `renormalizationNote` que documenta brand 20%→12%). Dejar `GEO_SCORE_V3_WEIGHTS` intacto.
- `calculator.ts`: `severityForScore` → 80/65/50/30. Default de `computeGeoScore` → `GEO_SCORE_V3_1_WEIGHTS`.
- `scoring/index.ts`: re-exportar el nuevo const.

**2. `src/platform/per-platform.ts` (RPL-12)**
- Const `AIO_MEASURED_MAX = 70` + `rescaleAioScore(score) = min(100, round(score × 100/70))` (helper puro exportado).
- En `scorePlatforms`, tras `buildScore("aio", …)`: `const aioRescaled = { …aio, score: rescaleAioScore(aio.score) }`. Return `{ aio: aioRescaled, chatgpt, perplexity, gemini, copilot }`. El valor rescaleado fluye a `platform` (14%) y `composeTechnical` (40% de technical) vía `audit/index.ts` (`platforms.aio.score`) sin re-rescale.

**3. `src/citability/{constants,scorer}.ts` (RCI-6/7/11)**
- `constants.ts`: `STAT_PATTERN` += `|\bv?\d+\.\d+\.\d+\b`; `UNIQUENESS_FLOOR = 35`; `COVERAGE_THRESHOLD = 60`.
- `scorer.ts`: `scoreUniqueness` → `min(100, UNIQUENESS_FLOOR + hits * UNIQUENESS_PER_HIT)`.

**4. `src/eeat/experience.ts` (REE-1)**
- `CHANGELOG_HEADING_PATTERN = /\b(release notes?|changelog|what'?s new|whats new)\b/i`; scan h1-h4 (mismo patrón que `CASE_HEADING_PATTERN`). `EXPERIENCE_CHANGELOG_PROXY_BONUS = 10`. Finding `{ key: "changelog_proxy", label: "Changelog/release notes detected" }`.

**5. `src/brand/scoring.ts` (BRA-1)**
- `brandFromDomain`: tras parse de host → labels; si últimos 2 labels están en `MULTI_PART_TLDS` (`.co.uk`…), tomar últimos 3; sino últimos 2. Capitalizar primera letra del label de marca. `normalizeBrand` ya lowercased para el query → el casing no afecta el match de Wikipedia.

**6. Contrato + orquestador (RGS-7 / RAO-16)**
- `audit-result.ts`: union `2.0.0 | 3.0.0 | 3.1.0`.
- `audit/index.ts`: 2 casts `as "3.0.0"` → `as "3.1.0"` (paths normal y unsupported-page). El path degraded de URL inválida sigue escribiendo `"2.0.0"` (resultado degradado, no audit real).
- `__fixtures__/audit-result.ts`: agregar `auditResultV31Fixture` (`scoringModelVersion: "3.1.0"`); conservar v3.0.0 y 2.0.0 para validar la unión ampliada.

**7. `src/report/score-hero.tsx` (ARU-11)**
- `BENCHMARK_ROWS`: 80-100 / 65-79 / 50-64 / 30-49 / <30.
- `BENCHMARK_SEGMENTS` (anchos 0-100): 20% / 15% / 15% / 20% / 30%.

**8. `src/report/presenters/toGeminiViewModel.ts` (APT-6)**
- `ENGINE_WEIGHT` → `GEO_SCORE_V3_1_WEIGHTS` (technical 15, platform 14, brand 12, …). Actualizar comentarios de umbral (90/75/60/40 → 80/65/50/30) en `score-hero.tsx`, `score-bar.tsx`, `toGeminiViewModel.ts`, `findings.ts`, `app/score-hero-evidence.ts`.

## Componentes / archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/scoring/weights.ts` | Modify | `GEO_SCORE_V3_1_WEIGHTS` + note RGS-8 |
| `src/scoring/calculator.ts` | Modify | bandas 80/65/50/30 + default v3.1 |
| `src/scoring/index.ts` | Modify | re-export v3.1 |
| `src/platform/per-platform.ts` | Modify | `rescaleAioScore` + apply AIO |
| `src/citability/constants.ts` | Modify | STAT_PATTERN semver, FLOOR, threshold 60 |
| `src/citability/scorer.ts` | Modify | `scoreUniqueness` floor |
| `src/eeat/experience.ts` | Modify | changelog proxy |
| `src/brand/scoring.ts` | Modify | `brandFromDomain` eTLD+1 |
| `src/lib/contracts/audit-result.ts` | Modify | union + `"3.1.0"` |
| `src/audit/index.ts` | Modify | casts `"3.1.0"` |
| `src/lib/contracts/__fixtures__/audit-result.ts` | Modify | fixture v3.1 |
| `src/report/score-hero.tsx` | Modify | rows/segments 80/65/50/30 |
| `src/report/presenters/toGeminiViewModel.ts` | Modify | ENGINE_WEIGHT v3.1 |

## Testing Strategy (TDD RED→GREEN)

| Layer | Qué | Dónde |
|---|---|---|
| Unidad scoring | RGS-1 (80→80; uneven 68.6→69), RGS-5 (92/74/39/100/80/65/50/30/29), RGS-7 (version 3.1.0 + legacy validate), RGS-11 (brand 0 → 70 y 88) | `calculator.test.ts`, `audit-result.test.ts` |
| Unidad platform | rescale AIO: 70→100, 35→50, single-source (sin re-rescale en `composeTechnical`) | `per-platform.test.ts`, `index.test.ts` |
| Unidad citability | semver stat (RCI-6), floor 35 (RCI-7), coverage ≥60 (RCI-11) | `scorer.test.ts`, `index.test.ts` |
| Unidad eeat | changelog proxy ≥10 + finding key; impersonal ≤5 | `experience.test.ts` |
| Unidad brand | `docs.anthropic.com`→"Anthropic", `www.moz.com`→"Moz", `.co.uk` fallback | `scoring.test.ts` |
| Presenters/UI | APT-2 (74→good, 47→poor), ARU-11 (68 en Good) | `toGeminiViewModel.test.ts`, `score-hero.test.tsx` |
| Orquestador | `scoringModelVersion === "3.1.0"` en audit normal | `run-audit.test.ts` |

**Criterio de aceptación**: `pnpm test` · `pnpm run lint` · typecheck verdes + `pnpm verify:scorehero` re-corrido: promedio 40-60, moz 58-63, relevy 50-54, bandas discriminan (6/9 suben una banda), `docs.anthropic.com` → "Anthropic".

**Tests a re-verificar por coupling**: ~decenas de asserts dependen de pesos/bandas/rúbricas — `calculator.test.ts` (v3.0.0 vs v3.1.0), `run-audit.test.ts` (assert "3.0.0" → "3.1.0"), `per-platform.test.ts` (aio.score 70 → 100), `index.test.ts` citability (coverage 50→67 en el caso de 3 bloques), `toGeminiViewModel.test.ts` (ENGINE_WEIGHT), `score-hero.test.tsx`, `page.test.tsx` (bandFor). Los tests de regresión v3.0.0 que pasan `GEO_SCORE_V3_WEIGHTS` explícitamente NO cambian (D1).

## Trade-offs y riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Asserts acoplados a pesos/bandas/rúbricas | Alta | TDD + default v3.1 aislado; regresión v3.0.0 preservada vía const explícito |
| Bajar brand 20→12 baja sitios CON Wikipedia (moz ~56→54) | Alta | Documentar: mide visibilidad, no fama (RGS-8 note) |
| eTLD+1 heurística falla en `.co.uk`/`.com.ar` no listados | Baja | Lista de excepciones + limitación documentada; sin dep nueva |
| Percepción de inflación (bandas más bajas) | Media | Evidencia: techo inalcanzable ≠ re-mapping |
| Bandas nuevas propagan a PDF/multi-page/findings vía `severityForScore` | Media | Single source; actualizar comentarios de umbral |

## Notas de implementación (orden sugerido)

1. **Pesos + bandas**: `weights.ts` v3.1 + `calculator.ts` (severityForScore + default) + `scoring/index.ts` + contrato union + fixture v3.1 + `audit/index.ts` casts. RED→GREEN en `calculator.test.ts`, `audit-result.test.ts`, `run-audit.test.ts`.
2. **Rescale platform**: `per-platform.ts` helper + apply; actualizar `per-platform.test.ts` (70→100).
3. **Citability**: semver + floor + coverage; actualizar `scorer.test.ts`, `index.test.ts`.
4. **E-E-A-T**: proxy changelog; `experience.test.ts`.
5. **Brand eTLD+1**: `brandFromDomain`; `scoring.test.ts`.
6. **score-hero + presenters**: rows/segments 80/65/50/30 + ENGINE_WEIGHT v3.1 + comentarios de umbral.
7. **Benchmark**: `pnpm verify:scorehero` re-corrido como gate final de aceptación; actualizar `score-hero-evidence.ts` con el nuevo best real.

## Threat Matrix

`N/A` — sin routing, shell, subprocesos, automatización VCS/PR, clasificación de ejecutables, ni integración de procesos. (El cambio es cálculo puro + regex + presentación; `severityForScore` y los motores siguen sin tocar límites de proceso.)
