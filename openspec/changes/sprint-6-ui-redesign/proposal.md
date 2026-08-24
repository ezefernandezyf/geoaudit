# Proposal: Sprint 6 — UI Redesign (Port del diseño Gemini)

## Intent

Portar la capa visual generada por Gemini (9 páginas + primitivas) al design system real de GeoAudit, sin tocar la capa de negocio. Ganancias: navbar/footer global, landing completa, live report con stepper, matriz de plataformas, share modal y un reporte visual más rico — todo alimentado por datos reales.

## Scope

### In Scope
- **U1 primitivas**: actualizar Button/Card/TextField/Skeleton; crear ScoreHero/ScoreBar, Navbar/footer; agregar lucide-react.
- **U2 landing/auth**: reemplazo visual de LandingPage; restyle login/signup.
- **U3 dashboard/detail/share**: restyle + matriz de plataformas + findings con código + share modal.
- **U4 pricing/live/multipage**: pricing mensual sin toggle, live report stepper, multi-page.

### Out of Scope
- NO tocar contracts/auth/prisma/billing/share-actions/engine/middleware/PDF route.
- NO toggle anual. NO features inventadas. NO motion/framer.

## Capabilities

### New Capabilities
- `app-shell`: navbar + footer globales en el root layout.
- `landing-page`: landing completa (reemplaza el hero mínimo actual).

### Modified Capabilities
- `design-foundation`: primitivas + ScoreHero/ScoreBar + lucide-react.
- `audit-report-ui`: vistas re-escritas contra `AuditResult` + stepper live.
- `audit-detail`: matriz de plataformas, findings con código, share modal.
- `dashboard`: restyle de lista/agregado.
- `auth-pages`: restyle login/signup (preserva error/callbackUrl NextAuth).
- `pricing`: cards solo mensuales.
- `multi-page-audit`: adaptación visual por página.
- `share-links`: share modal PRO-gated.

## Approach

Port de presentación sobre datos reales. `domain-metrics.ts` es la fuente única de los score bars (mismos números que el PDF). La matriz de plataformas deriva de `AuditResult` (`platform.perPlatform` + `crawlers.perBot`), no del `platforms` mock de Gemini. Stepper de stages sobre la espera 10–60s del audit runner. Share modal reemplaza el ShareLinkPanel inline. Navbar/footer en root layout. Fonts reales (next/font/google). Animación funcional mínima (skeleton pulse, hover 150ms); se descartan las clases `animate-in` decorativas.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/ui/` | Modified | Primitivas + nuevas ScoreHero/ScoreBar |
| `src/app/layout.tsx` | Modified | Navbar/footer global |
| `src/app/page.tsx` | Replaced | Landing completa |
| `src/app/{login,signup,pricing}` | Modified | Restyle |
| `src/app/report/`, `src/report/` | Modified | Vistas + stepper |
| `src/app/dashboard/`, `src/dashboard/` | Modified | Restyle + share modal |
| `src/billing/pricing-cards.tsx` | Modified | Solo mensual |
| `package.json` | Modified | +lucide-react |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Desajuste modelo datos Gemini vs `AuditResult` | High | Re-escribir vistas contra `AuditResult` (ya resuelto) |
| 710 tests rotos por restyle | High | Actualizar los que rompan; TDD estricto |
| Matriz de plataformas: datos reales ambiguos | Med | Derivar de `perPlatform`+`perBot`; decidir en spec |
| SeverityBadge contract-bound | Low | Mantener el real, no el de Gemini |
| >400 líneas → chained PRs | High | Split U1→U4; forecast en sdd-tasks + delivery ask-on-risk |

## Rollback Plan

Revertir el change (cada PR U1→U4 es atómico y revertible). Contratos/engine/PDF quedan intactos: el rollback afecta solo `src/ui/`, `src/app/`, `src/report/`, `src/dashboard/`, `src/billing/` y quitar lucide-react.

## Dependencies

- lucide-react (agregar dep). Fuente visual: `/home/ezeyf/Descargas/geoaudit/` (solo referencia, no código).

## Success Criteria

- [ ] 9 páginas portadas con datos reales; ScoreBar alimentado por `domain-metrics.ts`.
- [ ] 710 tests verdes (rotos actualizados); lint+typecheck+build pasan.
- [ ] Pricing solo mensual; sin features inventadas; share PRO-gated.
- [ ] PDF imprime los mismos números (derivación de domain-metrics sin cambios).
