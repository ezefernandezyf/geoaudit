# Proposal: Sprint 9 — Audit Calibration (Dogfooding + Recalibración del GEO Score)

## Intent

**Hallazgo central del dogfooding**: GeoAudit se auditó a sí mismo con su propio engine. La landing (`geoaudit-tau.vercel.app`) obtuvo **GEO Score 20 (Critical)** — desglose: crawler 90, citabilidad 19.9, E-E-A-T 12, schema 0, platform 5. La landing no tiene JSON-LD, ni robots.txt/llms.txt, ni pasajes autocontenidos.

Este sprint hace dos cosas: (1) **corregir lo que la auditoría encuentra**, empezando por la propia landing, para que el producto predique con el ejemplo; y (2) **recalibrar el GEO Score** porque el engine aplasta — el mejor caso real observado (moz.com) da 48, y ningún perfil realista alcanza 60+. Hoy las rúbricas de citability (31.25%, el peso más alto) y schema no dan crédito parcial, E-E-A-T exige señales que webs comerciales no tienen, y platform tiene techo duro de 70.

NO toca deploy (Sprint 10 — Cloudflare). NO implementa Brand Authority (Sprint 11).

## Scope

### In Scope

**WU-1 — Auditar y corregir la landing** (auditoría YA hecha: score 20)
- Fixes de la landing para subir el score: JSON-LD (Organization + WebSite), `robots.txt` + `sitemap.xml`, `llms.txt`, pasajes citable (copy answer-first con stats/datos), señales E-E-A-T.
- Cerrar **A3.2**: fijar evidencia real del ScoreHero (score verificado + `auditDate` + `categoryScores`, no placeholder).

**WU-2 — Diagnóstico de calibración (PRIMERO, con datos)**
- Correr `diag/scorehero-breakdown` sobre ~13 URLs reales → tabla de desglose por categoría → decisión del usuario con evidencia. NO recalibrar a ciegas.

**WU-3 — Calibración implementada (decisión de WU-2)**
- Recomendación técnica: **(b) suavizar rúbricas con crédito parcial + (c) re-balance moderado** (mantener bandas honestas y citability dominante).
- Bump obligatorio `scoringModelVersion` → **`2.0.0`** (contrato + fixture + delta spec).

**WU-4 — Fixes de la auditoría de código**
- Security headers (CSP/HSTS), voseo residual `dashboard-empty-state` + test, README real, 4 fixes a11y de 1 línea, docs stale (`.env.example`, `AGENTS.md`).

### Out of Scope

- Deploy a Cloudflare (Sprint 10). Brand Authority engine (Sprint 11 — WU-5 diferido).
- Cambios de pricing/Stripe/auth/prisma schema. Nuevas features de negocio. Re-mappear bandas como inflación (opción a, descartada).

## Capabilities

### New Capabilities
- _(ninguna)_

### Modified Capabilities
- `geo-score-calculator`: pesos (RGS-1), bandas (RGS-5), `scoringModelVersion` v2.0.0 (RGS-7).
- `citability-engine`: crédito parcial en rúbricas (answer/structure/stats).
- `eeat-engine`: crédito parcial en authoritativeness.
- `schema-engine`: puntos intermedios en criterios (hoy 0/5/10/15).
- `landing-page`: JSON-LD, robots/sitemap/llms.txt, contenido citable, señales E-E-A-T.
- `accessibility`: 4 fixes a11y (aria-progressbar-name, contrastes, label-content-name-mismatch).
- `dashboard`: voseo `dashboard-empty-state` → neutro.

## Approach

- **WU-1**: assets estáticos en `public/` (robots.txt, sitemap.xml, llms.txt) + JSON-LD vía `script type="application/ld+json"` en la landing + reescritura de copy hero/features con pasajes answer-first y stats. A3.2: reemplazar `src/app/score-hero-evidence.ts` con el run real ya ejecutado (score 20 → luego el post-fix).
- **WU-2**: ejecutar el script de la rama `diag/scorehero-breakdown`, consolidar tabla por categoría, presentar decisión de calibración al usuario.
- **WU-3**: suavizar rúbricas en `src/citability/`, `src/eeat/`, `src/schema/` (crédito parcial) + ajustar `src/scoring/weights.ts` y `toGeminiViewModel.ts` (`ENGINE_WEIGHT`) + bump `z.literal("2.0.0")` en `src/lib/contracts/audit-result.ts:88`, `src/audit/index.ts:205/366/474`, fixture, y delta spec. Re-verificar contra corpus (mejores reales 60-75+).
- **WU-4**: `headers()` con CSP/HSTS en `next.config.ts`; `dashboard-empty-state.tsx` → `DASHBOARD_COPY.empty` + ampliar `copy.test.ts`; README real; fixes a11y; docs.

## Decisions (vinculantes del usuario)

