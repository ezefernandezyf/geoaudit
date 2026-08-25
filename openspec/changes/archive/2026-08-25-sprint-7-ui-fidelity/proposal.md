# Proposal: Sprint 7 — UI Fidelity

## Intent

Reimplementar la UI de GeoAudit copiando **idénticamente** los estilos de Gemini (hex directos, composiciones, fondos contrastados), reutilizando su código y refactorizando **solo el binding de datos** (mock de Gemini → `AuditResult` real vía un presenter puro). El look es 1:1 con Gemini; los datos son los reales del producto.

## Scope

### In Scope

- **U1 — Primitivas + logo + shell** (~500-550 L): reescribir `src/ui/{button,card,text-field,severity-badge,score-bar,skeleton}.tsx` copiando Gemini verbatim (hex directos, sizes, variants, loading con `Loader2`); crear `src/ui/logo.tsx` (SVG "G" serif + onda emerald + globo) + favicon; `src/ui/navbar.tsx` + `footer.tsx` con estados activos, pill de plan, user chip; `src/app/globals.css` (+ alias `--font-serif` y keyframes pulse).
- **U2 — Landing + auth + copy neutro** (~550-650 L): `src/app/page.tsx` con hero (input + botón DENTRO, sample URLs, badge "GEO Engine"), cards 01-05 con fondos contrastados (card 03 navy oscuro), ScoreHero demo + tabla de bandas (umbrales reales), 6 plataformas; `src/app/login` + `signup` estilo Gemini (card centrada, beneficios, "Continuar con GitHub", "Inicia sesión" como link); copy neutro central (`src/lib/copy.ts`) cubriendo `url-policy.ts`, `fetch-error-copy.ts`, `share-modal.tsx`, `github-auth-card.tsx`.
- **U3 — Pricing + FAQ** (~350-450 L): `src/billing/pricing-cards.tsx` + `src/app/pricing/page.tsx` con Pro destacada (borde emerald + badge "Recomendado" + scale), **solo mensual** (sin toggle anual), FAQ de facturación. Mantener checkoutAction/portalAction reales.
- **U4 — Dashboard + perfil + términos** (~600-700 L): `src/app/dashboard/page.tsx` con runner bar (input + "Run Audit" dentro + user chip) + grid 12-col (Aggregate col-4 + Trend col-8 misma fila, 12 barras CSS) + tabla con header bar, chip Multi-Page, refresh, fila "SCANNING..."; nueva página `/dashboard/profile` (nombre, tier, suscripción, uso, soporte); nuevas páginas `/terms` + `/privacy`.
- **U5 — Report/detail/share/live + adapter** (~900-1100 L, el corazón): crear `src/report/presenters/` (puro, testeable) `toGeminiViewModel(result)` → view model con la forma exacta de Gemini; reescribir `src/report/{score-hero,domain-scorecard,platform-matrix,top-findings,report-meta,stage-stepper,audit-report,multi-page-report,report-skeleton}.tsx` como presentadores puros del view model; detalle de audit idéntico (matriz 6 col, findings con código, share modal, Export PDF); share page con pill "Verificado" + CTA; live report con stepper animado (spinner + progress bar + círculos numerados).
- **U6 — Multi-page UI** (~300-400 L): exponer la UI multi-page (form que llama `multiPageAuditAction` real), página multi-page estilo Gemini (selector de rutas + inspector) con datos reales, link navbar.

### Out of Scope

- Tocar engine (`src/audit/`, `src/crawlers/`, `src/citability/`, `src/schema/`, `src/eeat/`, `src/platform/`, `src/scoring/`), contracts zod, auth, prisma, billing logic (stripe/actions/webhook), share-actions, middleware, PDF.
- Toggle anual de pricing. Features inventadas. `motion`/framer. Simulación de estados del engine.

## Capabilities

### New Capabilities

- `app-profile`: página `/dashboard/profile` con datos de User + Subscription.
- `legal-pages`: `/terms` + `/privacy` (RSC estáticos, lenguaje visual Gemini).
- `multipage-ui`: UI para disparar y ver audits multi-page (la action `multiPageAuditAction` ya existe).
- `audit-presenters`: `src/report/presenters/` — mapeo puro `AuditResult` → view model Gemini-shaped.

### Modified Capabilities

`design-foundation` (hex directos, alias font-serif, keyframes), `landing-page`, `pricing`, `dashboard`, `auth-pages`, `audit-report-ui`, `audit-detail`, `share-links`, `multi-page-audit`, `app-shell`.

## Approach

- **Presenter puro** (`toGeminiViewModel`) como fuente única del view model. TODO el mapeo de datos en un solo archivo auditable y testeable.
- Componentes copiados verbatim de Gemini se vuelven **presentadores puros** de ese view model.
- Islas `"use client"` solo donde hay interactividad real: form de audit, stepper (timer), share modal, filtro de tabla, copy buttons, form multi-page, logout.
- Sin simulación de estados: loading/error/empty vienen de Suspense/actions reales.
- Copy neutro centralizado en `src/lib/copy.ts` (strings compartidas con tests).

## Risks

1. **RSC/client split**: copiar verbatim componentes client (hooks, `window`, `setTimeout` de simulación) rompe RSC → convertir cada uno explícitamente, eliminar simulaciones.
2. **Datos mock sin equivalente real** (title, summary string, citationRate, presenceInPrompts, impactScore, codeSnippet) → derivar con honestidad ("No medido"/omitir), nunca inventar números presentados como medidos.
3. **SeverityBadge**: Gemini lowercase + props (score/dot/size) vs real Capitalized → normalizar en el adapter.
4. **Umbrales de banda**: usar los REALES (90/75/60/40) en composición Gemini (decisión D1).
5. **~30-40 archivos de tests UI a reescribir** (asserts de clases token y copy voseo); los de comportamiento no se tocan.
6. **STYLE-BRIEF desincronizado** con hex directos → actualizar el doc en el change.
7. **Copy voseo residual en lib** (url-policy, fetch-error-copy, share-modal, tier limit) → cubrir en el pase neutro + tests.

## Rollback Plan

Cada U es un PR atómico revertible. Negocio intacto → revertir la UI no afecta engine/billing/auth. Adapter puro facilita el diff.

## Review Workload Forecast

| Slice | Contenido | Est. líneas |
|---|---|---|
| U1 primitivas+logo+shell | ui/* + logo + favicon + globals.css + navbar + footer | ~500-550 |
| U2 landing+auth+copy | page.tsx + login/signup + copy.ts | ~550-650 |
| U3 pricing+FAQ | pricing-cards + pricing page | ~350-450 |
| U4 dashboard+perfil+términos | dashboard + profile + terms/privacy | ~600-700 |
| U5 report/detail/share/live+adapter | presenters + report/* + detail + share + live | ~900-1100 |
| U6 multi-page | form multipage + página + navbar link | ~300-400 |

**Total estimado**: ~3.100-3.850 líneas → `400-line budget risk: High` · `Chained PRs recommended: Yes` · `Decision needed before apply: Yes` (ask-on-risk, feature-branch-chain).

## Success Criteria

- [ ] UI visualmente idéntica a Gemini (hex, composiciones, fondos) con datos reales.
- [ ] Copy neutro en TODO (sin voseo).
- [ ] Logo + favicon nuevos.
- [ ] Multi-page con UI expuesta (form + página).
- [ ] Perfil + términos/privacidad accesibles desde el navbar/footer.
- [ ] `pnpm test` verde (tests UI reescritos, negocio intacto) · lint · typecheck · build.
