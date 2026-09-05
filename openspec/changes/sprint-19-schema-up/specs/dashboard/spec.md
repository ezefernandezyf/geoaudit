# Delta for Dashboard

> **Change**: `sprint-19-schema-up` · **Type**: Delta (ADDED)

## Racional

Sprint 19 agrega `BreadcrumbList` JSON-LD a las páginas del dashboard para satisfacer el criterio `breadcrumbs` (5/5) del engine de schema con una jerarquía honesta (LND-7): Home > Dashboard (ruta raíz `/dashboard`), Home > Dashboard > Auditoría (`/dashboard/audits/[id]`), y Home > Dashboard > Perfil (`/dashboard/profile`). No existe `dashboard/layout.tsx`, por lo que el approach definido es un componente compartido `BreadcrumbListJsonLd({ items })` inyectado por página. Esto NO sube el score de la landing (el crawl de dogfood no ve el dashboard); es un lever honesto que no toca la landing.

| # | Change | Summary |
|---|--------|---------|
| DASH-19.1 | ADDED | BreadcrumbList JSON-LD en 3 rutas del dashboard (Home > Dashboard > …) |

## ADDED Requirements

### Requirement: Dashboard BreadcrumbList (DASH-19.1)

When an authenticated dashboard page renders, then it MUST emit a `BreadcrumbList` JSON-LD block (`<script type="application/ld+json">`) whose `itemListElement` items reflect the real navigation hierarchy, using a shared component injected per page (no `dashboard/layout.tsx` exists). The emitted block MUST satisfy the schema engine's `breadcrumbs` criterion (5/5). The three routes MUST emit exactly:
- `/dashboard` → Home > Dashboard
- `/dashboard/audits/[id]` → Home > Dashboard > Auditoría
- `/dashboard/profile` → Home > Dashboard > Perfil

Each item MUST carry an `@type: "ListItem"` with a sequential `position` (1-based) and a `name`, and the terminal item MAY carry an `item` URL (the audit detail item MAY use a placeholder-free resolved URL for its own route).

#### Scenario: Dashboard root breadcrumb

- GIVEN the authenticated user visits `/dashboard`
- WHEN the page renders
- THEN a JSON-LD `BreadcrumbList` block is served with `itemListElement` names `["Home", "Dashboard"]` at positions 1 and 2

#### Scenario: Audit detail breadcrumb

- GIVEN the authenticated user visits `/dashboard/audits/<id>`
- WHEN the page renders
- THEN a JSON-LD `BreadcrumbList` block is served with `itemListElement` names `["Home", "Dashboard", "Auditoría"]` at positions 1, 2 and 3

#### Scenario: Profile breadcrumb

- GIVEN the authenticated user visits `/dashboard/profile`
- WHEN the page renders
- THEN a JSON-LD `BreadcrumbList` block is served with `itemListElement` names `["Home", "Dashboard", "Perfil"]` at positions 1, 2 and 3

#### Scenario: Breadcrumbs criterion satisfied

- GIVEN a served `BreadcrumbList` block on any dashboard page
- WHEN the schema engine scores the page's JSON-LD
- THEN `breadcrumbs` scores 5/5
- AND the block is honest — every `name` matches the real navigation trail (no invented or inflated path)

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| DASH-19.1 | Dashboard root breadcrumb, Audit detail breadcrumb, Profile breadcrumb, Breadcrumbs criterion satisfied | Covered |
