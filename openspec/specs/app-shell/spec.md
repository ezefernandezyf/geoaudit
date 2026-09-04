# App Shell Specification

> **Change**: `sprint-7-ui-fidelity` + `sprint-8-polish-testing-backlog` + `sprint-9-audit-calibration` + `sprint-10-free-mode` + `sprint-11-rebrand-polish` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

The shared app shell (navbar + footer) restyled to Gemini: active-state nav links, a plan pill, a user chip, and the new logo. The shell is present on all authenticated/landing pages and provides the entry points for profile, terms, privacy, and multi-page. Since Sprint 8, the shell copy (navbar links, user actions, footer text) is neutral Spanish (usted), centralized in `copy.ts`, and free of voseo/tuteo forms (SHL-6). Since Sprint 10, the plan pill is static "Free" for every user (no tier-dependent pill). Since Sprint 11, the shell carries the Relevy brand: the navbar renders the Relevy mark + wordmark (SHL-4), the footer support `mailto:` resolves to the single shared `SUPPORT_EMAIL` constant (SHL-8), and page title/OG metadata plus the footer copyright read "Relevy" (SHL-9).

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| SHL-1 | Active nav states | New | MUST | Navbar MUST highlight the active route |
| SHL-2 | Plan pill | New | MUST | Navbar MUST show a static "Free" plan pill for every user |
| SHL-3 | User chip | New | MUST | Navbar MUST show a user chip with identity/logout |
| SHL-4 | Logo | New | MUST | Navbar MUST render the Relevy mark + wordmark; favicon MUST serve the same Relevy mark |
| SHL-5 | Footer links | New | MUST | Footer MUST link to terms/privacy |
| SHL-6 | Neutral shell copy | New | MUST | Navbar/footer copy MUST be neutral Spanish (usted), sourced from `copy.ts` |
| SHL-7 | Security headers | New | MUST | Every response MUST send CSP + HSTS (CSP report-only first, then enforced) |
| SHL-8 | Support email constant | New | MUST | Footer support `mailto:` MUST resolve to the single shared support email constant |
| SHL-9 | Brand metadata + copyright | New | MUST | Title/OG `siteName`/`alt` and footer copyright MUST read "Relevy" |
| SHL-10 | Mobile navigation menu | ADDED | MUST | Below `md` a hamburger toggle (right container, `md:hidden`) opens a right-side drawer portaled to `document.body` with all nav links + session actions; Escape/overlay-close/focus-return; closed drawer `aria-hidden`+`inert`; `md+` unchanged; Navbar stays a sync server component; `NavLinks` desktop-only |
| SHL-11 | Footer author byline | ADDED | MUST | Footer MUST render an author byline block (`.byline` class) with the real founder name + role ("Fundador de Relevy") from centralized brand/copy constants; present on every page via the root layout; absent from the page-only `<Page/>` render |

### Requirement: Active Nav States (SHL-1)

When the navbar renders, then it MUST visually mark the link corresponding to the current route.

#### Scenario: Active link highlighted

- GIVEN the user is on `/dashboard`
- WHEN the navbar renders
- THEN the "Dashboard" link is highlighted

### Requirement: Plan Pill (SHL-2)

When an authenticated user is signed in, then the navbar MUST show a plan pill reading "Free" for every user. There is no tier-dependent pill.

#### Scenario: Plan pill shown

- GIVEN an authenticated user
- WHEN the navbar renders
- THEN a "Free" plan pill is visible

### Requirement: User Chip (SHL-3)

When an authenticated user is signed in, then the navbar MUST show a user chip with their identity and a logout action.

#### Scenario: User chip with logout

- GIVEN a signed-in user
- WHEN the navbar renders
- THEN the user chip shows identity and a logout control

### Requirement: Logo (SHL-4)

When the navbar renders, then it MUST show the Relevy mark — the user-generated Relevy icon + wordmark — replacing the previous "GeoAudit" logo. The same Relevy mark MUST be served as the site favicon via `src/app/icon.svg`.
(Previously: navbar showed the "G" serif + wave + globe logo with the "GeoAudit" wordmark.)

