# Proposal: Sprint 18 — Remove PDF export feature

## Intent
Eliminar por completo la feature de exportación a PDF (rota en producción tras múltiples intentos de fix: mismatch de versiones puppeteer/chromium, nunca probada en prod). El feature es no esencial para el plan FREE y arrastra 3 dependencias pesadas (puppeteer-core, puppeteer, @sparticuz/chromium-min) que inflan el bundle de la función serverless.

## Scope (IN)
- `src/pdf/` completo (render.ts, report-template.ts, tests, next-config.test)
- Route `src/app/api/report/[id]/pdf/route.ts` + test
- `exportPdfHref`/`exportAnonCta` en toGeminiViewModel + AuditReport entry + AuditRunner threading
- Botón "Exportar PDF" en dashboard/audits/[id]/page.tsx
- Copy de PDF en copy.ts (3 menciones de beneficio + REPORT_EXPORT_COPY)
- Tests de PDF-10 (audit-report, audit-runner, dashboard page)
- Dependencias: puppeteer-core, puppeteer, @sparticuz/chromium-min
- Comentarios que mencionan "PDF" como contexto histórico (brand.ts, domain-metrics.ts, calculator.ts, brand.test, domain-metrics.test) — limpiar el texto, no la lógica

## Scope (OUT)
- Las pruebas de `application/pdf` como content-type del CRAWLER (fetch-types, fetch index, run-audit-edge-cases) — son del crawler, NO del feature de export
- ShareModal y su token (sigue siendo la forma de compartir)
- Toda la lógica de scoring/reportes web

## Approach
1. Eliminar archivos del feature
2. Limpiar imports/threading en presenters/report/dashboard
3. Limpiar copy
4. Remover dependencias de package.json + lockfile
5. Actualizar comentarios históricos
6. Actualizar specs (pdf-export → eliminado; app-shell/landing-page refs a PDF)
7. pnpm test + lint + typecheck + build verdes

## Risks
- Tests que rompen: audit-report.test (PDF-10 block), audit-runner.test (PDF-10 tests), dashboard page.test (Exportar PDF)
- Regresión del crawler si se tocan los content-type tests — NO tocarlos
- pnpm-lock cambios grandes por remover 3 deps

## Rollback
- `git revert` del merge PR (los archivos del feature se restauran completos)
