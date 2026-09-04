# Delta for App Shell

> **Change**: `2026-09-01-sprint-17-ui-polish` · **Type**: Delta (MODIFIED)

## Racional

El toggle mobile vive hoy dentro del island `NavLinks` en el contenedor IZQUIERDO del Navbar, y el panel cae full-width desde arriba (`inset-x-0 top-16`) DENTRO del header — que tiene `backdrop-blur-md`: el `backdrop-filter` crea un containing block para `fixed`/`absolute`, así que un drawer/overlay `fixed` quedaría anclado al header de 64px, no al viewport. Se extrae un island cliente `MobileMenu` (toggle + drawer + estado `open`) al contenedor DERECHO del Navbar (`md:hidden`), y el drawer + overlay se portalean a `document.body` (`createPortal`), escapando el containing block. Contract a11y nuevo (antes inexistente): Escape cierra, click en overlay cierra, el focus entra al drawer al abrir y vuelve al toggle al cerrar; drawer cerrado = `aria-hidden` + `inert` (los role-queries de RTL excluyen subtrees `aria-hidden` → las aserciones null existentes siguen verdes). `NavLinks` queda desktop-only. Los 5 tests mobile de `nav-links.test.tsx` migran a `mobile-menu.test.tsx` usando `screen`/`document.body` (el portal rompe `container.querySelector`); los 8 tests de `navbar.test.tsx` no referencian toggle/panel → intactos.

| # | Change | Summary |
|---|--------|---------|
| SHL-10 | MODIFIED | Toggle al contenedor derecho (`md:hidden`) + drawer lateral derecha→izquierda portaleado a `document.body` (Escape / overlay-close / focus-return / `inert` cerrado); `NavLinks` desktop-only; 5 tests migran a `mobile-menu.test.tsx` |

## MODIFIED Requirements

### Requirement: Mobile Navigation Menu (SHL-10)

When the navbar renders below the `md` breakpoint, then it MUST expose a hamburger toggle that opens a navigation panel containing ALL primary nav links (Producto, Multi-página) and the session-appropriate actions — sign-in/sign-up for anonymous users, plan pill + user chip + logout for authenticated users. Above `md`, the desktop navigation MUST render unchanged (no toggle). The toggle MUST render in the navbar's RIGHT container, visible only below `md` (`md:hidden`); the drawer and its overlay MUST be portaled to `document.body` (the header's `backdrop-blur-md` creates a containing block for `fixed` descendants, so in-header positioning would anchor to the 64px header). The drawer MUST close on Escape, on overlay click, and on toggle activation; focus MUST move into the drawer when it opens and MUST return to the toggle when it closes. A closed drawer MUST be `aria-hidden` and `inert` (not focusable, excluded from role queries). The Navbar shell MUST remain a synchronous server component; the toggle, drawer, and open state MUST live in a client `MobileMenu` island rendered from the Navbar's right container, and `NavLinks` MUST render the desktop nav only.
(Previously: the toggle lived inside the `NavLinks` island in the navbar's LEFT container and the panel dropped full-width from the top (`inset-x-0 top-16`) inside the header — clipped by the `backdrop-blur-md` containing block — with no Escape, overlay-close, or focus management.)

#### Scenario: Hamburger opens the panel with links and actions

- GIVEN a viewport below `md` and an anonymous session
- WHEN the hamburger toggle is activated
- THEN the drawer opens from the right showing the nav links (Producto, Multi-página)
- AND the sign-in and sign-up actions are present in the drawer
- AND focus moves into the drawer

#### Scenario: Authenticated actions in the panel

- GIVEN a viewport below `md` and an authenticated session
- WHEN the panel is open
- THEN the plan pill, user chip, and logout action are reachable inside the panel

#### Scenario: Toggle closes the panel

- GIVEN the mobile panel is open
- WHEN the toggle (or close control) is activated
- THEN the panel closes

#### Scenario: Desktop nav unchanged

- GIVEN a viewport at or above `md`
- WHEN the navbar renders
- THEN the desktop nav links render as before and no hamburger toggle is shown

#### Scenario: Toggle on the far right below md

- GIVEN a viewport below `md`
- WHEN the navbar renders
- THEN the toggle renders in the navbar's right container (`md:hidden`)
- AND `NavLinks` renders no toggle of its own

#### Scenario: Drawer and overlay portal to document.body

- GIVEN the drawer is open
- WHEN the DOM is inspected
- THEN the drawer and its overlay are children of `document.body`, not descendants of the header

#### Scenario: Closed drawer is aria-hidden and inert

- GIVEN the drawer is closed
- WHEN its attributes are inspected
- THEN it carries `aria-hidden` and `inert`
- AND its links are not focusable and are excluded from role queries

#### Scenario: Escape closes and returns focus

- GIVEN the drawer is open
- WHEN the user presses Escape
- THEN the drawer closes
- AND focus returns to the toggle

#### Scenario: Overlay click closes and returns focus

- GIVEN the drawer is open
- WHEN the overlay is clicked
- THEN the drawer closes
- AND focus returns to the toggle

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| SHL-10 | Hamburger opens the panel with links and actions, Authenticated actions in the panel, Toggle closes the panel, Desktop nav unchanged, Toggle on the far right below md, Drawer and overlay portal to document.body, Closed drawer is aria-hidden and inert, Escape closes and returns focus, Overlay click closes and returns focus | Covered |