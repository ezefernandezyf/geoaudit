# Sprint 1 — Core Audit Engine · Roadmap de Estado

> Tablero operativo del sprint activo. Fuente de verdad de detalle: `openspec/changes/sprint-1-audit-engine/` (specs, design, tasks) y `geo-saas-brief.md` §17. Este doc NO duplica el brief — muestra dónde estamos.

**Objetivo (brief §17):** Crawler Access Map · Citability Engine · Schema Engine · Content E-E-A-T · Platform Engine · GEO Score Calculator — como funciones puras, fixture-testeadas, más la capa de fetch segura y el orquestador `runAudit(url)`.

| Campo | Valor |
|---|---|
| Branch | `feat/sprint-1-audit-engine` (desde `develop`) |
| Commits | 28 |
| Tests | **299 passed / 1 skipped** |
| Typecheck / Lint | limpio / 0 errores |
| Delivery | 8 PRs encadenados · `feature-branch-chain` |
| Preflight | interactive · both · ask-on-risk · 400 líneas · strict TDD |

---

## Work Units (orden de implementación)

| Unit | Tareas | Contenido | PR | Estado |
|---|---|---|---|---|
| U1 | T1-T7 | Fetch layer + contratos compartidos | PR1 | ✅ done · 98 tests |
| U2 | T8-T10 | Crawler access map (17 bots + RFC 9309 + composite) | PR2 | ✅ done · 151 tests |
| U3 | T11-T14 | Citability engine (extract, segment, 5-dim scorer, rewrite) | PR3 | ✅ done · 185 tests |
| U4 | T15-T16 | E-E-A-T engine (4×25, meta, composite) | PR4 | ✅ done · 210 tests |
| U5 | T17-T20 | Schema engine (JSON-LD parse/validate/generate) | PR5 | ✅ done · 245 tests |
| U6 | T21-T23 | Platform readiness (headers, meta, SSR, probes) | PR6 | ✅ done · 274 tests |
| U7 | T24 | GEO Score calculator (weights v1.0.0 + bandas) | PR7 | ✅ done · 290 tests |
| U8 | T25 | Orquestador `runAudit(url)` | PR8 | ✅ done · 299 tests |

## Capabilities (specs del change)

| Capability | Spec | Estado |
|---|---|---|
| `audit-fetch-layer` | 12 reqs / 14 scenarios | ✅ implementada (U1) |
| `crawler-access-map` | 11 reqs / 16 scenarios | ✅ implementada (U2) |
| `citability-engine` | 14 reqs / 12 scenarios | ✅ implementada (U3) |
| `eeat-engine` | 10 reqs / 12 scenarios | ✅ implementada (U4) |
| `schema-engine` | 12 reqs / 12 scenarios | ✅ implementada (U5) |
| `platform-readiness` | 11 reqs / 10 scenarios | ✅ implementada (U6) |
| `geo-score-calculator` | 10 reqs / 9 scenarios | ✅ implementada (U7) |
| `audit-orchestrator` | 14 reqs / 10 scenarios | ✅ implementada (U8) |

**Totales:** 94 requirements · 95 scenarios · 25 tareas · **25/25 completadas ✅**

---

## Decisiones clave del sprint (para no re-preguntar)

| ID | Decisión |
|---|---|
| P1 | Brand Authority 20% → **renormalizado** a los 5 engines (weights v1.0.0) |
| P2 | **Solo https** (http → https normalizado) |
| P3 | **5 bandas** de severidad: 90+/75+/60+/40+/0-39 |
| P4 | Timeouts: **15s página / 10s auxiliares** |
| P5 | llms.txt + sitemap: **solo presencia informativa** |
| D1-D8 | Cheerio ^1.0 · robots hand-rolled RFC 9309 · AuditResult alineado a AuditReport · scoringModelVersion · 4 slices · SSRF guard · cap 5MB + charset · topicalAuthority "not_measured" |

---

## Cómo se actualiza

- ✅ done → al cerrar cada work unit (tests verdes + typecheck + lint)
- ✅ done → al cerrar cada work unit (tests verdes + typecheck + lint)
- 🔄 next → al arrancar el apply de esa unidad
- ⬜ pending → planificado
- **Estado: 25/25 tareas · verify PASS (94/94 reqs, 95/95 scenarios, 299 tests, 95.59% coverage) · ARCHIVED ✅**
- Pendiente: 8 PRs encadenados (feature-branch-chain) → merge a `develop` → Sprint 2

**Detalle por tarea:** `openspec/changes/sprint-1-audit-engine/tasks.md` (T1-T25 con requirements cubiertos, paso RED y estimación).
