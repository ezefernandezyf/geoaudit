# Proposal: Sprint 12 — Dogfood: subir el GEO Score de relevy.app

## Intent

Subir el GEO Score de la landing de Relevy (hoy 47/100) y corregir el bug de presentación que muestra "Datos estructurados 10" en el desglose cuando el engine real da 61. Dogfooding: un SaaS de auditoría GEO debe auditarse a sí mismo y reportar números honestos. El desglose inconsistente es un defecto visible para cualquier prospecto que audite relevy.app, y la mejora real de la landing valida el producto como prueba social.

## Scope

### In Scope
- Fix de desglose: `deriveSchemaScore` debe usar el `score` real del engine, unificando con el GEO Score (que ya usa `engines.schema.score`). Implica propagar `score` en el contrato `SchemaResult` (`schemaResultSchema`, `toContractResult` en `src/schema/index.ts`, `emptySchemaResult`) y actualizar tests que asertan el derivado viejo (`100 - issues*10`).
- Landing — JSON-LD: enriquecer `Organization` (knowsAbout, founder, address, contactPoint, email, foundingDate; verificar sameAs reales). Hoy faltan 9 propiedades recomendadas.
- Landing — FAQ: sección visible con preguntas reales + FAQPage JSON-LD.
- Landing — fechas (`datePublished`) y byline de autor en secciones de contenido; alt text en imágenes.
- Verificar llms.txt en prod (hoy responde 200; el 404 del explore fue timing de deploy) y re-auditar como baseline.
- Opcional si el presupuesto da: pasajes de citabilidad autocontenidos, señales E-E-A-T adicionales.

### Out of Scope
- NO tocar el motor de scoring (`src/scoring/`).
- NO cambiar el clasificador de negocio hybrid→saas (se documenta como hallazgo: copy en español no matchea patrones saas).
- NO Brand Authority (Sprint 13) ni Launch (Sprint 14).
- NO reescribir la landing ni cambiar el diseño visual.
- NO tocar docs/openspec ni el pipeline PDF salvo el fix compartido.

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `audit-presenters`: APT-6 — la fila "Datos estructurados" debe usar `schema.score` del engine, no el proxy `deriveSchemaScore`.
- `schema-engine`: `SchemaResult` (contrato) gana `score`; `toContractResult` mapea el rubric score (RSC-13).
- `landing-page`: LND-9 ampliado (JSON-LD completo); nueva LND-13 FAQ/fechas/byline; LND-10 verificación llms.txt.

## Approach

1. Contrato primero (TDD): agregar `score` a `schemaResultSchema` + fixture; mapear en `toContractResult`; `deriveSchemaScore` lee `schema.score`. Test rojo con fixture de 9 warnings (espera 61, no 10).
2. Landing: ampliar JSON-LD en `src/app/page.tsx`, FAQ/byline/fechas vía copy (`src/lib/copy.ts`), alt en imágenes.
3. Re-auditar relevy.app con desglose real; iterar citabilidad/E-E-A-T solo si el presupuesto alcanza.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/contracts/audit-result.ts` | Modified | `schemaResultSchema` + fixture gana `score` |
| `src/schema/index.ts` | Modified | `toContractResult` mapea rubric score |
| `src/report/domain-metrics.ts` | Modified | `deriveSchemaScore` lee `schema.score` |
| `src/report/presenters/findings.ts` | Modified | severidad de hallazgos usa el score real |
| `src/app/page.tsx`, `src/lib/copy.ts` | Modified | JSON-LD, FAQ, fechas, byline |
| Tests: findings, domain-scorecard, PDF | Modified | asertan el score real, no el proxy |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cambio de contrato rompe PDF/reportes | Med | Derivación única en `domain-metrics`; tests compartidos |
| 80+ no alcanzable sin contenido profundo | Alta | Objetivo-alcance: 70-75 sólido = sprint ganado |
| Baseline ya cambió en prod (llms.txt) | Med | Re-auditar antes de implementar |

## Rollback Plan

Revert del commit del contrato — cambio aditivo (`score` opcional en Zod). JSON-LD/copy son aditivos en SSR; reversión directa.

## Dependencies

- Deploy actual de `develop`/`main` (llms.txt ya en prod, verificar baseline).
- Datos reales de Relevy para `founder`/`address`/`contactPoint` (nada inventado, LND-7).

## Success Criteria

- [ ] Desglose de schema == engine score en reporte web y PDF (test verde).
- [ ] Re-auditoría de relevy.app ≥ 75 (ideal 80+).
- [ ] Cero regresiones: `pnpm test`, lint, typecheck.
