# GeoAudit → Relevy · Roadmap de Estado

> Tablero operativo del proyecto. Fuente de verdad de detalle: `openspec/changes/*` (specs, design, tasks) y `geo-saas-brief.md` §17. Este doc NO duplica el detalle — muestra dónde estamos y hacia dónde vamos.
>
> **🔄 Rebranding en curso (2026-08-30):** GeoAudit pasa a llamarse **Relevy** (dominio `relevy.app` comprado). El código todavía dice GeoAudit — el rename es el Sprint 11.

## Estado actual

| Campo | Valor |
|---|---|
| Rama | `develop` (integración) / `main` (release) |
| Main / Develop | `d5e9e82` |
| Tests | **876 passed / 4 skipped** |
| Deploy | Vercel Free · `relevy.app` (dominio nuevo, env configurado) |
| Nombre de marca | 🔄 GeoAudit → **Relevy** |
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
| 10 | **Free Mode** (eliminación Stripe + tiers pagos, límite FREE 10/30d, deploy Vercel) | 🟡 implementado 5/5 WUs · verify PASS WITH WARNINGS (876 tests) · **pendiente: smoke en vivo + archive** |

## Próximos sprints (plan revisado 2026-08-30)

> El plan original del brief terminaba en "Sprint 7 — Launch". La realidad superó ese plan (Sprints 7-10 reales). El rename a Relevy reordena el final del roadmap.

| Sprint | Contenido | Detalle |
|---|---|---|
| **11 — Rebrand & Polish** 🆕 | Rename GeoAudit → **Relevy** en toda la app + pulido | copy/metadata/títulos/JSON-LD/robots/sitemap/emails · favicon con identidad Relevy · mail de contacto real (`ezefernandezyf@gmail.com`) · flujo "logueate para auditar" para anónimos · **bug citability** (mismos pasajes como mejores y peores) · copywriting a versión actual · rename del repo GitHub |
| **12 — Brand Authority** | 6º engine (20%) | rastreo de menciones de marca en plataformas que las IA usan para decidir citas (port de `brand_scanner.py` del toolkit) |
| **13 — Launch** | Salida oficial | Stripe producción · Sentry · monitoreo · marketing |

## Deudas pendientes del Sprint 10 (para el archive y Sprint 11)

- Smoke en vivo post-deploy (audit + login + PDF en `relevy.app`) — **bloqueado por el 404 de GitHub OAuth en producción**
- Post-deploy re-audit de la landing (cerrar A3.2 con evidencia real)
- `LEGAL_COPY` con referencias a "Planes y facturación"/"procesar pagos" (term/privacy)
- Pill de perfil `free` minúscula vs "Plan Free" de navbar
- Excluir `coverage/` del lint

## Decisiones estratégicas (para no re-preguntar)

| ID | Decisión |
|---|---|
| D1 | **Plataforma**: Vercel Free, sin monetización hasta validar tracción (2026-08-26) |
| D2 | **Migración a Cloudflare**: DIFERIDA — se retoma cuando haya uso real que la justifique |
| D3 | **Nombre**: GeoAudit → **Relevy** (2026-08-30) · dominio `relevy.app` · semi-inventado defendible |
| D4 | **Monetización**: Stripe + tiers pagos ELIMINADOS (Sprint 10) · se reintroduce con Cloudflare al validar |
| D5 | **Límite FREE**: 10 auditorías / 30 días + rate limit 5 req/60s |
| D6 | **PDF**: Puppeteer en Vercel (sin cambios) |
| D7 | **GEO Score**: v2.0.0 · pesos 28/24/20/14/14 · bandas 90/75/60/40 · crédito parcial |
| D8 | **Merge**: NUNCA squash+delete en cadena feature-branch-chain · integrar por la punta (ff) · milestone vía release/sprint-N |

---

## Cómo se actualiza

- ✅ → al archivar cada sprint (openspec archive)
- 🟡 → al completar implementación (verify PASS, pendiente deploy/archive)
- 🔄 → work en progreso
- **Próximo**: Sprint 11 (Rebrand & Polish) — planificar tras resolver el 404 de GitHub OAuth