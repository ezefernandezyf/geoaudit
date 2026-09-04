# Delta for PDF Export

> **Change**: `2026-09-01-sprint-17-ui-polish` · **Type**: Delta (MODIFIED)

## Racional

El pack de chromium-min se descarga en runtime desde el release pinneado `v149.0.0` de GitHub. Desde esa versión los assets llevan sufijo de arquitectura (`chromium-v149.0.0-pack.x64.tar` / `...-arm64.tar`); la URL sin sufijo (`...-pack.tar`) devuelve HTTP 404 → `PdfRenderError` → 500 `{"error":"render_failed"}` en producción. La constante `CHROMIUM_PACK_URL` pasa a ser un resolver exportado `resolveChromiumPackUrl(arch = process.arch)` que deriva la URL por arquitectura y lanza error tipado en arch no soportado (Vercel corre x86_64 hoy; la derivación por `process.arch` es robusta si se habilita arm64). Cero tests existentes se rompen: `render.test.ts` inyecta `deps.launch` (nunca toca la URL) y `route.test.ts` mockea `@/pdf/render` completo. El resolver queda pinneado con tests unitarios en ambas ramas.

| # | Change | Summary |
|---|--------|---------|
| PDF-4 | MODIFIED | `CHROMIUM_PACK_URL` (constante sin sufijo, 404 en prod) → `resolveChromiumPackUrl(arch)` con assets x64/arm64 correctos + error tipado en arch no soportado; tests pinnean ambas ramas |

## MODIFIED Requirements

### Requirement: Render Pipeline (PDF-4)

When a PDF is generated, then the system MUST launch headless Chromium via `puppeteer-core` + `@sparticuz/chromium-min` and render the report template to PDF. In production (`NODE_ENV === "production"`), the chromium-min release pack MUST be resolved from the pinned GitHub release `v149.0.0` by the runtime architecture (`process.arch`): `x64` MUST resolve to `chromium-v149.0.0-pack.x64.tar` and `arm64` MUST resolve to `chromium-v149.0.0-pack.arm64.tar`. An unsupported architecture MUST throw the typed `PdfRenderError` (never a bare 404 download). The bare `chromium-v149.0.0-pack.tar` URL (no arch suffix) MUST NOT be used — it returns HTTP 404 and surfaces as `render_failed`.
(Previously: a single hardcoded `CHROMIUM_PACK_URL` without an arch suffix — the v149 assets were renamed with arch suffixes, so production downloads 404ed and the PDF route returned `{"error":"render_failed"}`.)

#### Scenario: Template rendered to PDF

- GIVEN a report template for an audit
- WHEN the render pipeline runs
- THEN Chromium renders the HTML and returns PDF bytes

#### Scenario: x64 resolves the arch-suffixed pack

- GIVEN a production runtime on `x64`
- WHEN `resolveChromiumPackUrl("x64")` is called
- THEN it returns `https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar`
- AND the mapping is pinned by a unit test in `render.test.ts`

#### Scenario: arm64 resolves the arch-suffixed pack

- GIVEN a production runtime on `arm64`
- WHEN `resolveChromiumPackUrl("arm64")` is called
- THEN it returns `https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.arm64.tar`
- AND the mapping is pinned by a unit test in `render.test.ts`

#### Scenario: Unsupported architecture throws a typed error

- GIVEN an architecture other than `x64` or `arm64`
- WHEN the resolver runs
- THEN it throws the typed `PdfRenderError`
- AND no download attempt is made against GitHub

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| PDF-4 | Template rendered to PDF, x64 resolves the arch-suffixed pack, arm64 resolves the arch-suffixed pack, Unsupported architecture throws a typed error | Covered |