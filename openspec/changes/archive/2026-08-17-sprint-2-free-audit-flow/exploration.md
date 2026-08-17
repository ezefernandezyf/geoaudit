# Exploration: Sprint 2 — Free Audit Flow

**Change:** `sprint-2-free-audit-flow` · **Phase:** explore · **Date:** 2026-08-11 · **Mode:** hybrid

## Executive Summary

Sprint 2 builds the first visible product surface: landing with URL input → audit runs server-side → GEO Score + report rendered with the house Loading/Success/Error/Empty states. Sprint 1 delivered the whole engine (`runAudit(url)` in `src/audit/index.ts`, 299 tests green) plus shared Zod contracts (`url-input.ts`, `audit-result.ts`), so this sprint is pure UI wiring: **no new business logic, no DB** (persistence arrives in Sprint 3 with auth). The architectural crux: an audit can take 10-60s (15s page timeout + robots 10s + 2 unbounded platform probes) and results CANNOT be persisted — so the report must be produced and rendered within one request cycle.

Recommended flow: **Server Action (validate + normalize + redirect) → `/report?url=` as an async Server Component running `runAudit` under Suspense, streaming a pulse skeleton via `loading.tsx`**. This is the canonical Next.js 15 pattern, honors the brief ("Report page (Server Component)"), keeps `app/` routing-only, and needs zero custom state machinery. The audit runs once per report page load; refresh re-runs it (no DB cache — accepted tradeoff, mitigated by rate limiting).

**Precondition**: `STYLE-BRIEF.md` does NOT exist yet (AGENTS.md requires it before any UI sprint). It must be produced in this change as the first slice.

## Current State

- **Orchestrator** `src/audit/index.ts`: `runAudit(url: string, deps): Promise<AuditResult>` — Zod-validates (invalid URL → degraded result score 0/Critical + `meta.errors`, never throws), normalizes http→https, parallel fetches (page 15s / robots 10s), 5 engines with per-engine failure isolation, weighted GEO Score, fully typed `AuditResult`. **Only throws on page fetch failure** (`audit page fetch failed …`). Engine deps injectable (zero network in tests).
- **Contracts** (Zod 4, `src/lib/contracts/`): `urlInputSchema` (`z.url` — accepts any scheme incl. ftp, so protocol must be filtered at the form/action); `auditResultSchema` (full report shape — JSON-serializable, safe to send to client); `fetchErrorCodeSchema`: SSRF_BLOCKED / TIMEOUT / NETWORK_ERROR / DNS_FAILURE / HTTP_STATUS / TOO_LARGE / TOO_MANY_REDIRECTS + `unsupported_content_type` (non-HTML page). Fixture `auditResultFixture` exists for render tests.
- **Routes** (`src/app/`, routing only): `/` (Sprint-0 placeholder landing, links to /dashboard), `/dashboard` (protected placeholder via `src/middleware.ts` + NextAuth GitHub), `/api/auth/[...nextauth]`. No `/report`, no UI components (`src/components/` does not exist). Layout: Inter font + metadata only; `globals.css` = 26 lines, **no design tokens**.
- **Brief §17 Sprint 2** bullets: landing with URL input · Server Action (crear audit, fetchear, correr 5 engines) · Report page (Server Component) · Loading states (Suspense + skeleton) · Error states (URL inválida, timeout, sitio caído) · Rate limiting para `/api/audit`.
- **Deps**: next-auth 5.0.0-beta.32 (GitHub only), prisma 7.9.1 (schema sin models), zod 4, cheerio. **No Stripe/Resend instalados todavía.** Sin librería de rate limiting. Vitest + RTL (jsdom) configurado; `src/app/__tests__/page.test.tsx` es el único test UI.
- **Constraint runtime**: el SSRF guard usa `node:dns` → action y report page **deben correr en Node runtime** (nunca Edge).

## Key Findings

### 1. No DB → el reporte vive en el ciclo de la request
Los resultados no se pueden persistir. Tres modelos posibles:

| Modelo | Pros | Contras | Effort |
|---|---|---|---|
| **A. Server Action → redirect → report page RSC con Suspense/streaming** (recomendado) | Patrón canónico Next 15; reporte SSR; URL en la barra; refresh/copia funcional (re-corre); `loading.tsx` da el skeleton sin estado custom; estados nativos | Re-audit por refresh (costo/abuso → rate limiter); streaming no unit-testable en jsdom | Med |
| B. Server Action corre el audit y devuelve el `AuditResult`; el reporte se renderiza client-side en la misma página (sin navegación) | Una sola ejecución; cero re-run; estado de pendiente vía `useActionState` | Reporte NO es Server Component (contradice el brief); sin URL compartible; refresh pierde el resultado | Low-Med |
| C. Route handler `POST /api/audit` + fetch client + render client | API JSON pública; match literal del bullet rate limiting del brief | Contradice "Report page (Server Component)"; más JS client; doble trabajo (JSON + render) | Med |

