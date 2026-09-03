# GeoAudit → Relevy · Roadmap de Estado

> Tablero operativo del proyecto. Fuente de verdad de detalle: `openspec/changes/*` (specs, design, tasks) y `geo-saas-brief.md` §17. Este doc NO duplica el detalle — muestra dónde estamos y hacia dónde vamos.
>
> **✅ Rebranding completado (Sprint 11, archivado 2026-08-31):** el producto ya se llama **Relevy** en toda la app (dominio `relevy.app`, marca en copy/metadata/JSON-LD/assets).
>
> **✅ Brand Authority completado (Sprint 13, archivado 2026-09-01):** 6º engine GEO (Wikipedia/Wikidata) en producción de código, GEO Score v3.0.0 con 6 dimensiones (brand 20%), 4 criterios de platform migrados a measured, landing pulida. Verificado PASS (27/27 requisitos, 48/48 escenarios, 1008 tests).
>
> **✅ Geo Calibration completado (Sprint 14, archivado 2026-09-02):** GEO Score v3.1.0 recalibrado con datos reales — pesos 24/23/15/12/14/12 (brand 20→12), bandas 80/65/50/30, rescale AIO ×100/70, uniqueness floor 35, semver como stat, coverage 60, brand eTLD+1, proxy changelog. Verificado PASS WITH WARNINGS (13/13 requisitos, 40/40 escenarios, 1038 tests). Evidencia ScoreHero real: relevy.app 62 (promedio corpus 42.4). relevy.app subió 46 → 62.
>
> **✅ Polish Final completado (Sprint 15, archivado 2026-09-03):** barra benchmark critical→excellent (rojo izq, verde der), score 100 sin clip, menú hamburguesa mobile, copy sincronizado a v3.1.0 (24/23/15/12/14/12, "octava parte", hero names-only), tabla comparativa scrollable en mobile, entrada "Exportar PDF" en el reporte live, tech debts (branch degradado 3.1.0, lint ignora coverage/, benchmark RGS-1 refrescado al corpus medido). Verificado PASS WITH WARNINGS (11/11 requisitos, 30/30 escenarios, 1052 tests). develop = f5f14a6 = PR #70 (size:exception de maintainer).

## Estado actual

| Campo | Valor |
|---|---|
| Rama | `develop` (integración) / `main` (release) |
| Main / Develop | `8c58dc7` / `f5f14a6` |
| Tests | **1052 passed / 4 skipped** |
| Deploy | Vercel Free · `relevy.app` (dominio nuevo, env configurado) |
| Nombre de marca | **Relevy** |
| Preflight | interactive · both (openspec+engram) · ask-on-risk · 400 líneas · strict TDD |
| Git | feature branches desde `develop` · chained PRs (feature-branch-chain) · milestone vía `release/sprint-N` |

---

## Sprints completados ✅

| Sprint | Change | Estado |
|---|---|---|
| 0 | Setup & Scaffold | ✅ archivado |
| 1 | Core Audit Engine (8 engines + orchestrator) | ✅ archivado · 299 tests |
| 2 | Free Audit Flow | ✅ archivado |
| 3 | Auth & Dashboard | ✅ archivado |
| 4 | Stripe Integration | ✅ archivado (luego ELIMINADO en Sprint 10) |
| 5 | Pro Features (multi-page, PDF, share) | ✅ archivado |
| 6 | UI Redesign | 🔄 change activo sin archivar (contenido absorbido por Sprints 7-8) |
| 7 | UI Fidelity | ✅ archivado · milestone main `dae5c1c` |
| 8 | Polish & Testing + Backlog UI | ✅ archivado · milestone main `894d90c` |
| 9 | Auditoría & Calibración (GEO Score v2.0.0, pesos 28/24/20/14/14) | ✅ archivado · milestone main `e0d064c` |
| 10 | **Free Mode** (eliminación Stripe + tiers pagos, límite FREE 10/30d, deploy Vercel) | ✅ archivado |
| 11 | **Rebrand & Polish** (rename GeoAudit → Relevy + pulido) | ✅ archivado · milestone main `5273c39` |
| 12 | **Dogfood: subir el GEO Score de relevy.app** (schema score real 61 en desglose, JSON-LD completo, FAQ, fechas/byline) | ✅ archivado · main = develop = `cc01c84` · 915 tests · verificación en vivo: schema 61 real, llms.txt 200 |
| 13 | **Brand Authority** (6º engine Wikipedia/Wikidata, GEO Score v3.0.0 con brand 20%, 4 criterios platform migrados, polish landing) | ✅ archivado · main = develop = `5176fbf` · 1008 tests · verify PASS 27/27 · evidencia ScoreHero real: moz.com 53 |
| 14 | **Geo Calibration v3.1** (pesos 24/23/15/12/14/12, bandas 80/65/50/30, v3.1.0, rescale AIO ×100/70, floor uniqueness 35, semver, coverage 60, eTLD+1, proxy changelog, benchmark ScoreHero 80/65/50/30) | ✅ archivado · main = develop = `8c58dc7` · 1038 tests · verify PASS WITH WARNINGS 13/13 · evidencia ScoreHero: relevy.app **62** (promedio corpus 42.4) · relevy.app 46 → 62 |
| 15 | **Polish Final** (barra benchmark critical→excellent, score 100 sin clip, hamburguesa mobile, copy v3.1.0 + hero names-only, tabla responsive, entrada "Exportar PDF" en reporte live, branch degradado 3.1.0, lint ignora coverage/, benchmark RGS-1 al corpus medido) | ✅ archivado · develop = `f5f14a6` = PR #70 · 1052 tests · verify PASS WITH WARNINGS 11/11 · 30/30 |

