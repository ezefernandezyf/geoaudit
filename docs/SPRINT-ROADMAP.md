# GeoAudit → Relevy · Roadmap de Estado

> Tablero operativo del proyecto. Fuente de verdad de detalle: `openspec/changes/*` (specs, design, tasks) y `geo-saas-brief.md` §17. Este doc NO duplica el detalle — muestra dónde estamos y hacia dónde vamos.
>
> **✅ Rebranding completado (Sprint 11, archivado 2026-08-31):** el producto ya se llama **Relevy** en toda la app (dominio `relevy.app`, marca en copy/metadata/JSON-LD/assets).
>
> **✅ Brand Authority completado (Sprint 13, archivado 2026-09-01):** 6º engine GEO (Wikipedia/Wikidata) en producción de código, GEO Score v3.0.0 con 6 dimensiones (brand 20%), 4 criterios de platform migrados a measured, landing pulida. Verificado PASS (27/27 requisitos, 48/48 escenarios, 1008 tests).

## Estado actual

| Campo | Valor |
|---|---|
| Rama | `develop` (integración) / `main` (release) |
| Main / Develop | `5176fbf` |
| Tests | **1008 passed / 4 skipped** |
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

## Próximos sprints (plan revisado 2026-09-02)

> El plan original del brief terminaba en "Sprint 7 — Launch". La realidad superó ese plan (Sprints 7-13 reales, con dogfood como Sprint 12 y Brand Authority como Sprint 13). Sprint 13 completó el set de 6 engines del brief §8.1; lo que sigue es la salida oficial.

| Sprint | Contenido | Detalle |
|---|---|---|
| **14 — Launch** | Salida oficial | Stripe producción · Sentry · monitoreo · dominio final · marketing |

## Deudas pendientes (para Sprint 14 — Launch)

- **De Sprint 12**: post-deploy re-audit de `relevy.app` para validar el objetivo 80+ del GEO Score total (ahora con el engine brand activo; la corrida real del verify:scorehero dio 41 en relevy.app — brand 0 por rate_limit, honesto)
- **De Sprint 12**: confirmar el rename manual del repo GitHub `geoaudit` → `relevy` (external pending de Sprint 11 — el remote sigue apuntando a `geoaudit`)
- **De Sprint 12**: smoke en vivo del rebrand en `relevy.app` (confirmación visual en la próxima release)
- **De Sprint 13 (SUGGESTIONs del verify, no bloqueantes)**: (1) alinear la rama degradada de URL inválida en `src/audit/index.ts:226` a `scoringModelVersion: "3.0.0"` (hoy escribe "2.0.0", pre-existente y no persiste); (2) revisar la heurística de `searchWikipedia` por título exacto (marcas con artículo bajo otro título no resuelven — MVP documentado); (3) revisar `brandFromDomain` con dominios compuestos (`brand.example.co` deriva solo "brand")

## Decisiones estratégicas (para no re-preguntar)

| ID | Decisión |
|---|---|
| D1 | **Plataforma**: Vercel Free, sin monetización hasta validar tracción (2026-08-26) |
| D2 | **Migración a Cloudflare**: DIFERIDA — se retoma cuando haya uso real que la justifique |
| D3 | **Nombre**: GeoAudit → **Relevy** (2026-08-30) · dominio `relevy.app` · semi-inventado defendible |
| D4 | **Monetización**: Stripe + tiers pagos ELIMINADOS (Sprint 10) · se reintroduce con Cloudflare al validar |
| D5 | **Límite FREE**: 10 auditorías / 30 días + rate limit 5 req/60s |
| D6 | **PDF**: Puppeteer en Vercel (sin cambios) |
| D7 | **GEO Score**: v3.0.0 · pesos 22.4/19.2/16/11.2/11.2/20 (brand_authority 20%) · bandas 90/75/60/40 · crédito parcial |
| D8 | **Merge**: NUNCA squash+delete en cadena feature-branch-chain · integrar por la punta (ff) · milestone vía release/sprint-N |

---

## Cómo se actualiza

- ✅ → al archivar cada sprint (openspec archive)
- 🟡 → al completar implementación (verify PASS, pendiente deploy/archive)
- 🔄 → work en progreso
- **Próximo**: Sprint 14 (Launch) — Stripe producción + Sentry + dominio final