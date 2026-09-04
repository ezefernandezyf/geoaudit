# Delta for App Shell

> **Change**: `2026-09-01-sprint-16-score-up` · **Type**: Delta (ADDED)

## Racional

El footer global (`src/ui/footer.tsx`, renderizado en `layout.tsx:71`) gana un bloque de autoría: `<p className="byline">` con nombre y rol reales del founder. El engine de expertise consulta `AUTHOR_SELECTOR` sobre el DOM completo, por lo que un byline dentro de `<footer>` es detectado (+5 expertise) en la landing y en cualquier subpágina auditada. Cero colateral: `BOILERPLATE_SELECTOR` (E-E-A-T) y `EXCLUDE_SELECTOR` (citability) excluyen `footer` — el byline no entra ni al pageText ni a los bloques. El `<time>` queda en el contenido (fecha es específica del contenido; la autoría es del shell). Nota informativa: subpáginas sin señales FAQ/product pasan `pageTypeOf` a "article" (benchmark 500→1500) — señal informativa, nunca puntuada (meta.ts). Co-update: `footer.test.tsx` (presencia + clase `.byline`), `page.test.tsx` LND-13 (la aserción de byline sale del render de `<Page/>`), `a11y.test.tsx` (shell completo con byline).

| # | Change | Summary |
|---|--------|---------|
| SHL-11 | ADDED | Footer global con byline de autor (`.byline`, nombre + rol reales) en todas las páginas; copy neutro centralizado |

## ADDED Requirements

### Requirement: Footer Author Byline (SHL-11)

When the shared footer renders, then it MUST include an author byline block — a paragraph with class `byline` — showing the real founder name and role ("Fundador de Relevy"), sourced from the centralized brand/copy constants (neutral Spanish, SHL-6). Because the footer renders on every page through the root layout, every audited page exposes the byline; the expertise engine matches `.byline` over the full DOM (+5) while the footer remains excluded from citability content and E-E-A-T word counts, so the move has zero scoring collateral. The byline MUST NOT appear inside the page-only `<Page/>` render (it belongs to the shell).

#### Scenario: Byline renders with the .byline class

- GIVEN the shared footer
- WHEN it renders
- THEN a paragraph with class `byline` shows the founder's real name and the role "Fundador de Relevy"

#### Scenario: Byline present on every page via the shell

- GIVEN any route that renders the root layout (navbar + footer)
- WHEN the shell is inspected
- THEN the byline block is present (asserted in the shell/footer render, not in the page-only render)

#### Scenario: Byline copy is neutral and centralized

- GIVEN the byline strings
- WHEN they are inspected
- THEN they come from the shared brand/copy constants (founder name from `FOUNDER`, role from centralized copy)
- AND they contain no voseo or tuteo forms (SHL-6 invariant)

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| SHL-11 | Byline renders with the .byline class, Byline present on every page via the shell, Byline copy is neutral and centralized | Covered |