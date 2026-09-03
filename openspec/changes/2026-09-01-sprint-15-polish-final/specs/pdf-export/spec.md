# Delta for PDF Export

> **Change**: `2026-09-01-sprint-15-polish-final` · **Type**: Delta (MODIFIED)

## Racional

El gate de PDF ya existe (PDF-2/PDF-9: auth 401 + ownership 404, sin bypass por share token), pero el único trigger es `/dashboard/audits/[id]` — en `/report` post-auditoría no hay ningún affordance. Se agrega la entrada "Exportar PDF" en el reporte live para usuarios logueados cuyo audit tiene id persistido (persistencia best-effort), linkeando DIRECTO a `/api/report/{id}/pdf`: el approach más simple y seguro — un click, y la route ya garantiza auth + ownership sin endurecer nada. Los anónimos ven copy de beneficio con CTA a signup (gate de marketing, no de seguridad).

| # | Change | Summary |
|---|--------|---------|
| PDF-10 | ADDED | Entrada "Exportar PDF" en reporte live (logueado + id persistido → `/api/report/{id}/pdf`); anónimos → CTA signup; route intacta |

## ADDED Requirements

### Requirement: Live Report Export Entry (PDF-10)

When the live report (`/report` post-audit) renders for an authenticated user and the audit has a persisted id, then it MUST show an "Exportar PDF" entry linking directly to `/api/report/{id}/pdf` (ownership enforced by the existing route, PDF-2). When no persisted id exists (best-effort persistence failed), the entry MUST NOT render — no dead link. When the user is anonymous, the report MUST show PDF account-benefit copy with a signup CTA instead of the export entry. The PDF route MUST NOT be hardened or changed (PDF-2/PDF-9 already gate).

#### Scenario: Logged-in user with persisted id exports

- GIVEN an authenticated user whose audit persisted with id `123`
- WHEN the report renders
- THEN an "Exportar PDF" entry is visible linking to `/api/report/123/pdf`

#### Scenario: Persistence failed → no entry

- GIVEN an authenticated user whose audit did not persist (no id)
- WHEN the report renders
- THEN no export entry is shown (no dead or broken link appears)

#### Scenario: Anonymous user sees signup CTA

- GIVEN an anonymous user on the report
- WHEN the report renders
- THEN no export entry is shown
- AND PDF account-benefit copy with a signup CTA is displayed instead

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| PDF-10 | Logged-in user with persisted id exports, Persistence failed → no entry, Anonymous user sees signup CTA | Covered |