**Recomendación: Modelo A.** La action solo valida + normaliza + redirige (`/report?url=<normalized>`); NO corre el audit (evita doble ejecución action→página). El audit corre una vez por carga de la report page, dentro de un componente async envuelto en `<Suspense>`; `loading.tsx` muestra el skeleton con pulso. Error de fetch → el componente lanza → `error.tsx` (más un catch inline con retry dentro del runner para mejor UX). URL inválida/ausente → Empty state con form inline. `export const dynamic = "force-dynamic"` (searchParams + async I/O), runtime Node.

### 2. Progreso durante el audit: skeleton global, no por-engine
`runAudit` es atómico (Promise.allSettled + engines síncronos) → no existe progreso parcial streamable. El AGENTS.md pide el skeleton con pulso como animación crítica: **el skeleton es el estado de progreso**. Progreso por-engine requeriría job/progress API → sin DB es frágil en serverless (multi-instancia, cold starts) → fuera de scope. Nota UX: helper text bajo el CTA ("puede tardar hasta 60s").

### 3. Riesgo de latencia real: probes del platform engine sin timeout
`src/platform/probes.ts` hace HEAD a `/sitemap.xml` y `/llms.txt` con `fetch` plano **sin AbortSignal** → un host colgado puede estirar el audit más allá del timeout de función serverless (Vercel Hobby ~60s default). El worst case teórico es page 15s + probes colgadas. Mitigaciones: (a) error.tsx genérico + catch inline para cualquier fallo de función; (b) considerar un task pequeño (Sprint 2 o fix inmediato) que agregue AbortSignal a `probeSite` — fuera del scope del flujo pero recomendado en la fase apply si el presupuesto de líneas lo permite.

### 4. Mapeo de errores a UX
`runAudit` lanza solo por fetch fallido. Mapa `FetchErrorCode` → copy amigable: TIMEOUT → "el sitio tardó demasiado en responder", DNS_FAILURE → "el dominio no existe", HTTP_STATUS → "el sitio respondió con un error HTTP", TOO_LARGE → "el sitio es demasiado grande", `unsupported_content_type` → "la URL no apunta a una página HTML", NETWORK_ERROR → genérico. OJO: `z.url` acepta `ftp://` → filtrar protocolo en form (client) + action (server) para error inmediato "solo URLs http/https". Resultados degradados (engine falló, RAO-12) se renderizan con chip "no disponible" + aviso `meta.errors` — nunca como score limpio.

### 5. Rate limiting sin DB
Brief menciona `/api/audit`; con el Modelo A no hay endpoint público. Recomendación: limiter puro `src/lib/rate-limit/` (ventana fija, store inyectable, key por IP) aplicado en la action → 429 → error en el form. Best-effort en serverless (por instancia) — aceptable pre-auth; el limiter real con DB llega en Sprint 3 (tiers). Si el producto quiere API JSON pública, es un slice extra (route handler + mismo limiter).

### 6. STYLE-BRIEF como slice 0
`STYLE-BRIEF.md` no existe y AGENTS.md lo exige como entrada al primer sprint de UI. Slice 1 = brief (formaliza AGENTS §Design: navy `#0f172a` / emerald `#10b981` / amber `#f59e0b` / red `#ef4444`, Instrument Serif + Work Sans + JetBrains Mono, animación funcional, skeleton pulse) + tokens Tailwind 4 `@theme` + primitivas `src/ui/`.

## Approaches — estado del audit corriendo

| Approach | Pros | Cons | Effort |
|---|---|---|---|
| **Skeleton global vía `loading.tsx` + Suspense** (recomendado) | Cero estado custom; patrón nativo; pulso requerido por AGENTS | Sin progreso granular | Low |
| Skeleton por sección (score primero, detalle después) | UX más rica | Imposible: `runAudit` es atómico, no hay resultados parciales streamables | High (requiere refactor a job/progress) |
| Job API con id + polling | Progreso real + resumen parcial | Sin DB: estado en memoria por instancia → frágil/multi-instancia; sobreingeniería para MVP | High |

## Routes Plan

- `src/app/page.tsx` — landing: hero + `AuditForm` (client) + value props. Static.
- `src/lib/audit/actions.ts` — Server Action: parse FormData → Zod + protocol filter → normalize → `redirect("/report?url=…")`; error → `{ ok: false, error }` inline. Helper puro `parseAuditForm` testable.
- `src/app/report/page.tsx` — async Server Component: `searchParams.url` → validar → Empty state o `<Suspense fallback={ReportSkeleton}><AuditRunner url/></Suspense>`. `force-dynamic`, Node runtime.
- `src/app/report/loading.tsx` (skeleton shell) · `src/app/report/error.tsx` (boundary amigable + retry) · `AuditRunner` con catch inline → estado de error con retry.
- `src/report/` — componentes presentacionales del reporte (ScoreHero, DomainScorecard, TopFindings, ReportMeta) alimentados por `AuditResult`.
- `src/ui/` — primitivas del design system (Button, TextField, Card, Skeleton, SeverityBadge, ScoreRing).
- `src/lib/rate-limit/` — limiter puro (U5).

