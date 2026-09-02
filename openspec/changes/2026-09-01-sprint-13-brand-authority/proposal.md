# Proposal: Sprint 13 — Brand Authority (6º engine) + Polish landing

## Intent

Agregar el **6º engine Brand Authority** (MVP Wikipedia + Wikidata) a Relevy, desbloqueando los 24 criterios `not_measured` de platform y midiendo la presencia externa que las IA usan como fuentes. Rebalancear el GEO Score a v3.0.0 (brand 20%). Incluye polish de landing completo para subir citabilidad (~51→65).

## Contexto de negocio

Diferencia el producto frente a auditores que solo miden on-page: mide si la marca existe fuera del sitio. Desbloquea `NOT_MEASURED_NOTE` (24 criterios) en `src/platform/per-platform.ts`. Se declara la 6ª dimensión del brief §8.1 (20%) que v2.0.0 renormalizó fuera.

## Scope

### In Scope
- **Engine `src/brand/`**: types, index, probes, scoring — Wikipedia action API + Wikidata `wbsearchentities` (gratis, sin key, deterministic). Criterios: entity_presence, entity_consistency, wikidata_completeness.
- **Contrato**: `brandAuthorityResultSchema` + campo `brandAuthority` en `auditResultSchema`; `scoringModelVersion` literal `2.0.0` → `3.0.0`.
- **Rebalanceo v3**: `GEO_SCORE_V3_WEIGHTS` (22.4/19.2/16/11.2/11.2/20), `DimensionKey` + `brand_authority`, `DIMENSIONS` +6.
- **Orquestador** `src/audit/index.ts`: engine en `EngineRun`, `emptyBrandResult()`, aislamiento RAO-12, mapeo en `computeGeoScore`.
- **Reporte**: 6 filas en `DOMAIN_ROWS`, `ENGINE_WEIGHT`/`CATEGORY_DESCRIPTION`/`rowScore` en `toGeminiViewModel` + `domain-metrics`.
- **Migración not_measured**: conectar wikipedia/wikidata/entity_consistency YA; youtube/reddit/bing/backlinks → TODO documentado.
- **Polish landing completo**: FAQ contable (5+ preguntas reconocibles), H2/H3 con pregunta, tabla comparativa, byline, pasajes citables 50-200 palabras — `page.tsx` + `copy.ts`.
- **Tests/fixtures**: actualizar `calculator.test`, `toGeminiViewModel.test`, fixture `AuditResult`, `variants.ts`, los que asumen 5 dimensiones/v2.

### Out of Scope
- YouTube/Reddit/Bing/LinkedIn con API keys; backlinks autoritativos reales; top-10 rank real (TODO). Rediseño visual. Motor de scoring (solo registrar dimensión). Docs.

## Capabilities

### New Capabilities
- `brand-authority`: engine Wikipedia/Wikidata + contrato `brandAuthority` + scoring.

### Modified Capabilities
- `geo-score-calculator`: weights v3.0.0 (6 dims), RGS-1/RGS-7/RGS-8 rebalanceadas.
- `audit-orchestrator`: 6º engine, RAO-3/RAO-12/RAO-14.
- `audit-presenters`: `categoryScores` 6 filas, `ENGINE_WEIGHT`.
- `platform-readiness`: migrar criterios wikipedia/wikidata/entity_consistency a measured.
- `landing-page`: polish citabilidad (LND-11/LND-13 extendido).

## Approach

Engine puro con fetch reutilizable (`src/lib/fetch`), Wikipedia/Wikidata primero (gratis). `computeGeoScore` ya rebalancea (RGS-9) — solo registrar la dimensión. Brand sin presencia = 0 real (penaliza, reporte explica). Landing: bloques answer-first 50-200 palabras.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/brand/` | New | Engine Wikipedia/Wikidata |
| `src/lib/contracts/audit-result.ts` | Modified | `brandAuthority` + version 3.0.0 |
| `src/scoring/weights.ts`, `calculator.ts` | Modified | `GEO_SCORE_V3_WEIGHTS`, 6 dims |
| `src/audit/index.ts` | Modified | 6º engine + `emptyBrandResult` |
| `src/report/{domain-metrics,toGeminiViewModel}.ts` | Modified | 6 filas + peso brand |
| `src/platform/per-platform.ts` | Modified | migrar 24 not_measured |
| `src/app/page.tsx`, `src/lib/copy.ts` | Modified | polish landing |
| `src/**/__tests__`, fixtures | Modified | 5→6 dims, v2→v3 |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Version bump rompe persistencia multi-page/share (literal `2.0.0`) | Med | Migrar filas persistidas; validar Zod |
| Brand=0 baja GEO Score de relevy.app (peso 20%) | High | Documentado; polish compensa; score refleja realidad |
| Scoring sobre-inventado (toolkit .py es scaffold) | Med | Validar pesos con datos reales; diseños desde skill |
| Wikipedia/Wikidata bloqueo/rate-limit | Low | Fetch layer SSRF+timeouts; ~2-4 req/audit |

## Rollback Plan

Revertir el change: engine vive en `src/brand/` nuevo (aislado); quitar campo `brandAuthority` + volver `GEO_SCORE_V2_WEIGHTS`/`2.0.0` restaura los scores y fixtures previos. Polish de landing es atómico y revertible.

## Dependencies

- `src/lib/fetch/index.ts` reutilizable (https + SSRF + caps). Sin keys ni deps nuevas (fetch nativo).

## Success Criteria

- [ ] Brand engine mide Wikipedia+Wikidata en todas las auditorías; contrato v3.0.0 valida.
- [ ] `computeGeoScore` suma 100 con 6 dims; tests verdes (actualizados).
- [ ] Landing sube citabilidad ~51→65 con polish completo (FAQ/H2/tabla/byline/pasajes).
- [ ] 24 not_measured: wikipedia/wikidata/entity_consistency conectados; resto TODO.
