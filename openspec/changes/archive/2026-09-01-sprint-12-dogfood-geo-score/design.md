# Design: Sprint 12 — Dogfood: subir el GEO Score de relevy.app

## Contexto

`deriveSchemaScore` (`src/report/domain-metrics.ts`) reconstruye el score de schema como `100 - issues.length * 10`. El engine real ya calcula un rubric score 0-100 (`SchemaEngineResult.score`, 12 criterios, RSC-13) y el GEO Score compuesto ya consume `engines.schema.score`; pero el contrato `SchemaResult` no lo expone, así que web (`DomainScorecard`), PDF (`report-template`) y findings (severidad) muestran el proxy ("Datos estructurados 10" cuando el engine da 61). El fix propaga el score real por el contrato y enriquece la landing (JSON-LD, FAQ, fechas, byline, alt) para subir el score de relevy.app (hoy 47).

## Decisiones clave

| Decisión | Alternativa | Trade-off | Elección |
|---|---|---|---|
| **D1** Propagación de `score` (RSC-14) | `score` requerido en Zod | `.optional()` + fallback en derivación | Requerido fuerza al compilador a que todo productor ponga el valor honesto; `.optional()` reabre el agujero del proxy | `score: z.number().min(0).max(100)` **requerido**; `toContractResult` mapea `result.score`; `emptySchemaResult` → `score: 0` |
| **D2** `deriveSchemaScore` (APT-6) | Redefinir a `schema.score` | Mantener proxy como fallback | El fallback reabre la reconstrucción que el spec elimina; la derivación única vive en `domain-metrics` (web/PDF/findings) | `return schema.score`; el proxy `100 - issues*10` se **elimina** |
| **D3** Fixture (RSC-14/APT-6) | `score: 61` + 9 issues | Mantener 1 issue/score 90 | El RED test debe esperar 61 (engine), no 90 (proxy). Se preserva `"Organization missing sameAs"` como primera issue | `auditResultFixture.schema = { score: 61, issues: [9 warnings] }` |
| **D4** FAQ + FAQPage (LND-13) | Sección visible + FAQPage JSON-LD desde una sola fuente | FAQPage separada/sin sección | El propio engine marca FAQPage como `deprecated_faqpage` (RSC-7) y el criterio 12 "No deprecated" descuenta 5 pts | **RECONCILIADO (2026-09-01)**: FAQ visible SIN FAQPage JSON-LD — decisión de producto del orquestador (el engine descuenta FAQPage como deprecado RSC-7). La spec LND-13 reconcilia el texto para reflejar el estado final; el trade-off original (citabilidad ↑, schema −5) motivó la omisión |
| **D5** Constantes landing (LND-9) | Constantes en `brand.ts` + `copy.ts` | Literales inline en JSX | Duplicar JSON-LD/copy viola la regla de fuente única (copy.ts ya es SSOT) | Ampliar `brand.ts` (verificable) + `LANDING_COPY.faq` en `copy.ts` |
| **D6** Fechas/byline/alt (LND-13) | Constantes de fecha/autor reales | Hardcode en JSX | Nada inventado (LND-7); hoy la landing **no tiene `<img>`** (alt se satisface en `og:image`/futuras img) | `datePublished`/byline reales en copy.ts; alt descriptivo en toda imagen |

## Arquitectura / approach por dominio

- **contracts**: `schemaResultSchema` + `SchemaResult` ganan `score` (0-100). Fixture gana `score: 61` y 9 issues.
- **schema-engine**: `toContractResult` mapea `result.score` (el top-level, = `rubric.score`). `types.ts` sin cambios (ya tiene `score`).
- **audit**: `emptySchemaResult` (privado) gana `score: 0`; cubre el camino degradado (RGS-9) sin romper Zod.
- **report**: `deriveSchemaScore` se redefine; `rowScore` y `deriveFindings` no cambian (ya consumen `deriveSchemaScore`).
- **landing**: `brand.ts` (+`knowsAbout`/`contactPoint`/`email` verificables), `copy.ts` (`LANDING_COPY.faq`, `datePublished`, byline), `page.tsx` (Organization enriquecida, FAQ sección visible **sin** FAQPage JSON-LD, fechas/byline, alt).

## Archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/lib/contracts/audit-result.ts` | Modify | `schemaResultSchema.score` (bounded 0-100) + `SchemaResult` |
| `src/lib/contracts/__fixtures__/audit-result.ts` | Modify | `schema.score: 61` + 9 issues |
| `src/schema/index.ts` | Modify | `toContractResult` → `score: result.score` |
| `src/audit/index.ts` | Modify | `emptySchemaResult` → `score: 0` |
| `src/report/domain-metrics.ts` | Modify | `deriveSchemaScore` → `schema.score` |
| `src/lib/brand.ts` | Modify | `ORGANIZATION_JSONLD`/`FOUNDER`/`FOUNDING_DATE` (datos reales) |
| `src/lib/copy.ts` | Modify | `LANDING_COPY.faq`, `datePublished`, byline |
| `src/app/page.tsx` | Modify | Organization enriquecida, FAQ visible (sin FAQPage JSON-LD), fechas/byline/alt |
| `src/app/score-hero-evidence.ts` | Modify (verificación) | re-pin con la re-auditoría de relevy.app |

## Tests

TDD contrato primero: RED con fixture `score: 61`/9 warnings → espera 61.

- **Nuevos**: `schema/index.test.ts` (toContractResult mapea score, RSC-14); `page.test.tsx` (FAQ visible sin FAQPage JSON-LD, Organization recommended props LND-9, fechas/byline/alt LND-13).
- **Actualizados (proxy → engine)**: `toGeminiViewModel.test.ts` L65 (90→61, "excellent"→"fair"); `domain-scorecard.test.tsx` ("90"→"61", `[71,62,65,61,70]`, `fillOf(61)` amber, `noSchema` gana `score:0`); `pdf/report-template.test.ts` L92-95 (90→61); `findings.test.ts` L96 (severidad desde `schema.score`); `top-findings.test.tsx` (inline schema literals ganan `score`); `variants.ts` (`emptySchema.score: 0`).
- **Sin cambios**: `run-audit.test.ts` (ya usa `scoreSchema($).score`), `scoring/calculator.test.ts`.

## Trade-offs y riesgos

1. **Legado persistido**: filas `Audit.result` viejas se leen con `as unknown as AuditResult` (sin re-parseo Zod) y no tienen `schema.score` → `deriveSchemaScore` devolvería `undefined`. Mitigación: guard defensivo `?? 0` (nunca el proxy) o re-auditar; producto joven, bajo volumen. **Open question**.
2. **FAQPage vs engine**: emitir FAQPage dispara `deprecated_faqpage` (docking ~5 pts schema). **Decisión final (2026-09-01)**: NO se emite FAQPage (decisión de producto) — FAQ visible solamente; el trade-off neto (citabilidad vs schema) se validará en la re-auditoría post-deploy.
3. **Datos reales (LND-7)**: `founder`, `address`, `foundingDate`, `sameAs` extra requieren datos reales del usuario; no inventar. Bloqueados hasta confirmación.
4. **80+ no garantizado**: objetivo-alcance 70-75 sólido = sprint ganado (propuesta).

## Notas de implementación (orden)

1. Contrato: `score` en `schemaResultSchema` + fixture (RED).
2. `toContractResult` + `emptySchemaResult` (GREEN engine).
3. `deriveSchemaScore` redefinida → presenters web/PDF/findings GREEN (actualizar ~7 tests).
4. Landing: JSON-LD enriquecido, FAQ visible (sin FAQPage JSON-LD), fechas/byline/alt.
5. Verificación: re-auditar relevy.app (`pnpm verify:scorehero` con la URL de landing), re-pin `score-hero-evidence.ts`, confirmar llms.txt 200 (LND-10 no se toca).

## Open Questions

- [ ] `founder`, `address`, `foundingDate` reales de Relevy (bloquea LND-9 completo).
- [ ] `sameAs` reales adicionales (LinkedIn/X) o solo el repo.
- [ ] Manejo de legado `Audit.result` sin `score`: guard `?? 0` vs re-auditoría.
