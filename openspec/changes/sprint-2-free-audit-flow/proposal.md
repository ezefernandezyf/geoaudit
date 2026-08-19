# Proposal: Sprint 2 — Free Audit Flow

## Intent

Primera superficie visible del producto: landing con input de URL → audit server-side (`runAudit`) → GEO Score 0-100 + reporte renderizado con estados Loading/Success/Error/Empty. Sprint 1 entregó el motor completo (301 tests verdes, Zod contracts); este sprint es puro wiring UI sin nueva lógica de negocio ni DB (persistencia llega en Sprint 3 con auth).

## Scope

### In Scope
- **Design foundation**: `STYLE-BRIEF.md` + tokens Tailwind 4 `@theme` + primitivas `src/ui/` (Skeleton, Button, TextField, Card, SeverityBadge, ScoreRing)
- **Landing + form + action**: `AuditForm` (client, Zod + filtro protocolo, pending/error states, a11y), `src/lib/audit/actions.ts` (parse→validate→redirect), rewrite `src/app/page.tsx`
- **Report shell**: `/report?url=` async RSC con Suspense, `loading.tsx` (skeleton pulso), `error.tsx` (boundary + retry), Empty state (URL inválida/ausente)
- **Report render MVP**: ScoreHero (score + banda + metadata), DomainScorecard (5 dominios + mini-bars + chips degradados), TopFindings (top3/bottom3 citability + issues schema + bots bloqueados), ReportMeta (`meta.errors`)
- **Rate limiting + error mapping**: `src/lib/rate-limit/` (ventana fija, store inyectable, in-memory best-effort por IP), mapa `FetchErrorCode` → copy amigable
- **Node runtime en action y report page** (SSRF usa `node:dns` — nunca Edge)

### Out of Scope
- **Reporte completo por dominio** (deep dives, rewrites sugeridas, JSON-LD bloque por bloque) → **Sprint 5 (reporte Pro)**
- **Link a /dashboard en landing** → **Sprint 3** (auth + dashboard real)
- **DB, auth, Stripe, PDF** → Sprints 3-7
- **Endpoint público `POST /api/audit`** → fuera del flujo web actual; el rate limiter se aplica solo en la Server Action
- **Progreso por-engine durante el audit** (`runAudit` es atómico, Promise.allSettled + engines síncronos → no hay resultados parciales streamables)
- **STYLE-BRIEF.md en change separado** → se incluye como U1 dentro de este mismo change

## Product Decisions (resueltas)

| ID | Decisión | Sprint destino postergado |
|----|----------|---------------------------|
| D1 | Reporte free = **MVP** (score + scorecard 5 dominios + top findings + meta). El deep dive por dominio se posterga. Justificación: el free muestra el valor (qué está mal), el Pro vende la solución (cómo arreglarlo). | Sprint 5 |
| D2 | **Re-audit en refresh aceptado** (sin DB no hay cache; el audit re-corre en cada carga de `/report`). Mitigado con rate limiter U5. | — |
| D3 | Rate limiting **solo en la Server Action** (in-memory best-effort, ventana fija, store inyectable, key por IP). Sin endpoint público ni DB. | — |
| D4 | Normalización http→https **silenciosa** (`runAudit` ya la hace; sin aviso al usuario). | — |
| D5 | **STYLE-BRIEF.md dentro de este change como U1** (design foundation con tokens + primitivas). | — |
| D6 | **Link a /dashboard quitado** de la landing hasta Sprint 3 (auth + dashboard real). | Sprint 3 |

## Capabilities

### New Capabilities
- `audit-form`: Landing URL input → Server Action (parse, validate, normalize, redirect). Client form con Zod + protocolo + pending/error + a11y.
- `audit-report-ui`: `/report?url=` page — async RSC con Suspense + loading.tsx (skeleton pulso) + error.tsx (boundary + retry) + Empty state. Render MVP: ScoreHero, DomainScorecard, TopFindings, ReportMeta.
- `rate-limiting`: Server-action in-memory rate limiter (ventana fija, store inyectable, key por IP). Sin DB.
- `design-foundation`: `STYLE-BRIEF.md` + tokens Tailwind 4 `@theme` + primitivas `src/ui/` (Button, TextField, Card, Skeleton con pulse a11y, SeverityBadge 5 bandas, ScoreRing).

### Modified Capabilities
- None — Sprint 2 solo WIREA los engines existentes, no modifica sus specs.

## Approach

