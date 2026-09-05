# Proposal: Sprint 19 — Schema 62 → 93 con datos 100% reales

## Intent

La landing audita 62/100 en schema: 4 criterios en cero (article_author, business_type_schema, breadcrumbs, speakable), sameAs 9/15. Meta: 93/100 con schema real verificado (LND-7, nunca inventar). `award` queda 13/15.

## Scope

### In Scope
1. **sameAs +6** — `ORG_SAME_AS` (`brand.ts:28-32`) +2 links reales (TikTok @ezefernandezdev, GitHub repo relevy) → 5×3=15/15. FOUNDER hereda sin duplicar.
2. **Article + speakable +25** — `ArticleJsonLd()` en `page.tsx` (patrón OrganizationJsonLd, inyección :227-228), datos reales de `copy.ts` (headline Case Study, dates 2026-08-20/28, author FOUNDER, publisher Relevy); speakable `["#case-study"]` → `id="case-study"` en :666. Resuelve article_author 0→10, business_type_schema 0→10 (publisher estable), speakable 0→5.
3. **BreadcrumbList +5 (dashboard)** — componente compartido en /dashboard, /dashboard/audits/[id], /dashboard/profile (Home > Dashboard > …). Honesto; no sube la landing.
4. **award** — documentar `missing_recommended`; 13/15.

### Out of Scope
Engine (`src/schema/*`); FAQPage; perfiles/premios inventados; breadcrumb landing (honestidad); Close Free → follow-up.

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `landing-page`: LND-9 sameAs +2; ADDED REQ-19.1 Article JSON-LD (datos reales), REQ-19.2 speakable `#case-study` (extiende LND-16)
- `dashboard`: ADDED REQ-19.3 BreadcrumbList JSON-LD en 3 páginas

## Approach

1. `brand.ts`: +2 URLs (HTTP 200) a `ORG_SAME_AS`.
2. `page.tsx`: `ArticleJsonLd()` con `@type: "Article"` (NO TechArticle — `classify.ts:109-115` publisher solo con article/newsarticle/blogposting) + `id="case-study"`.
3. Dashboard: `BreadcrumbListJsonLd({ items })` per-page (sin dashboard/layout.tsx).
4. TDD (Vitest): assertions Article/speakable/sameAs ×5, fixture pin publisher + 93, breadcrumbs.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/lib/brand.ts` | Modified | ORG_SAME_AS 3→5 |
| `src/app/page.tsx` | Modified | ArticleJsonLd + id |
| `src/ui/breadcrumb-list-json-ld.tsx` | New | componente compartido |
| 3 pages `dashboard/` | Modified | BreadcrumbList ×3 |
| `page.test.tsx` + `dashboard/__tests__/` | Modified | assertions TDD |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| business_type flipa con copy futura | Med | fixture pin publisher + 93 |
| speakable sin elemento real | Low | id + test en el change |
| perfiles inventados | Low | solo 2 URLs verificadas |
| 3er bloque rompe tests | Low | tests usan `>=2`/`toContain` |

## Rollback Plan

`git revert` por área (levers independientes). Sin migraciones ni engine.

## Dependencies

- 2 perfiles sameAs reales (HTTP 200); deploy para verificar relevy.app (local primero).

## Success Criteria

- [ ] Dogfood: schema **93/100** (13+15+10+10+5+0+5+10+10+5+5+5)
- [ ] business_type = publisher estable (anon/authed)
- [ ] `pnpm lint && pnpm format && pnpm test` green
- [ ] `#case-study` en HTML servido
- [ ] award documentado honesto (13/15)

## Review Workload Forecast

- Líneas estimadas: ~160 (sin goldens)
- Decision needed before apply: **No**
- Chained PRs recommended: **No**
- 400-line budget risk: **Low**