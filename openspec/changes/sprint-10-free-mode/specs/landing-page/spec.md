# Landing Page Delta

> **Change**: `sprint-10-free-mode` · **Type**: Delta (MODIFIED)

## Purpose

Remove the pricing teaser and the "Ver Planes" CTA. The anonymous primary CTA repoints to signup/audit. Hero form, feature cards, scorecard, platforms, and metadata are unchanged.

## MODIFIED Requirements

### Requirement: Authenticated CTA (LND-6)

When the Home page renders, then it MUST call `auth()` (making Home dynamic) and adapt the CTA: with an active session the CTA reads "Ir al dashboard", and without a session it reads a signup/audit CTA (e.g. "Auditar gratis"). There is no pricing teaser or "Ver Planes" CTA.

(Previously: the anonymous CTA read "Ver planes y precios".)

#### Scenario: Logged-in user sees dashboard CTA

- GIVEN an active session
- WHEN Home renders
- THEN the primary CTA reads "Ir al dashboard"

#### Scenario: Anonymous visitor sees audit CTA

- GIVEN no session
- WHEN Home renders
- THEN the primary CTA reads a signup/audit CTA (e.g. "Auditar gratis")
- AND no pricing link is present