## Próximos sprints (plan revisado 2026-09-03)

> El plan original del brief terminaba en "Sprint 7 — Launch". La realidad superó ese plan (Sprints 7-15 reales, con dogfood como Sprint 12, Brand Authority como Sprint 13, Geo Calibration v3.1 como Sprint 14 y Polish Final como Sprint 15). La salida oficial ya NO incluye Stripe: la monetización se reintroduce solo al validar tracción (D4). Lo que sigue sube el GEO Score de la landing (Sprint 16) y cierra el free (Sprint 17).

| Sprint | Contenido | Detalle |
|---|---|---|
| **16 — Score Up** | Subir el GEO Score de relevy.app | Landing content 55→70+: citabilidad (pasajes/FAQ), E-E-A-T (autor, fechas, byline), brand presence (menciones, llms.txt) · re-audit post-deploy hacia el objetivo 80+ (62 hoy en v3.1) |
| **17 — Close Free** | Cierre del free (salida oficial sin Stripe) | Sentry (monitoreo) · brand presence final · announce/marketing · dominio final · remote local → `relevy.git` (cosmético) |

## Deudas pendientes (para Sprints 16-17 — Score Up y Close Free)

- **De Sprint 14 (resueltas por Sprint 15)**: (1) refrescar los rangos predichos del escenario RGS-1 (moz 58-63, relevy 50-54, "nada <25") → REFRESCADOS al corpus medido (moz 57, relevy 55, promedio 42.4, 14 URLs, Anthropic eTLD+1 — T8 del Sprint 15, docs-only); (2) excluir `coverage/` del lint → RESUELTO (`eslint.config.mjs` ignora `coverage/**`, T7 del Sprint 15).
- **De Sprint 12 → Sprint 16 (Score Up)**: post-deploy re-audit de `relevy.app` para seguir subiendo el GEO Score (62 hoy en v3.1; objetivo 80+ sigue abierto — la recalibración v3.1 ya demostró el techo alcanzable sin Wikipedia). Sprint 16 lleva la landing de 55 a 70+ con citabilidad/E-E-A-T/brand presence.
- **De Sprint 13 (resueltas por Sprint 14)**: (1) `brandFromDomain` con dominios compuestos → FIXED (eTLD+1 + `MULTI_PART_TLDS`, T12); (2) `searchWikipedia` por título exacto → FIXED (comparación case-insensitive en `probes.ts`, T12 — limitación MVP de título alternativo documentada); (3) rama degradada de URL inválida escribiendo "2.0.0" → DECISIÓN documentada en design D (resultado degradado no es audit real, se conserva "2.0.0").
- **Resuelta**: rename manual del repo GitHub `geoaudit` → `relevy` (external pending de Sprint 11) — renombrado en GitHub, el alias redirige; queda pendiente (cosmético) actualizar el remote local a `git@github.com:ezefernandezyf/relevy.git` en Close Free (Sprint 17).

## Decisiones estratégicas (para no re-preguntar)

| ID | Decisión |
|---|---|
| D1 | **Plataforma**: Vercel Free, sin monetización hasta validar tracción (2026-08-26) |
| D2 | **Migración a Cloudflare**: DIFERIDA — se retoma cuando haya uso real que la justifique |
| D3 | **Nombre**: GeoAudit → **Relevy** (2026-08-30) · dominio `relevy.app` · semi-inventado defendible |
| D4 | **Monetización**: Stripe + tiers pagos ELIMINADOS (Sprint 10) · se reintroduce con Cloudflare al validar |
| D5 | **Límite FREE**: 10 auditorías / 30 días + rate limit 5 req/60s |
| D6 | **PDF**: Puppeteer en Vercel (sin cambios) |
| D7 | **GEO Score**: v3.1.0 · pesos 24/23/15/12/14/12 (brand_authority 12%) · bandas 80/65/50/30 · crédito parcial · rescale AIO ×100/70 · recalibración con datos reales (sprint 14) |
| D8 | **Merge**: NUNCA squash+delete en cadena feature-branch-chain · integrar por la punta (ff) · milestone vía release/sprint-N |

---

## Cómo se actualiza

- ✅ → al archivar cada sprint (openspec archive)
- 🟡 → al completar implementación (verify PASS, pendiente deploy/archive)
- 🔄 → work en progreso
- **Próximo**: Sprint 16 (Score Up) — landing content 55→70+ (citabilidad/E-E-A-T/brand presence)