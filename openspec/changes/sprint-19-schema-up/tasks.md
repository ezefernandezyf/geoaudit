# Tasks: Sprint 19 — Schema 62 → 93 con datos 100% reales

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~160–210 (prod ~70, tests ~110) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| WU-1 | sameAs 3→5 en `brand.ts` | PR 1 | `pnpm test src/lib/brand.test.ts` | `pnpm dev` + curl `/` → 5 URLs en sameAs | `git revert` de `ORG_SAME_AS` |
| WU-2 | Article+speakable en landing | PR 1 | `pnpm test src/app/__tests__/page.test.tsx` | `pnpm dev` + RTL `#case-study` en HTML | revert de `ArticleJsonLd`+`id` |
| WU-3 | BreadcrumbList dashboard ×3 | PR 1 | `pnpm test src/app/dashboard` | `pnpm dev` login → 3 rutas con ld+json | revert componente + 3 inyecciones |
| WU-4 | Fixture engine + tests schema | PR 1 | `pnpm test src/schema/__tests__/index.test.ts` | `N/A` (fixture HTML estático, sin runtime) | borrar `ld-landing-93.html`+assert |

## Phase 1: Red tests — landing (WU-1 + WU-2)

- [x] 1.1 `brand.test.ts`: `ORG_SAME_AS` toEqual 5 con TikTok+GitHub repo (RED; falla con 3).
- [x] 1.2 `page.test.tsx`: assert `org.sameAs` toContain `https://www.tiktok.com/@ezefernandezdev` y `https://github.com/ezefernandezyf/relevy` (RED).
- [x] 1.3 `page.test.tsx`: nuevo test — 3er bloque `@type:"Article"`, headline=caseStudy.heading, dates 2026-08-20/28, author=FOUNDER, publisher Relevy, NO `TechArticle` (RED).
- [x] 1.4 `page.test.tsx`: assert `article.speakable.cssSelector` toEqual `["#case-study"]` y `container` con `#case-study` en HTML servido (RTL, no solo JSON) (RED).
- [x] 1.5 `page.test.tsx`: assert ningún bloque emite `award` y sigue sin `FAQPage` (RED hasta 1.6-1.8).

## Phase 2: Green — landing (WU-1 + WU-2)

- [x] 2.1 `brand.ts`: +2 URLs reales a `ORG_SAME_AS` (TikTok + GitHub repo); FOUNDER hereda por referencia.
- [x] 2.2 `page.tsx`: función local `ArticleJsonLd()` (patrón OrganizationJsonLd/WebSiteJsonLd) — headline/dates de `copy.ts`, author=FOUNDER, publisher Organization (BRAND_NAME+APP_URL), url, image, speakable.
- [x] 2.3 `page.tsx`: render `<ArticleJsonLd />` en :228 junto a los otros 2 bloques.
- [x] 2.4 `page.tsx`: `id="case-study"` en el recuadro `div` Case Study (:666), NO en el `section`.

## Phase 3: Red tests — breadcrumbs (WU-3)

- [x] 3.1 `dashboard/__tests__/page.test.tsx`: assert bloque `BreadcrumbList` con names `["Home","Dashboard"]` pos 1-2 (RED).
- [x] 3.2 `dashboard/audits/[id]/__tests__/page.test.tsx`: names `["Home","Dashboard","Auditoría"]` pos 1-3, terminal con item URL `/dashboard/audits/audit-1` (RED).
- [x] 3.3 `dashboard/profile/__tests__/page.test.tsx`: names `["Home","Dashboard","Perfil"]` pos 1-3 (RED).

## Phase 4: Green — breadcrumbs (WU-3)

- [x] 4.1 Crear `src/ui/breadcrumb-list-json-ld.tsx`: `BreadcrumbListJsonLd({ items })` — `@type:"ListItem"` posicional 1-based, `item` absoluto `APP_URL+path`.
- [x] 4.2 `dashboard/page.tsx`: inyectar `[{Home,/},{Dashboard,/dashboard}]`.
- [x] 4.3 `dashboard/audits/[id]/page.tsx`: inyectar `[…,{Auditoría,/dashboard/audits/{id}}]`.
- [x] 4.4 `dashboard/profile/page.tsx`: inyectar `[…,{Perfil,/dashboard/profile}]`.

## Phase 5: Engine fixture + verify (WU-4)

- [x] 5.1 Crear `src/schema/__fixtures__/ld-landing-93.html`: mirror landing (3 bloques + byline) → pin 93/publisher.
- [x] 5.2 `src/schema/__tests__/index.test.ts`: `scoreSchema(page("ld-landing-93.html"))` → score 93 + `businessType==="publisher"` (RED hasta 5.1).
- [x] 5.3 `pnpm run lint && pnpm run format && pnpm test` green (todas las suites).

## Phase 6: Cleanup / docs (WU-4)

- [x] 6.1 Comentar en `brand.ts` award `missing_recommended` honesto (13/15, sin inventar).
- [x] 6.2 Verificar dogfood: `pnpm dev` + curl landing → 3 bloques ld+json + `#case-study` presente.

Commits por WU (conventional): WU-1 `feat(schema): add tiktok+github sameAs profiles` · WU-2 `feat(landing): add Article JSON-LD with speakable` · WU-3 `feat(dashboard): add BreadcrumbList JSON-LD` · WU-4 `test(schema): pin landing-93 fixture + engine assertions`.
