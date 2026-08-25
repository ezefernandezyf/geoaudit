# Proposal: Sprint 8 — Polish & Testing + Backlog UI

## Intent

Cerrar el ciclo previo a producción: implementar el backlog UI del usuario (7 items), saldar las deudas de limpieza que dejó el verify del Sprint 7 (3 WARNING + 1 suggestion) y montar el testing técnico que faltaba del roadmap (E2E Playwright, accesibilidad WCAG 2.2, performance, SEO/OG). Pulir la experiencia y probar lo ya construido; NO agrega features de negocio nuevas, NO cambia pricing y NO toca el engine de análisis (`src/audit/`).

## Scope

### In Scope

**ÁREA A — Backlog UI (7 items)**
- A1 dedup hallazgos JSON-LD: colapsar `schema.issues` a un único finding "datos estructurados: faltan estas propiedades" (JSON-LD mostrado una vez).
- A2 dedup crawlers: una única tarjeta "bots de IA bloqueados" con lista de bots.
- A3 drill-down multipágina por URL: página de detalle consulta filas `AuditPage` por `auditId`, mapea `url → AuditResult` completo, reutiliza `deriveFindings`/`toGeminiViewModel` y muestra el reporte completo por página seleccionada.
- A4 inputs placeholder: `value=""` + placeholder real desde `copy.ts` (hoy `useState("https://linear.app")` actúa como value).
- A5 CTA logueado: `auth()` en `app/page.tsx` → "Ir al dashboard" si hay sesión (Home pasa a dinámica).
- A6 ScoreHero verídico: auditoría real con `runAudit()` contra URLs candidatas; mostrar la mejor real con su band honesta.
- A7 favicon simplificado: `icon.svg` + `logo.tsx`.

**ÁREA B — Deudas de limpieza (4 items)**
- B8 voseo `checkout-button.tsx` → neutro.
- B9 tokens residuales (`text-navy`/`bg-surface`/`font-display`) → hex en 4 páginas.
- B10 copy tuteo → usted + centralizar en `copy.ts` (navbar, github-auth-card, LANDING_COPY).
- B11 `button.tsx` `loadingLabel` + `loading=` → `isLoading`.

**ÁREA C — Testing técnico (5 items)**
- C12 Playwright E2E desde cero: `@playwright/test` + `playwright.config.ts` + script `e2e` + browsers + job CI + 4 flows.
- C13 Responsive: viewports mobile en E2E + revisión reporte/multipage.
- C14 Accesibilidad: `jest-axe` + tests WCAG 2.2 AA en páginas principales.
- C15 Performance: tooling Lighthouse + medición (objetivo 95+ donde sea alcanzable).
- C16 SEO: OG/twitter tags para landing + pricing (layout ya tiene metadata default, sin OG).

### Out of Scope

- Features de negocio nuevas. Cambios de pricing/toggle anual. Engine de análisis (`src/audit/`, crawlers, citability, schema, eeat, platform, scoring).
- Contracts Zod, auth logic, prisma schema (ya tiene `AuditPage`), billing logic (Stripe actions/webhook), share-actions, middleware, PDF route.
- Motion/framer. Simulación de estados.

## Capabilities

### New Capabilities
- `e2e-testing`: suite Playwright (config + CI job + flows free audit / signup / Stripe checkout skip-if-no-env / PDF download + viewports mobile).
- `accessibility`: jest-axe + tests WCAG 2.2 AA sobre páginas principales.
- `performance`: tooling Lighthouse + reporte de medición (objetivo 95+).

### Modified Capabilities
- `audit-report-ui`: dedup JSON-LD (A1) + dedup crawlers (A2).
- `multi-page-audit` / `multipage-ui`: drill-down por página vía `AuditPage` (A3).
- `landing-page`: CTA logueado (A5), ScoreHero verídico (A6), OG tags (C16).
- `pricing`: OG tags (C16).
- `audit-form`: placeholder real (A4). `dashboard`: runner-bar placeholder (A4).
- `app-shell`: CTA footer logueado (A5).
- `design-foundation`: favicon (A7), tokens→hex (B9), button `isLoading` (B11).
- `billing`: checkout-button copy neutro + `isLoading` (B8, B11).
- `auth-pages`: copy usted (github-auth-card) (B10).
- `github-ci`: job E2E (C12).

## Approach

- **A1/A2** en `src/report/presenters/findings.ts` + `src/report/top-findings.tsx`: agrupar antes de emitir findings; un solo code snippet JSON-LD y una sola tarjeta de bots.
- **A3**: server component de detalle consulta `AuditPage` por `auditId`, ordena por `position`, mapea a `AuditResult` y pasa por el presenter existente (`deriveFindings`/`toGeminiViewModel`). NO enriquecer `MultiPageResult` (respeta D3 light shape).
- **A4** en `src/ui/audit-form.tsx` + `src/dashboard/runner-bar.tsx`: `useState("")` + placeholder desde `copy.ts`.
- **A5** en `app/page.tsx` (dinámica vía `auth()`); CTA condicional "Ir al dashboard" / "Crear cuenta gratis".
- **A6**: test/script standalone con alias `@/` (resuelto por Vitest) que corre `runAudit(url)` sobre candidatas reales; elegir la mejor veraz y mostrar band honesta (ej. 85 "good"). Nunca un número inventado.
- **B8/B10/B11**: barrido de copy voseo/tuteo → usted neutro en `copy.ts`; `loading=` → `isLoading`.
- **C12/C13**: instalar Playwright desde cero, flows de extremo a extremo con viewports mobile; Stripe con secretos de entorno + skip-if-no-env.
- **C14**: jest-axe por página (contraste, landmarks, roles).
- **C15**: Lighthouse (CI opcional o medición manual documentada).
- **C16**: helper de metadata OG/twitter aplicado a landing + pricing.