#### Scenario: Relevy wordmark

- GIVEN the navbar
- WHEN it renders
- THEN the Relevy logo and "Relevy" wordmark appear (no "GeoAudit" text)

#### Scenario: Relevy favicon

- GIVEN a request for the site favicon
- WHEN the App Router serves `icon.svg`
- THEN it renders the Relevy mark (not the legacy "G" tile)

### Requirement: Footer Links (SHL-5)

When the footer renders, then it MUST link to `/terms` and `/privacy` (and other legal/help pages).

#### Scenario: Legal links present

- GIVEN the footer
- WHEN it renders
- THEN `/terms` and `/privacy` are linked

### Requirement: Neutral Shell Copy (SHL-6)

When the app shell renders, then its copy (navbar links, user actions, footer text) MUST be neutral Spanish using "usted", MUST be centralized in `copy.ts`, and MUST NOT contain voseo or tuteo forms.

#### Scenario: Navbar copy is neutral

- GIVEN the navbar
- WHEN its copy is inspected
- THEN no voseo/tuteo forms appear and the strings come from `copy.ts`

### Requirement: Security Headers (SHL-7)

Every app response MUST send a Content-Security-Policy and Strict-Transport-Security header. CSP MUST start in report-only mode (with reporting) and only move to enforcement after assets/inline/third-party resources are verified unbroken.

#### Scenario: CSP + HSTS emitted

- GIVEN any route response
- WHEN the response is inspected
- THEN `Content-Security-Policy` (or `Content-Security-Policy-Report-Only`) and `Strict-Transport-Security` headers are present

#### Scenario: CSP report-only before enforce

- GIVEN CSP is initially rolled out
- WHEN the landing/report routes render
- THEN CSP is report-only until no inline/third-party breakage is observed, then it is enforced

### Requirement: Support Email Constant (SHL-8)

The footer MUST render the support contact using the single shared support email constant (`ezefernandezyf@gmail.com`). The literal email MUST NOT be hardcoded anywhere else.

#### Scenario: Footer support mailto

- GIVEN the shared footer
- WHEN it renders the support link
- THEN the `mailto:` target resolves to the shared support email constant

### Requirement: Brand Metadata + Copyright (SHL-9)

The app MUST emit "Relevy" as the page `<title>`/metadata template and in the shared OG helper's `siteName`/`alt` fields. The footer MUST show a copyright line reading "© Relevy".

#### Scenario: Page title is Relevy

- GIVEN any route
- WHEN the `<head>` metadata renders
- THEN the title template resolves to "Relevy"

#### Scenario: OG siteName is Relevy

- GIVEN the shared OG helper
- WHEN OG metadata is generated
- THEN `siteName` and image `alt` read "Relevy"

#### Scenario: Footer copyright

- GIVEN the shared footer
- WHEN it renders
- THEN the copyright line reads "© Relevy"

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
| SHL-1 | Active link highlighted | Covered |
| SHL-2 | Plan pill shown | Covered |
| SHL-3 | User chip with logout | Covered |
| SHL-4 | Relevy wordmark, Relevy favicon | Covered |
| SHL-5 | Legal links present | Covered |
| SHL-6 | Navbar copy is neutral | Covered |
| SHL-7 | CSP + HSTS emitted, CSP report-only before enforce | Covered |
| SHL-8 | Footer support mailto | Covered |
| SHL-9 | Page title is Relevy, OG siteName is Relevy, Footer copyright | Covered |
| SHL-10 | Hamburger opens the panel with links and actions, Authenticated actions in the panel, Toggle closes the panel, Desktop nav unchanged, Toggle on the far right below md, Drawer and overlay portal to document.body, Closed drawer is aria-hidden and inert, Escape closes and returns focus, Overlay click closes and returns focus | Covered |
| SHL-11 | Byline renders with the .byline class, Byline present on every page via the shell, Byline copy is neutral and centralized | Covered |