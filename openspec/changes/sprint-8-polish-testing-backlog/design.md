# Design: Sprint 8 — Polish & Testing + Backlog UI

## Technical Approach

Cierra el ciclo pre-lanzamiento sin tocar el negocio (`src/audit/`, billing, auth, contracts, prisma schema). El backlog UI y las deudas se resuelven en el presenter (`deriveFindings`), el shell y el copy; el drill-down reutiliza la capa de presentación existente leyendo `AuditPage`. El testing técnico (Playwright, jest-axe, Lighthouse, OG) es aditivo: deps + config + CI job, todo revertible. Sin rutas de producto nuevas, sin migraciones.

## Architecture Decisions

| Área | Opciones | Tradeoff | Decisión |
|---|---|---|---|
| A1/A2 dedup | (a) colapsar en `deriveFindings` (presenter) vs (b) en `TopFindings` (UI) | (a) view model puro testable, UI tonta; (b) agrupa en cada consumidor | **(a) presenter**. Nuevo campo opcional `details?: string[]` en `Finding`; `description` = resumen, `details` = lista de ítems. |
| A3 drill-down | (a) query `AuditPage` en la página server + serializar `GeminiView[]` al client vs (b) ruta `/page/[id]` | (a) sin ruta nueva, reutiliza selector; (b) navegación nueva + refetch | **(a)**. Server mapea `result → AuditResult → toGeminiViewModel`; el client renderiza el reporte completo del `GeminiView` seleccionado. |
| A6 ScoreHero | (a) `runAudit` en runtime vs (b) script standalone + constante | (a) lento/no cacheable por request; (b) honesto, 1 ejecución documentada | **(b)**. Script Vitest `scripts/scorehero-verify.test.ts` (alias `@`, red real) → hardcode del `GeminiView` real en `src/app/score-hero-evidence.ts`. |
| A5 CTA | `auth()` en `app/page.tsx` vs prop desde layout | layout ya resuelve session, pero la página es su propio RSC | **`auth()` en `app/page.tsx`** (Home dinámica, costo despreciable). |
| C12 E2E | mock de red vs URL real vs skip | `runAudit` fetchea server-side: `page.route` no intercepta | free-audit con URL real estable + assert tolerante; signup/Stripe/PDF con skip-if-no-env. |
| C14 a11y | jest-axe (jsdom) solo vs + `@axe-core/playwright` | jsdom no computa contraste | jest-axe estructural + 1 test `@axe-core/playwright` (contraste) + excepciones documentadas. |

## File Changes

| Archivo | Acción | Cambio |
|---|---|---|
| `src/report/presenters/types.ts` | Modify | `Finding` gana `details?: string[]` |
| `src/report/presenters/findings.ts` | Modify | A1: 1 finding `schema-issues` con `details = schema.issues`, `codeSnippet` una vez. A2: 1 finding `blocked-bots` con `details = bots bloqueados` |
| `src/report/top-findings.tsx` | Modify | render `<ul>` de `details` bajo el `description` |
| `src/report/presenters/__tests__/findings.test.ts` | Modify | asserts nuevos: 1 finding por grupo, ids `schema-issues`/`blocked-bots` |
| `src/app/dashboard/audits/[id]/page.tsx` | Modify | A3: `auditPage.findMany({auditId, orderBy position})`, mapea a `GeminiView[]`, pasa a `MultiPageReport`; empty state si 0 filas |
| `src/report/multi-page-report.tsx` | Modify | A3: prop opcional `pageViews?: {url; view}[]`; en modo full renderiza `ScoreHero`+`DomainScorecard`+`PlatformMatrix`+`TopFindings` del `view` seleccionado |
| `src/ui/audit-form.tsx` | Modify | A4: `useState(defaultValue ?? "")` |
| `src/dashboard/runner-bar.tsx` | Modify | A4: `useState("")` |
| `src/app/page.tsx` | Modify | A5 `auth()` + CTA condicional; A6 ScoreHero desde `score-hero-evidence.ts`; C16 `export const metadata` |
| `src/app/score-hero-evidence.ts` | Create | A6: `GeminiView` real hardcodeado + comentario de evidencia (URL, fecha, script) |
| `scripts/scorehero-verify.test.ts` | Create | A6: corre `runAudit` sobre candidatas, imprime scores/bandas |
| `src/app/icon.svg`, `src/ui/logo.tsx` | Modify | A7: tile navy + "G" serif + trazo emerald; quitar globo (circle+ellipse) y onda |
| `src/billing/checkout-button.tsx` | Modify | B8 copy neutro + B11 `isLoading`; `ERROR_COPY` se mueve a copy.ts |
| `src/ui/button.tsx` | Modify | B11: `loadingLabel?` (default "Analizando…"); eliminar alias deprecado `loading` |
| `src/lib/copy.ts` | Modify | B8 `CHECKOUT_ERROR_COPY`; B10 `SHELL_COPY` (navbar/footer) + tuteo→usted en `LANDING_COPY`/`DASHBOARD_COPY` |
| `src/ui/navbar.tsx`, `src/ui/github-auth-card.tsx` | Modify | B10: strings desde copy.ts, usted |
| `src/app/report/{page,error}.tsx`, `src/app/multipage/page.tsx`, `src/app/dashboard/audits/[id]/page.tsx`, `src/report/audit-runner.tsx` | Modify | B9 tokens→hex (5 archivos) |
| `src/lib/og.ts` | Create | C16: helper `buildOgMetadata()` |
| `src/app/layout.tsx`, `src/app/pricing/page.tsx` | Modify | C16: `metadataBase` + OG/Twitter |
| `public/og.png` | Create | C16: asset 1200×630 |
| `playwright.config.ts`, `e2e/*.spec.ts` | Create | C12/C13 |
| `src/test/setup.ts` | Modify | C14: `expect.extend(toHaveNoViolations)` |
| `docs/performance.md` | Create | C15: resultados + desvíos |
| `.github/workflows/ci.yml`, `package.json` | Modify | C12 job E2E + deps/scripts |

