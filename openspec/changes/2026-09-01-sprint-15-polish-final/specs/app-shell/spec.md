# Delta for App Shell

> **Change**: `2026-09-01-sprint-15-polish-final` · **Type**: Delta (MODIFIED)

## Racional

No existe menú mobile: `NavLinks` oculta Producto y Multi-página por debajo de `md` y las acciones (login/signup, plan pill, avatar, logout) quedan parcialmente accesibles o invisibles. Se agrega un toggle hamburguesa < `md` (client island) que expone todos los links y las acciones según el estado de sesión; el shell `Navbar` sigue siendo un server component síncrono (contrato RTL, `layout.tsx`).

| # | Change | Summary |
|---|--------|---------|
| SHL-10 | ADDED | Menú hamburguesa mobile: panel con todos los links + acciones según sesión; `md+` sin cambios |

## ADDED Requirements

### Requirement: Mobile Navigation Menu (SHL-10)

When the navbar renders below the `md` breakpoint, then it MUST expose a hamburger toggle that opens a navigation panel containing ALL primary nav links (Producto, Multi-página) and the session-appropriate actions — sign-in/sign-up for anonymous users, plan pill + user chip + logout for authenticated users. Above `md`, the desktop navigation MUST render unchanged (no toggle). The Navbar shell MUST remain a synchronous server component; the toggle and panel MUST live in the existing `"use client"` NavLinks island.

#### Scenario: Hamburger opens the panel with links and actions

- GIVEN a viewport below `md` and an anonymous session
- WHEN the hamburger toggle is activated
- THEN the panel opens showing the nav links (Producto, Multi-página)
- AND the sign-in and sign-up actions are present in the panel

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

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| SHL-10 | Hamburger opens the panel with links and actions, Authenticated actions in the panel, Toggle closes the panel, Desktop nav unchanged | Covered |