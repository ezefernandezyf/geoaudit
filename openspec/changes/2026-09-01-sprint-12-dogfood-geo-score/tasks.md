# Tasks: Sprint 12 — Dogfood: subir el GEO Score de relevy.app

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~250 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| U1 | Fix schema score (contrato → presenters) | PR 1 (único) | `pnpm test src/schema src/report src/pdf src/lib/contracts` | `pnpm dev` — audit real, row "Datos estructurados" muestra score del engine | Revert PR 1; contrato + `domain-metrics.ts` |
| U2 | Landing signals (JSON-LD, FAQ, fechas/byline) | PR 1 (único) | `pnpm test src/app src/lib` | `pnpm verify:scorehero` contra URL landing + `pnpm dev` | Revert PR 1; `brand.ts` + `copy.ts` + `page.tsx` |

> Nota: U1 + U2 van en un único PR (~250 líneas, bajo 400). Se listan como unidades solo para review focado; no se necesita cadena de PRs.

Dependencias: U2 landing no depende de U1 (dominios distintos: contracts/report vs app/lib).

## Phase 1: Fix schema score propagation (contrato → engine → presenters)

- [x] 1.1 RED `src/lib/contracts/audit-result.ts`: agregar `score: z.number().min(0).max(100)` requerido a `schemaResultSchema` (RSC-14)
- [x] 1.2 RED fixture `src/lib/contracts/__fixtures__/audit-result.ts`: `schema = { score: 61, issues: [9 warnings] }` preservando `"Organization missing sameAs"` (RSC-14, D3)
- [x] 1.3 GREEN `src/schema/index.ts`: `toContractResult` → `score: result.score` (RSC-14)
- [x] 1.4 GREEN `src/audit/index.ts`: `emptySchemaResult` → `score: 0` (RSC-14 camino degradado)
- [x] 1.5 `src/report/domain-metrics.ts`: `deriveSchemaScore` → `return schema.score ?? 0`; eliminar proxy `100 - issues*10` (APT-6, D2, guard legado)
- [x] 1.6 Actualizar tests proxy→engine: `toGeminiViewModel.test.ts` L65 (90→61, excellent→fair), `domain-scorecard.test.tsx` (`[71,62,65,61,70]`, `fillOf(61)` amber, `noSchema`/`emptySchema` gana `score:0`), `pdf/report-template.test.ts` L94 (90→61), `findings.test.ts` L96 (severidad desde `schema.score`), `top-findings.test.tsx` (literals schema ganan `score`), `variants.ts` (`emptySchema.score: 0`), `audit-report.test.tsx` (APT-6)

## Phase 2: Landing signals (JSON-LD Organization, FAQ, fechas/byline)

- [x] 2.1 `src/lib/brand.ts`: ampliar constantes verificables — `ORGANIZATION_JSONLD`/`FOUNDER`/`FOUNDING_DATE`/`BRAND_ADDRESS`/`knowsAbout` con datos reales (LND-9)
- [x] 2.2 `src/lib/copy.ts`: `LANDING_COPY.faq` (pares Q&A reales), `datePublished`, byline (LND-13)
- [x] 2.3 `src/app/page.tsx`: enriquecer `OrganizationJsonLd` con `knowsAbout`, `founder`, `address`, `contactPoint`, `email`, `foundingDate` (LND-9)
- [x] 2.4 `src/app/page.tsx`: agregar sección FAQ visible + `datePublished` + byline en contenido; `alt` descriptivo en toda imagen (LND-13). **Desviación aprobada por el orquestador**: NO se emite `<script>` FAQPage (decisión de producto: el motor descuenta FAQPage como deprecado RSC-7)

## Phase 3: Testing / verificación

- [x] 3.1 RED `src/schema/__tests__/index.test.ts`: `toContractResult` mapea `result.score`; fixture 9 warnings → 61 (RSC-14)
- [x] 3.2 `src/app/__tests__/page.test.tsx`: FAQ visible + **sin** FAQPage JSON-LD (decisión de producto, RSC-7); Organization recommended props (LND-9); `datePublished`/byline/alt (LND-13)
- [x] 3.3 `src/lib/brand.test.ts`: asserts de las nuevas constantes reales (LND-9)
- [x] 3.4 Verificación: `pnpm verify:scorehero` corrido (2026-09-01) — re-auditoría real: relevy.app schema 61 (fair) confirmando RSC-14; re-pin `src/app/score-hero-evidence.ts` a moz.com 53 (poor) con desglose real post-fix; llms.txt responde 200 (LND-10 baseline, sin tocar)

## Phase 4: Cleanup

- [x] 4.1 Eliminar todo resto del proxy `100 - issues*10` en presenters/comentarios (APT-6) — el proxy ya no existe en código; solo quedan comentarios que documentan su eliminación
- [x] 4.2 `pnpm run lint && pnpm run format && pnpm test` en verde (0 errores de lint; suite completa 915 passed)
