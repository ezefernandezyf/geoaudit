# Tasks: Sprint 8 — Polish & Testing + Backlog UI

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2.200-3.300 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 8 WUs → 8 PRs encadenados |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High
```

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| WU-A1 | Backlog UI rápido | PR 1 | `pnpm test -- src/report src/ui src/dashboard src/app` | `pnpm dev` + smoke landing/dashboard | revert `src/report/`, `src/ui/`, `src/dashboard/`, `src/app/page.tsx` |
| WU-A2 | Drill-down multipágina (A3) | PR 2 | `pnpm test -- src/app/dashboard/audits src/report` | `pnpm dev` + audit multipage real | revert `[id]/page.tsx` + `multi-page-report.tsx` |
| WU-A3 | ScoreHero verídico (A6) | PR 3 | `pnpm verify:scorehero` (red real) | 1 ejecución manual del script | revert `score-hero-evidence.ts` + script |
| WU-B | Deudas limpieza (B8-B11) | PR 4 | `pnpm test -- src/billing src/ui src/lib` | `pnpm dev` + smoke checkout/nav | revert `copy.ts` + componentes |
| WU-C1 | SEO/OG (C16) | PR 5 | `pnpm test -- src/app src/lib` | `pnpm dev` + view-source tags | revert `og.ts` + metadata |
| WU-C2 | Accesibilidad (C14) | PR 6 | `pnpm test -- src/app src/test` | jest-axe por página | revert setup + tests axe |
| WU-C3 | Performance (C15) | PR 7 | `pnpm lighthouse` (manual) | N/A — medición documentada | revert devDep + `docs/performance.md` |
| WU-C4 | Playwright E2E + responsive (C12+C13) | PR 8 | `pnpm e2e` (local) | browsers + CI job | revert deps + config + e2e + job |

## WU-A1 — Backlog UI rápido

- [x] A1.1 TDD: `findings.test.ts` — 1 finding `schema-issues`/`blocked-bots` con `details` (ARU-13/14) [RED]
- [x] A1.2 `presenters/types.ts` + `findings.ts`: `details?: string[]`, collapse JSON-LD + bots (ARU-13/14) [GREEN]
- [x] A1.3 `top-findings.tsx`: render `<ul>` de `details`; assert 1 card (ARU-14)
- [x] A1.4 `audit-form.tsx` + `runner-bar.tsx`: `useState("")` + placeholder desde `copy.ts`; assert (A4)
- [x] A1.5 `app/page.tsx`: `auth()` + CTA "Ir al dashboard"/"Ver planes" (LND-6); assert ambos estados
- [x] A1.6 `icon.svg` + `logo.tsx`: tile navy + "G" serif + trazo emerald (A7)

## WU-A2 — Drill-down multipágina (A3)

- [x] A2.1 TDD: `page.test.tsx` — reporte completo por página + empty state (MPU-7/8/9) [RED]
- [x] A2.2 `dashboard/audits/[id]/page.tsx`: `auditPage.findMany({auditId, orderBy position})` → `toGeminiViewModel`; empty state (MPU-8)
- [x] A2.3 `multi-page-report.tsx`: prop `pageViews?: {url;view}[]`; modo full render por selección (MPU-7/9); assert NO enriquece light shape

## WU-A3 — ScoreHero verídico (A6)

- [x] A3.1 `scripts/scorehero-verify.test.ts`: corre `runAudit` sobre 3-4 URLs reales, imprime score+band (LND-7)
- [ ] A3.2 EJECUTAR el script (red real); registrar mejor score/band real + evidencia — **pendiente del orquestador** (`pnpm verify:scorehero`; config dedicada `vitest.verify.config.ts`, fuera del include de CI)
- [x] A3.3 `src/app/score-hero-evidence.ts`: `SCOREHERO_EVIDENCE` con placeholder honesto (band derivada de severityForScore, categoryScores vacío) + TODO(A3.2) (LND-7)
- [x] A3.4 `app/page.tsx`: render ScoreHero desde evidencia; band honesta si <90 (LND-7); assert copy veraz

## WU-B — Deudas de limpieza

- [x] B.1 `copy.ts`: `CHECKOUT_ERROR_COPY`, `SHELL_COPY`, tuteo→usted en `LANDING_COPY`/`DASHBOARD_COPY` (SHL-6/B8/B10); assert neutro
- [x] B.2 `navbar.tsx` + `github-auth-card.tsx`: strings desde `copy.ts`, usted (SHL-6/B10)
- [x] B.3 `button.tsx`: `loadingLabel?` + eliminar alias `loading`; `checkout-button.tsx` → `isLoading` + copy neutro (B11/B8)
- [x] B.4 5 archivos tokens→hex: `report/{page,error}.tsx`, `multipage/page.tsx`, `[id]/page.tsx`, `audit-runner.tsx` (B9); assert class/tokens

## WU-C1 — SEO/OG (C16)

- [x] C1.1 `src/lib/og.ts`: `buildOgMetadata()` (LND-8/PRC-8); assert campos
- [x] C1.2 `layout.tsx` `metadataBase` + `public/og.png` (1200×630); `landing` + `pricing` `export const metadata` (LND-8/PRC-8)

## WU-C2 — Accesibilidad (C14)

- [x] C2.1 `jest-axe` + `src/test/setup.ts` `expect.extend(toHaveNoViolations)` (A11Y-1)
- [x] C2.2 Tests axe por página (landing/report/dashboard/pricing/auth): `render(await Page())`, sin violations (A11Y-2)
- [x] C2.3 Asserts landmarks `main`/`nav`/`footer` (A11Y-4) + foco visible/orden (A11Y-5)
- [x] C2.4 Test `@axe-core/playwright` contraste landing; excepciones en `docs/performance.md` (A11Y-3)

## WU-C3 — Performance (C15)

- [ ] C3.1 `lighthouse` devDep + script `lighthouse` preset desktop (PERF-1)
- [ ] C3.2 Medir landing/pricing/report; objetivo 95+ (PERF-2)
- [ ] C3.3 `docs/performance.md`: resultados + desvíos (report/multipage) (PERF-3)

## WU-C4 — Playwright E2E + responsive (C12+C13)

- [ ] C4.1 `@playwright/test` + `playwright.config.ts` (webServer, projects desktop+mobile 390×844, retries) + script `e2e`/`e2e:install` (E2E-1/6)
- [ ] C4.2 `e2e/free-audit.spec.ts`: URL real → "GEO Score" (E2E-2)
- [ ] C4.3 `e2e/signup.spec.ts`: GitHub → `/dashboard` (E2E-3)
- [ ] C4.4 `e2e/stripe-checkout.spec.ts`: test secrets + `test.skip(!env)` (E2E-4)
- [ ] C4.5 `e2e/pdf-download.spec.ts`: generación + download (E2E-5)
- [ ] C4.6 Mobile viewports en free-audit/report/multipage (E2E-6)
- [ ] C4.7 CI job `e2e` (instala browsers, corre, sube report, secretos `${{ secrets.* }}`) (E2E-7)

## Notas

- **Tests ACOTADOS por WU**: `pnpm test -- <ruta>` (nunca suite completa repetida); suite completa solo al gate final de cada WU.
- TDD estricto: RED→GREEN en cada item; actualizar asserts de copy/tokens, no comportamiento (916+ tests intactos).
- Commits atómicos conventional `feat(scope):`/`chore:`; copy y commits neutros (sin voseo).
- Cada WU = PR squash-merge a `develop` en cadena (feature-branch-chain); PR #1 base=tracker, hijos base=PR previo.
- A3 lectura `AuditPage` (sin migraciones); A6 exige 1 ejecución manual del script para fijar evidencia.
- Playwright/axe/lighthouse aditivos; Stripe y flujos con secretos usan skip-if-no-env.
