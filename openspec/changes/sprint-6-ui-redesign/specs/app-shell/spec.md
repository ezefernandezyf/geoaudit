# App Shell Specification

> **Change**: `sprint-6-ui-redesign` · **Type**: New capability (ADDED)

## Purpose

Global application shell: a responsive Navbar and Footer rendered in the root layout (`src/app/layout.tsx`) so every page shares consistent navigation. The Navbar links to the logo/home and `/pricing` and adapts to auth state (anonymous → login/signup; authenticated → avatar + logout). Icons come from lucide-react.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| SHL-1 | Root layout shell | New | MUST | Navbar + Footer MUST render globally in the root layout |
| SHL-2 | Navbar navigation | New | MUST | Navbar links to logo/home and `/pricing`; responsive |
| SHL-3 | Auth state in navbar | New | MUST | Anonymous → login/signup links; authenticated → avatar + logout |
| SHL-4 | Footer | New | MUST | Minimal footer with product info + `/pricing` link |

### Requirement: Root Layout Shell (SHL-1)

When any route renders, then the system MUST wrap it in a global Navbar and Footer from the root layout.

#### Scenario: Every page has the shell

- GIVEN any route in the app
- WHEN the page renders
- THEN the Navbar appears at the top and the Footer at the bottom
- AND both come from the root layout, not per-page markup

### Requirement: Navbar Navigation (SHL-2)

When the Navbar renders, then it MUST link to the home (logo) and to `/pricing`, and MUST remain usable at mobile widths.

#### Scenario: Nav links present

- GIVEN the Navbar
- WHEN rendered
- THEN the logo links to `/` and a "Precios" link targets `/pricing`
- AND at narrow widths the nav collapses without breaking the layout

### Requirement: Auth State in Navbar (SHL-3)

When the Navbar renders, then it MUST adapt to auth state: anonymous users see login/signup links; authenticated users see an avatar and a logout action.

#### Scenario: Anonymous visitor

- GIVEN a visitor without a session
- WHEN the Navbar renders
- THEN "Iniciar sesión" and "Crear cuenta" links are shown

#### Scenario: Authenticated user

- GIVEN a signed-in user
- WHEN the Navbar renders
- THEN an avatar and a logout action are shown, and the login links are hidden

### Requirement: Footer (SHL-4)

When the Footer renders, then it MUST show minimal product info and a link to `/pricing`, with no invented content.

#### Scenario: Footer content

- GIVEN the Footer
- WHEN rendered
- THEN it shows the product name and a link to `/pricing`
- AND it contains no features or claims absent from the real product