## Slices (work units ordenados por dependencia, patrón Sprint 1)

| Unit | Foco | Complejidad | Est. líneas | Deps | Verificación |
|---|---|---|---|---|---|
| U1 | **Design foundation**: STYLE-BRIEF.md + tokens Tailwind 4 + fonts + primitivas `src/ui/` (Skeleton pulse a11y, SeverityBadge 5 bandas, Card, Button, TextField) | Low-Med | ~480 | — | `pnpm test src/ui` (RTL: mapeo severidad, a11y skeleton) |
| U2 | **Landing + form + action**: `AuditForm` client (validación Zod + protocolo, pending, error role=alert), `src/lib/audit/actions.ts` (validate→redirect), rewrite `src/app/page.tsx` + smoke test | Low-Med | ~450 | U1 | `pnpm test src/ui src/app/__tests__ src/lib/audit` |
| U3 | **Report shell**: `report/page.tsx` (RSC async + Suspense + force-dynamic), `loading.tsx`, `error.tsx`, Empty state (URL inválida/ausente), `AuditRunner` con catch inline | Med | ~400 | U1, U2 | RTL de Empty/error (mock runner); streaming vía smoke manual (`pnpm dev`) — no unit-testable en jsdom |
| U4 | **Report render**: ScoreHero (score + banda + url + duración), DomainScorecard (5 dominios + mini-bars + chips "no disponible" para secciones degradadas), TopFindings (top3/bottom3 citability, issues schema, bots bloqueados), ReportMeta (meta.errors) | Med-High | ~580 (sub 4a scorecard ~320 / 4b findings ~260) | U3 | `pnpm test src/report` — matriz RTL sobre `auditResultFixture` + variantes degradada/unsupported |
| U5 | **Rate limiting + error mapping + polish**: `src/lib/rate-limit/` (ventana fija, store inyectable, sin DB), mapa FetchErrorCode→copy, helper "hasta 60s", retry | Med | ~420 | U2 | `pnpm test src/lib/rate-limit` + tests de mapa de errores |

**Total estimado: ~2,300 líneas authored (incl. tests).** → 400-line budget: **High** → chained PRs mandatory (5 PRs encadenados vía feature-branch-chain) · delivery `ask-on-risk` · **Decision needed before apply: Yes**.

## Decisiones de producto abiertas (para proposal)

1. **Profundidad del reporte free**: ¿score + scorecard + top findings (MVP) o reporte completo por dominio (deep dives, sugerencias de rewrite, JSON-LD generado)? El reporte completo podría ser el gancho Pro (Sprint 5/PDF). Impacta tamaño de U4 y propuesta de valor.
2. **Re-audit en refresh** de `/report` (sin DB no hay cache): ¿aceptado? (costo + abuso → mitigado con rate limiter U5).
3. **Rate limiting sin DB**: ¿limiter in-memory best-effort por IP en la action? ¿O se quiere el endpoint público `POST /api/audit` (bullet del brief) además del flujo web?
4. **Normalización http→https**: ¿silenciosa (ya la hace `runAudit`) o con aviso al usuario?
5. **STYLE-BRIEF.md**: ¿dentro de este change como U1 (recomendado) o change separado previo?
6. **Link a /dashboard** en la landing: ¿mantener el placeholder protegido o quitarlo hasta Sprint 3?

## Risks / Edge Cases

- **Probes sin timeout** (`platform/probes.ts`): host colgado → audit > función timeout. Mitigación: boundaries + catch inline; idealmente AbortSignal en probeSite (task chico fuera del flujo).
- **Runtime Node obligatorio** (SSRF usa `node:dns`): action/report nunca Edge; streaming RSC requiere Node runtime (default en Vercel, OK).
- **`force-dynamic`** en report page: sin esto el build prerenderiza/estática y `searchParams` se rompe (null en prerender).
- **`z.url` acepta no-http(s)** (ftp:// etc.) → filtro de protocolo en form + action.
- **Re-audit por refresh** → costo y abuso (ver decisión 2).
- **Sitios lentos**: skeleton largo → helper text "hasta 60s" + timeouts del fetch layer (15s/10s) acotan el peor caso salvo probes.
- **Streaming no testable en jsdom**: loading/Suspense se valida con smoke manual (`pnpm dev`, HARD GATE de AGENTS) y Playwright E2E recién en Sprint 6 — U3 debe dejar el runner y los estados como componentes puros testables.
- **Resultados degradados** (RAO-12/RAO-13): renderizar score 0/Critical + avisos `meta.errors` con honestidad; chips "no disponible"; nunca mostrar como éxito.
- **A11y**: input con label, errores `role=alert`, pending con `aria-busy` y submit disabled.