**Flujo**: Server Action (parse FormData → Zod `urlInputSchema` + filtro protocolo http/https → normalizar → `redirect("/report?url=…")`) → `/report?url=` async Server Component corriendo `runAudit(url, deps)` bajo `<Suspense>` → `loading.tsx` con skeleton pulso → `error.tsx` con retry.

- **Runtime**: Node obligatorio (SSRF `node:dns`), acción y report page.
- **force-dynamic** en report page (`searchParams` + async I/O).
- **Estructura**: `src/ui/` (primitivas) + `src/report/` (componentes) + `src/lib/audit/actions.ts` + `src/lib/rate-limit/` — `app/` solo routing.
- **5 slices encadenados**: U1 design foundation · U2 landing + form + action · U3 report shell · U4 report render MVP · U5 rate limiting + error mapping + polish.
- **~2.300 líneas estimadas → budget 400 líneas → High → 5 PRs encadenados** (feature-branch-chain, mismo patrón Sprint 1).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/page.tsx` | Modified | Rewrite: landing con AuditForm + value props (reemplaza placeholder Sprint 0) |
| `src/app/report/` | New | `page.tsx` (RSC async), `loading.tsx` (skeleton), `error.tsx` (boundary) |
| `src/app/layout.tsx` | Modified | Link a /dashboard removido, fonts cargadas |
| `src/app/globals.css` | Modified | Tokens Tailwind 4 `@theme` (colores, fonts, spacing) |
| `src/ui/` | New | Primitivas: Skeleton, Button, TextField, Card, SeverityBadge, ScoreRing |
| `src/report/` | New | Componentes: ScoreHero, DomainScorecard, TopFindings, ReportMeta |
| `src/lib/audit/actions.ts` | New | Server Action (validate→redirect) |
| `src/lib/rate-limit/` | New | Rate limiter in-memory, store inyectable |
| `STYLE-BRIEF.md` | New | Design foundation doc |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Probes `platform/probes.ts` sin AbortSignal → host colgado → audit > función timeout | Low | `error.tsx` + catch inline. Recomendado: AbortSignal en probeSite como task chico en apply si el budget lo permite. |
| Re-audit en refresh → abuso pre-auth | Med | Rate limiter U5 (ventana fija, in-memory, por IP). Limiter real con DB en Sprint 3. |
| Streaming no testable en jsdom (Suspense/loading) | Med | U3 deja runner y estados como componentes puros testables. Smoke manual con `pnpm dev` (HARD GATE AGENTS). |
| `z.url` acepta `ftp://` → error en runtime | Low | Filtro de protocolo http/https en form (client) + action (server). |
| Resultados degradados (RAO-12/RAO-13) renderizados como éxito | Low | Chips "no disponible" + avisos `meta.errors` + score 0/Critical honesto. |
| A11y: input sin label, errores sin role=alert, pending sin aria-busy | Low | Contemplado en diseño de U2: label explícito, `role=alert`, `aria-busy` + submit disabled. |

## Rollback Plan

- U1-U5 son slices incrementales no destructivos. Si U1 falla, no hay UI → no hay impacto visible.
- La action redirige a `/report` — si `/report` falla, `error.tsx` muestra estado amigable; `/` sigue funcionando.
- Rollback real: revertir merge de develop. Sin datos en DB → sin migraciones que deshacer.
- Si el rate limiter bloquea tráfico legítimo en serverless (multi-instancia), deshabilitar vía feature flag env `RATE_LIMIT_ENABLED=false`.

## Dependencies

- `runAudit(url, deps)` de Sprint 1 (src/audit/index.ts) — estable, 301 tests verdes.
- Zod contracts `urlInputSchema`, `auditResultSchema`, `fetchErrorCodeSchema` — estables.
- Sin dependencias externas nuevas.

## Success Criteria

- [ ] Usuario ingresa URL en landing → action valida → redirige a `/report` → skeleton pulso → reporte renderizado con GEO Score + scorecard + findings.
- [ ] URL inválida/no-http → error en form con copy amigable (sin navegar).
- [ ] `/report` sin URL o URL inválida → Empty state con form inline.
- [ ] Fetch fallido → `error.tsx` con copy amigable + retry funcional.
- [ ] Resultado degradado (engine falló) → chips "no disponible" + meta.errors visibles.
- [ ] Rate limiter bloquea > N requests/ventana en la action → 429 inline en form.
- [ ] 301 tests Sprint 1 siguen verdes + nuevos tests UI (RTL) para U1-U5.
- [ ] STYLE-BRIEF.md completo (tokens, fonts, primitivas documentadas).