## Decisions (vinculantes del usuario)

1. **A3** — Drill-down del reporte completo por página vía `AuditPage` (NO enriquecer light shape).
2. **A6** — Mejor real honesta; si ninguna llega a 90+, mostrar la mejor con band honesta y copy veraz. Nunca inventar.
3. **A5** — `auth()` dentro de `app/page.tsx` (Home dinámica, costo despreciable).
4. **C12** — Aprobado instalar Playwright desde cero + secretos Stripe test con skip-if-no-env.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/report/presenters/findings.ts` | Modified | dedup JSON-LD + crawlers |
| `src/report/top-findings.tsx` | Modified | tarjeta única bots bloqueados |
| `src/app/multipage/`, `src/app/dashboard/audits/[id]/` | Modified | drill-down por página |
| `src/ui/audit-form.tsx`, `src/dashboard/runner-bar.tsx` | Modified | placeholder real |
| `src/app/page.tsx` | Modified | CTA logueado + ScoreHero verídico + OG |
| `src/app/icon.svg`, `src/ui/logo.tsx` | Modified | favicon simplificado |
| `src/billing/checkout-button.tsx` | Modified | copy neutro + isLoading |
| `src/ui/button.tsx` | Modified | loadingLabel + isLoading |
| `src/app/{report,multipage,dashboard}/**` | Modified | tokens→hex |
| `src/lib/copy.ts` + navbar/auth-card | Modified | copy usted |
| `src/app/layout.tsx`, pricing | Modified | OG tags |
| `playwright.config.ts`, `e2e/`, `jest-axe setup` | New | testing técnico |
| `.github/workflows/ci.yml` | Modified | job E2E |
| `package.json` | Modified | deps test (playwright, jest-axe, lighthouse) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Ninguna URL real llega a 90+ en A6 | Med | Mostrar mejor real con band honesta + copy veraz (decisión 2) |
| Playwright desde cero: browsers/CI flaky | High | Config mínima, retries, skip-if-no-env en Stripe, job separado |
| A3 query `AuditPage` sin filas (legacy) | Med | Empty state honesto; no romper audits viejos |
| jest-axe falso positivo por contraste | Med | Assert estructural (landmarks/roles) + revisar casos puntuales |
| Home dinámica por `auth()` | Low | Costo despreciable; medir en C15 |
| +900 tests a actualizar (copy/tokens) | Med | TDD: actualizar asserts de copy/tokens, no comportamiento |
| Lighthouse 95+ no alcanzable en report PDF/heavy | Med | Documentar desvíos donde no sea alcanzable |

## Rollback Plan

Cada work unit es un PR atómico revertible. La UI/limpieza/copy no afectan engine/billing/auth (rollback solo en `src/report/`, `src/ui/`, `src/app/`, `src/billing/`, `src/lib/copy.ts`). Playwright/axe/lighthouse son aditivos: revertir = quitar deps + config + job. A3 es lectura de `AuditPage` (sin migraciones ni escrituras nuevas).

## Work Units

| WU | Contenido | Est. líneas | Riesgo |
|----|-----------|-------------|--------|
| WU-A1 | Backlog UI rápido: A1, A2, A4, A5, A7 | ~200-300 | Bajo |
| WU-A2 | Drill-down multipágina: A3 | ~300-400 | Med |
| WU-A3 | ScoreHero verídico: A6 | ~150-250 | Med |
| WU-B | Limpieza deudas: B8, B9, B10, B11 | ~150-250 | Bajo |
| WU-C1 | SEO/OG: C16 | ~80-150 | Bajo |
| WU-C2 | Accesibilidad: C14 | ~250-400 | Med |
| WU-C3 | Performance: C15 | ~100-200 | Bajo |
| WU-C4 | Playwright E2E + responsive: C12, C13 | ~500-800 | Alto |

**Total estimado**: ~2.200-3.300 líneas → `400-line budget risk: High` · `Chained PRs recommended: Yes` · `Decision needed before apply: Yes`.

## Dependencies

- `@playwright/test`, `jest-axe`, `@axe-core/playwright`, `lighthouse` (deps nuevas).
- Secretos Stripe test en CI (skip-if-no-env).
- `src/audit/index.ts` (`runAudit`) ya disponible para A6.

## Success Criteria

- [ ] 7 items del backlog del usuario implementados y verificados.
- [ ] Deudas del verify Sprint 7 (3 WARNING + suggestion) cerradas.
- [ ] Suite E2E Playwright en CI (free audit, signup, Stripe test con skip-if-no-env, PDF download).
- [ ] jest-axe pasando (WCAG 2.2 AA en páginas principales).
- [ ] Medición Lighthouse (95+ donde sea alcanzable; desvíos documentados).
- [ ] OG tags en landing + pricing.
- [ ] 916+ tests unitarios intactos + nuevos; `pnpm test` · lint · typecheck · build verdes.
