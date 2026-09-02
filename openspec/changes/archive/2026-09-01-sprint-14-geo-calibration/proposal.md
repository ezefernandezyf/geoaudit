# Proposal: Sprint 14 — Calibración GEO Score v3.1

## Intent

Recalibrar el GEO Score a v3.1 con datos reales para que discrimine de verdad. El benchmark real (10 sitios best-in-class + relevy.app) con engine v3 dio distribución plana 25-56 (promedio 36.1, mediana 34), CERO sitios en 60+, 90+ (Excellent) matemáticamente inalcanzable. La vara actual etiqueta "Deficiente" a los mejores sitios del mundo. Objetivo: promedio 40-60, buenos 70-85, excelentes 80+ alcanzables sin Wikipedia.

## Contexto de negocio

El score debe medir visibilidad GEO, no fama de marca. La varianza la explica Wikipedia sí/no (relevy.app, mejor on-page, 46; moz, peor on-page, 56 solo por Wikipedia). Brand 0 con peso 20% fija techo 74.2 (Good inalcanzable para SMBs); rúbricas comprimidas (uniqueness 0 en 100% de bloques, coverage 0% universal, experience 0/25 en 6/9) y 30 pts de platform not_measured aplanan todo.

## Scope

### In Scope
- Pesos v3.1: citability 24 / eeat 23 / technical 15 / schema 12 / platform 14 / brand 12 (suma 100). Bump `scoringModelVersion` → 3.1.0 (contrato + fixture + delta).
- Bandas 80/65/50/30 (reemplazan 90/75/60/40, tope inalcanzable).
- Rescale platform ×100/70 (techo measured-only): corrige 30 pts not_measured (+1-3/sitio).
- Rúbricas citability: uniqueness floor ~35, stats semver (vX.Y.Z), coverage 70→60 o métrica de reporte.
- Fix `brandFromDomain` (eTLD+1: docs.anthropic.com → Anthropic).
- E-E-A-T experience: proxy changelog/release-notes o 0 honesto (decisión usuario).
- Re-verificación del benchmark (metodología sprint 9, `pnpm verify:scorehero`).

### Out of Scope
- Engines futuros (multi-page, backlinks, brand scanner con keys) — el "90+ Excellent" queda post-sprint.
- Cambios de diseño/UI (salvo benchmark rows si cambian bandas). Docs.

## Capabilities

### New Capabilities
- _(ninguna)_

### Modified Capabilities
- `geo-score-calculator`: RGS-1 pesos v3.1, RGS-5 bandas 80/65/50/30, RGS-7 v3.1.0, RGS-11 brand 12%.
- `citability-engine`: RCI-7 uniqueness floor, RCI-9 stats semver, RCI-11 coverage.
- `eeat-engine`: experience proxy o 0 honesto.
- `brand-authority`: BRA-1 `brandFromDomain` eTLD+1.
- `platform-readiness`: rescale ×100/70 measured-only.

## Approach

Benchmark real → decisión usuario (6 puntos, sección Decisions) → aplicar (TDD) → re-verificar corpus con `pnpm verify:scorehero`. Bump literal "3.0.0" → "3.1.0" en `audit-result.ts` + `audit/index.ts` + fixture + delta spec.

## Decisions (vinculantes del usuario)

1. Pesos v3.1 exactos (24/23/15/12/14/12).
2. Bandas 80/65/50/30.
3. Rescale platform ×100/70 incluido.
4. Fix rúbricas citability (uniqueness floor, semver, coverage).
5. Fix `brandFromDomain` en este sprint.
6. E-E-A-T experience: proxy o 0 honesto.

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `src/scoring/weights.ts`, `calculator.ts` | Modified | v3.1 + `severityForScore` 80/65/50/30 |
| `src/citability/{constants,scorer}.ts` | Modified | uniqueness floor, semver, threshold |
| `src/eeat/experience.ts` | Modified | proxy o 0 honesto |
| `src/brand/scoring.ts` | Modified | `brandFromDomain` eTLD+1 |
| `src/platform/` | Modified | rescale ×100/70 |
| `src/lib/contracts/audit-result.ts`, `src/audit/index.ts` | Modified | literal 3.1.0 |
| `src/report/score-hero.tsx` | Modified | benchmark rows/segments |
| tests + `scripts/scorehero-verify.test.ts` | Modified | asserts + corpus |

## Risks

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Decenas de asserts dependen de pesos/bandas/rúbricas | Alta | TDD + re-verificación corpus |
| Bajar brand 20→12 baja sitios CON Wikipedia (moz 56→54) | Alta | Documentar: mide visibilidad, no fama; mensaje al usuario |
| Percepción de inflación (bandas más bajas) | Media | Evidencia: tope inalcanzable ≠ re-mapping (sprint 9) |
| Cambio de bandas propaga a UI reporte | Media | Actualizar `score-hero` + tests |

## Rollback Plan

Revertir = volver literal a "3.0.0" + revertir `weights.ts`/`calculator.ts`/rúbricas/`brandFromDomain` + delta spec. Sin migraciones de DB; cada área es atómica y revertible.

## Dependencies

- Benchmark real ya ejecutado (explore 2026-09-02) + `pnpm verify:scorehero` para re-verificación.

## Success Criteria

- [ ] Benchmark re-corrido: promedio 40-60, mejores 70-85, bandas discriminan (6/9 suben una banda).
- [ ] Brand 0 deja de fijar techo: on-page perfecto sin Wikipedia alcanza 80+.
- [ ] `docs.anthropic.com` → brand "Anthropic" (no "docs").
- [ ] `pnpm test` · lint · typecheck verdes; corpus `verify:scorehero` pasa.