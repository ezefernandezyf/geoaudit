# Audit Form Specification

> **Change**: `sprint-2-free-audit-flow` · **Type**: New capability (ADDED)

## Purpose

Landing page with URL input form → Server Action: validate via `urlInputSchema`, filter to `http`/`https` only, normalize `http→https` silently, redirect to `/report?url=`, and display pending/error states with full a11y coverage. No `/dashboard` link on landing.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| ADF-1 | URL input form | MUST | Form with `<input type="url">`, explicit `<label>`, accessible name |
| ADF-2 | Client-side Zod validation | MUST | Validate via `urlInputSchema` before submit; inline error on invalid format |
| ADF-3 | Protocol filter (http/https) | MUST | Reject any URL whose scheme is not `http` or `https`; error "Solo URLs http/https" |
| ADF-4 | Silent http→https normalization | MUST | Upgrade `http://` → `https://` without user notification |
| ADF-5 | Server Action redirect | MUST | Parse FormData → Zod + protocol → normalize → `redirect("/report?url=…")` |
| ADF-6 | Pending state (a11y) | MUST | `aria-busy="true"` on form; submit button disabled + loading text |
| ADF-7 | Error display (a11y) | MUST | Errors rendered with `role="alert"`; copy: "Formato de URL inválido", "Solo URLs http/https", "Demasiadas solicitudes" |
| ADF-8 | No /dashboard link | MUST | Landing page MUST NOT contain a link to `/dashboard` |
| ADF-9 | Rate limit enforcement | MUST | Apply in-memory limiter per IP in action; over-limit → inline error |

### ADF-1: URL input form

**Rationale**: The landing page's sole CTA is the URL input; accessible label is required per WCAG 2.1 1.3.1 (info and relationships).

#### Scenario: User lands on the page

- GIVEN a visitor loads `/`
- WHEN the page renders
- THEN a single `<input type="url">` is visible with an explicit `<label>` reading "URL del sitio"
- AND no other form fields exist — only URL input + submit button

### ADF-4: Silent http→https normalization

**Rationale**: The fetch layer (RFL-1) already upgrades `http→https`; surfacing this to the user adds noise. The action normalizes pre-redirect so the URL in the address bar is clean.

#### Scenario: User enters http URL

- GIVEN user submits `http://ejemplo.com`
- WHEN the Server Action processes the URL
- THEN the scheme is upgraded to `https://ejemplo.com`
- AND no warning or info message is shown
- AND redirect target is `/report?url=https://ejemplo.com`

### ADF-7: Error display (a11y)

**Rationale**: Validation errors must be announced to screen readers immediately (WCAG 2.1 4.1.3).

#### Scenario: Invalid URL format

- GIVEN user submits `"not a url"` in the form
- WHEN client-side Zod validation runs
- THEN the submit is prevented and error "Formato de URL inválido" appears with `role="alert"`

#### Scenario: Non-http protocol

- GIVEN user submits `ftp://archivos.ejemplo.com`
- WHEN the protocol filter runs (client or server)
- THEN the request is rejected and error "Solo se aceptan URLs http/https" appears with `role="alert"`

### ADF-6: Pending state (a11y)

**Rationale**: Assistive tech must know the form is processing (ARIA 1.2 `aria-busy`). Disabled submit prevents double-submit.

#### Scenario: User submits valid URL

- GIVEN user enters `https://ejemplo.com` and submits
- WHEN the Server Action is in-flight
- THEN `aria-busy="true"` is set on the form element
- AND the submit button is disabled (`aria-disabled="true"`)
- AND button text changes to "Analizando…"

### ADF-9: Rate limit enforcement

**Rationale**: Without auth, the free audit flow is vulnerable to abuse. Rate limiting protects serverless function budget.

#### Scenario: Rate limit exceeded

- GIVEN client IP has exceeded `maxRequests` in the current window
- WHEN a new Server Action is invoked
- THEN the action returns an error without running the audit
- AND the form displays "Demasiadas solicitudes. Esperá un momento." with `role="alert"`
- AND no redirect to `/report` occurs

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| ADF-1 | User lands on page | Covered |
| ADF-2 | (via ADF-7 invalid URL) | Implicit |
| ADF-3 | (via ADF-7 non-http scenario) | Implicit |
| ADF-4 | User enters http URL | Covered |
| ADF-5 | (via ADF-4 redirect + ADF-9 rate limit) | Implicit |
| ADF-6 | User submits valid URL | Covered |
| ADF-7 | Invalid URL, Non-http protocol | Covered |
| ADF-8 | (via ADF-1 — no /dashboard rendered) | Implicit |
| ADF-9 | Rate limit exceeded | Covered |
