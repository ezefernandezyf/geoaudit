# Design: Sprint 19 — Schema 62 → 93 con datos 100% reales

## Technical Approach

Tres levers independientes sobre el patrón JSON-LD inline SSR existente (`OrganizationJsonLd`/`WebSiteJsonLd`, `src/app/page.tsx:63-119`), sin tocar el engine (`src/schema/*` queda out of scope): (1) `ORG_SAME_AS` 3→5 en `brand.ts` → sameAs 15/15; (2) tercer bloque `Article` (NO TechArticle) en la landing con `speakable ["#case-study"]` → article_author 10, business_type publisher 10, speakable 5; (3) `BreadcrumbList` en 3 rutas del dashboard → breadcrumbs 5 (no sube la landing). `award` queda omitido (13/15). Resultado landing: 13+15+10+10+5+0+5+10+5+10+5+5 = **93**.

## Architecture Decisions

| Decisión | Opciones (tradeoff) | Elección |
|---|---|---|
| Ubicación de `ArticleJsonLd` | Extraer `src/lib/jsonld.tsx` (refactor mueve 2 bloques, churn) vs función local en `page.tsx` (patrón existente, uso único) | Función local en `page.tsx`, junto a `OrganizationJsonLd`/`WebSiteJsonLd` — FOLLOW existing pattern |
| Ubicación de `BreadcrumbListJsonLd` | Per-page copy-paste (3×) vs componente compartido | Componente en `src/ui/breadcrumb-list-json-ld.tsx` (presentational/SSR, usado 3×) |
| Tipado de datos Article | Zod contract en `src/lib/contracts/` vs literal inline | Literal inline desde `LANDING_COPY` + `FOUNDER` (datos ya `as const`); Zod sería sobre-ingeniería para un SSR one-shot |
| `id="case-study"` | En el `<section>` vs en el recuadro `div` (`page.tsx:666`) | En el recuadro `div` (contiene heading+paragraphs, es lo que señala el selector) |
| URLs de breadcrumb | Sin `item` vs `item` absoluto en todos | Todos los items llevan `item` absoluto (`APP_URL` + `path`); terminal incluye path resuelto (audit: `/dashboard/audits/{id}`) |

## Data Flow

```
LANDING_COPY.caseStudy.heading + contentDates ─┐
FOUNDER (brand.ts) ────────────────────────────┤→ ArticleJsonLd() → <script ld+json> (3er bloque)
BRAND_NAME / APP_URL (publisher) ──────────────┘        │
id="case-study" en recuadro Case Study ─────────────────┘→ speakable.cssSelector ["#case-study"]
brand.ts ORG_SAME_AS (5) ──→ Organization.founder ──→ countValidSameAs = 5×3 = 15
BreadcrumbListJsonLd({items}) ──→ <script ld+json> por page.tsx (dashboard ×3)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/brand.ts` | Modify | `ORG_SAME_AS` +2: `https://www.tiktok.com/@ezefernandezdev`, `https://github.com/ezefernandezyf/relevy` |
| `src/app/page.tsx` | Modify | `ArticleJsonLd()` local + render en :227-228 + `id="case-study"` en :666 |
| `src/ui/breadcrumb-list-json-ld.tsx` | Create | `BreadcrumbListJsonLd({ items })` — emite BreadcrumbList con `itemListElement` posicional |
| `src/app/dashboard/page.tsx` | Modify | Inyecta `BreadcrumbListJsonLd([{Home,/},{Dashboard,/dashboard}])` |
| `src/app/dashboard/audits/[id]/page.tsx` | Modify | Inyecta `[…, {Auditoría, /dashboard/audits/{id}}]` |
| `src/app/dashboard/profile/page.tsx` | Modify | Inyecta `[…, {Perfil, /dashboard/profile}]` |
| `src/lib/brand.test.ts` | Modify | sameAs exacto 5 (toEqual, sin handles inventados) |
| `src/app/__tests__/page.test.tsx` | Modify | Article/speakable/sameAs×5/no-award |
| `src/app/dashboard/{,audits/[id]/,profile/}__tests__/page.test.tsx` | Modify | BreadcrumbList por ruta |
| `src/schema/__fixtures__/ld-landing-93.html` | Create | Mirror de la landing (3 bloques + byline) → pin 93/publisher |
| `src/schema/__tests__/index.test.ts` | Modify | `scoreSchema(ld-landing-93)` = 93 + businessType publisher |

## Interfaces / Contracts

```ts
// ArticleJsonLd (local, page.tsx) — literal inline, sin Zod
{ "@type": "Article", headline: LANDING_COPY.caseStudy.heading,
  datePublished: LANDING_COPY.contentDates.datePublished,   // "2026-08-20"
  dateModified: LANDING_COPY.contentDates.dateModified,     // "2026-08-28"
  author: FOUNDER, publisher: { "@type": "Organization", name: BRAND_NAME, url: APP_URL },
  url: APP_URL, image: `${APP_URL}/og.png`,
  speakable: { "@type": "SpeakableSpecification", cssSelector: ["#case-study"] } }

// src/ui/breadcrumb-list-json-ld.tsx
type BreadcrumbItem = { name: string; path: string };   // path absoluto desde APP_URL
export function BreadcrumbListJsonLd({ items }: { items: BreadcrumbItem[] });
```

`APP_URL` se deriva local (`process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"`) — mismo patrón que `page.tsx:61`; no se extrae (2 usos, no justifica shared helper).

## Testing Strategy (strict TDD — RED primero)

| Layer | Qué | Dónde |
|-------|-----|-------|
| Unit (brand) | `ORG_SAME_AS` exacto 5, `FOUNDER.sameAs` por referencia | `brand.test.ts` |
| Integration (RTL) | 3er bloque Article (campos reales, `@type` ≠ TechArticle), `speakable.cssSelector === ["#case-study"]`, `#case-study` presente en HTML servido, sameAs 5 links, no `award` en ningún bloque | `page.test.tsx` |
| Integration (RTL) | BreadcrumbList names/positions por ruta (3 páginas) | dashboard `page.test.tsx` ×3 |
| Engine | fixture `ld-landing-93.html` → score 93 + `businessType === "publisher"` | `index.test.ts` |

Aserciones clave (16 escenarios): `org.founder.sameAs` toEqual 5; `countValidSameAs` = 15 (vía fixture); Article con `headline`=caseStudy.heading; publisher=Relevy@relevy.app; `#case-study` existe en el DOM (RTL, no solo JSON); breadcrumbs `["Home","Dashboard"]` / `[...,"Auditoría"]` / `[...,"Perfil"]` en posiciones 1..N. No regresión: `toBeGreaterThanOrEqual(2)` y `toContain` existentes toleran el 3er bloque; FAQPage sigue ausente.

## Threat Matrix

N/A — sin routing nuevo, shell, subprocesos, automatización VCS/PR, clasificación de ejecutables ni integración de procesos.

## Migration / Rollout

No migration required. Rollback: `git revert` por área (3 levers independientes). Verificación dogfood en deploy (`relevy.app` → 93).

## Open Questions

- [ ] Confirmar que Ezequiel es dueño de los 2 perfiles nuevos (TikTok/GitHub repo) — ya asumido en proposal, HTTP 200 verificado.