1. **WU-1** — Auditar la landing (hecho: score 20) + fixes para subir el score + cerrar A3.2 con evidencia real.
2. **WU-2** — Diagnóstico de calibración PRIMERO (diag → tabla → decisión). No recalibrar a ciegas.
3. **WU-3** — Calibración según decisión de WU-2 (recomendación: b+c). Bump v2.0.0 + contrato + delta spec.
4. **WU-4** — Fixes de auditoría de código (headers, voseo, README, a11y, docs).
5. **WU-5** — Brand Authority DIFERIDO al Sprint 11.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `public/` (robots.txt, sitemap.xml, llms.txt) | New | Assets de SEO/IA para la landing |
| `src/app/page.tsx`, `src/app/score-hero-evidence.ts` | Modified | JSON-LD + evidencia real ScoreHero (A3.2) |
| `src/lib/contracts/audit-result.ts` | Modified | `scoringModelVersion: z.literal("2.0.0")` |
| `src/audit/index.ts` | Modified | Literal del contrato (3 sitios) + fixture |
| `src/scoring/weights.ts`, `src/scoring/calculator.ts` | Modified | Re-balance pesos + tests |
| `src/citability/`, `src/eeat/`, `src/schema/` | Modified | Crédito parcial en rúbricas |
| `src/report/toGeminiViewModel.ts` | Modified | `ENGINE_WEIGHT` consistente con v2 |
| `src/dashboard/dashboard-empty-state.tsx` | Modified | Voseo → neutro |
| `next.config.ts` | Modified | Security headers (CSP/HSTS) |
| `README.md`, `.env.example`, `AGENTS.md` | Modified | Docs reales |
| `src/ui/score-bar.tsx`, `src/billing/pricing-cards.tsx`, navbar | Modified | 4 fixes a11y |
| `openspec/specs/geo-score-calculator/spec.md` | Modified | Delta RGS-1/RGS-5/RGS-7 v2.0.0 |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Calibración rompe decenas de tests de engine (scores exactos) | High | TDD: actualizar asserts según rúbricas nuevas; re-verificar corpus |
| Cambio de contrato `z.literal("1.0.0")` propaga a lectores (PDF/presenters/share) | Med | Delta spec + migración de todos los lectores del contrato |
| Recalibrar a ciegas (sin run de WU-2) = inflación | Med | WU-2 es prerequisito de la decisión; nunca re-mappear sin evidencia |
| El score post-fix de la landing no llega a 60+ | Med | Priorizar JSON-LD + pasajes citable + stats (mayor impacto); documentar si queda en 50-59 |
| Security headers rompen assets inline/third-party | Med | CSP en report-only primero, luego enforce; testear landing/report |
| >400 líneas totales | High | Chained PRs por WU; forecast en sdd-tasks + ask-on-risk |

## Rollback Plan

Cada WU es un PR atómico revertible. WU-1/WU-4 tocan solo assets estáticos, UI y config (rollback localizado). WU-3 (calibración) es revertible porque el bump de `scoringModelVersion` es explícito: revertir = volver el literal a `"1.0.0"`, revertir `weights.ts`/rúbricas y el delta spec. Los assets de `public/` son aditivos (borrar = volver atrás sin efecto en el engine). Sin migraciones de DB.

## Work Units

| WU | Contenido | Est. líneas | Riesgo |
|----|-----------|-------------|--------|
| WU-1 | Fixes landing + A3.2 (JSON-LD, robots/sitemap/llms.txt, copy citable, E-E-A-T) | ~300-500 | Bajo-Medio |
| WU-2 | Diagnóstico calibración (diag script → tabla → decisión) | ~0-100 | Bajo |
| WU-3 | Calibración (b+c) + bump v2.0.0 + contrato + delta spec + re-verificación | ~400-800 | Medio-Alto |
| WU-4 | Fixes código (headers, voseo, README, a11y, docs) | ~200-350 | Bajo-Medio |

**Total estimado**: ~900-1.750 líneas → `400-line budget risk: High` · `Chained PRs recommended: Yes` · `Decision needed before apply: Yes`.

## Dependencies

- URL de deploy real ya disponible (`geoaudit-tau.vercel.app` — auditoría ya ejecutada).
- Rama `diag/scorehero-breakdown` para WU-2.
- `src/audit/index.ts` (`runAudit`) disponible para re-verificación del corpus.

## Success Criteria

- [ ] La landing pasa de 20 a **60+ (Fair/Good)** con los fixes de WU-1.
- [ ] GEO Score v2.0.0 discrimina: las mejores webs reales caen en **60-75+**, no todas en 20-50.
- [ ] A3.2 cerrado: ScoreHero muestra score verificado (no placeholder) con `auditDate` + `categoryScores`.
- [ ] Security headers (CSP/HSTS) presentes; voseo eliminado; README real; 4 fixes a11y aplicados.
- [ ] 974+ tests intactos + los nuevos; `pnpm test` · lint · typecheck · build verdes.