## Detalle clave

**A1/A2** — el collapse vive en el presenter. `deriveFindings` emite exactamente un finding por grupo: `{ id:"schema-issues", title:"Datos estructurados: faltan estas propiedades", details: schema.issues, codeSnippet: JSON.stringify(generated) una sola vez }` y `{ id:"blocked-bots", title:"Bots de IA bloqueados", details: Object.entries(perBot).filter(b=>blocked) }`. El `codeSnippet` deja de repetirse por issue.

**A3** — la página server ya discrimina `isMultiPageResult`; ahora además consulta `prisma.auditPage.findMany` (contrato real: `result: Json`, `position`). Por cada fila: `row.result as AuditResult` (mismo cast del write side) → `toGeminiViewModel(result)`. El client `MultiPageReport` recibe `pageViews` y el selector existente (MPU-9) alterna entre reportes completos. Legacy (0 filas) → empty state honesto en la página server.

**A6** — el script Vitest corre `runAudit` sobre candidatas (linear.app + 2-3 reales), imprime score+band por URL. El mejor real se copia a `score-hero-evidence.ts` como `GeminiView` (totalScore, band, domain, summary, categoryScores reales vía `toGeminiViewModel`), con comentario que documenta URL, fecha y comando. Si ninguna ≥90, se muestra la mejor con band honesta (ej. 85 "good") y copy veraz. Re-evaluar con `pnpm verify:scorehero` cuando parezca obsoleto.

**B9** — hex exactos: `text-navy/bg-navy → #0f172a`, `bg-surface → #ffffff`, `text-text-secondary → #475569`, `font-display → font-serif` (alias existente a Instrument Serif). `globals.css` conserva los tokens (`tokens.test.ts` sigue verde); solo se dejan de usar en componentes.

**B11** — `Button` gana `loadingLabel?: string` (default "Analizando…"); se elimina el alias `loading` y `checkout-button.tsx` pasa a `isLoading`.

**C12/C13** — `playwright.config.ts`: `webServer` `pnpm dev` (reuse en local), `baseURL` localhost:3000, `projects` desktop + mobile (390×844), `retries: CI ? 2 : 0`, trace/screenshot on-retry. Scripts `e2e` / `e2e:install` (`playwright install --with-deps chromium`). Flows: free audit (URL real + assert "GEO Score"), signup/Stripe/PDF con `test.skip(!env, ...)` (patrón `prisma.test.ts`). CI: job `e2e` separado (instala browsers, corre, sube `playwright-report`); secretos solo vía `${{ secrets.* }}`.

**C14** — `jest-axe` en setup; tests por página (landing, pricing, login, dashboard, report) renderizando el RSC con `render(await Page())`, asserts: sin violations, landmarks (`main`/`nav`/`footer`), foco. Contraste en el test `@axe-core/playwright` sobre landing; excepciones en `docs/performance.md`.

**C15** — `lighthouse` devDep + script `lighthouse` (preset desktop). Medir landing/pricing/report; objetivo 95+. Desvíos (report/multipage) documentados en `docs/performance.md` (PERF-3). No es gate de CI.

**C16** — `buildOgMetadata({title, description, path})` en `src/lib/og.ts`; `metadataBase` en layout; `export const metadata` en landing + pricing; asset `public/og.png`.

## Testing Strategy

| Capa | Qué | Cómo |
|---|---|---|
| Presenter | dedup (1 finding por grupo, details), `toGeminiViewModel` intacto | Vitest, fixtures `AuditResult` |
| UI | `TopFindings` renderiza `<ul>` de `details`; `MultiPageReport` modo full | RTL con `GeminiView` directo |
| Copy | neutro sin voseo/tuteo; tokens→hex en 5 archivos | Vitest string/class asserts |
| E2E | 4 flows + mobile viewports | Playwright, skip-if-no-env |
| a11y | WCAG 2.2 AA estructural + contraste | jest-axe + @axe-core/playwright |

## Threat Matrix

N/A — sin routing de producto nuevo, shell commands, ni clasificación de ejecutables. Playwright y el script A6 son tooling aditivo de dev/CI, no boundaries de producto; el CI consume secretos solo vía `${{ secrets.* }}` con skip-if-no-env, y A6 reutiliza `runAudit` (SSRF-guarded) fuera del runtime.

## Migration / Rollout

Sin migraciones. Cada WU del proposal es un PR squash-merge a `develop` revertible. Playwright/axe/lighthouse se revierten quitando deps + config + job. A3 es solo lectura de `AuditPage`.

## Open Questions

- [ ] Ninguna bloqueante. A6 requiere 1 ejecución manual del script para fijar la evidencia (se resuelve durante apply).
