# Archive Report: Sprint 18 — Remove PDF Export

- **Change**: `2026-09-05-sprint-18-remove-pdf`
- **Archived**: 2026-09-05
- **Project**: Relevy (repo local `geo-saas`, GitHub `relevy`)
- **Mode**: hybrid (OpenSpec + Engram)

## Status at Close

- **Verdict**: PASS WITH WARNINGS
- **Completeness**: N/A — feature removal, no delta specs (0 requirements, 0 scenarios). Scope authority: `proposal.md`; correctness proven by the verify removal checklist (10/10) plus runtime gates.
- **Tasks**: 28/28 checkboxes `[x]` in the persisted `tasks.md` (6 work units + final gate). Zero unchecked tasks; no archive-time reconciliation needed.
- **Tests**: `pnpm test` → 1049 passed / 0 failed / 4 skipped (115 files passed | 1 skipped); `pnpm run lint` → exit 0; `pnpm run typecheck` → exit 0; `pnpm run build` → exit 0 (route `/api/report/[id]/pdf` gone from route table).
- **Milestone**: main = develop = `eeeaf3f` = merge of PR #83 (Sprint 18: Remove PDF export feature). 32 files changed, +37 / −1978 lines.
- **Review gate**: no receipt-driven review artifacts exist for this candidate (no `reviewGate` in structured status; no review artifacts anywhere in the repo) — archived under ordinary repository policy.

## Alcance entregado (racional)

Remoción completa de la feature de export PDF, rota en producción tras múltiples intentos de fix (mismatch de versiones puppeteer/chromium, nunca probada en prod) y no esencial para el plan FREE. El feature arrastraba 3 dependencias pesadas (puppeteer-core, puppeteer, @sparticuz/chromium-min) que inflaban el bundle de la función serverless.

1. **Pipeline + route eliminados**: `src/pdf/` completo (render.ts, report-template.ts, `__tests__/*`) y `src/app/api/report/[id]/pdf/route.ts` + `__tests__/route.test.ts`.
2. **Report layer limpio**: `toGeminiViewModel` sin `exportPdfHref`/`exportAnonCta` en `ViewModelContext`; `audit-report.tsx` sin bloque de export (FileDown/Link/REPORT_COPY); `audit-runner.tsx` sin threading `persistedId`; `prisma.audit.create` INTACTO (persistencia preservada).
3. **Dashboard sin botón**: "Exportar PDF" eliminado de `dashboard/audits/[id]/page.tsx`; `ShareModal` INTACTO (sigue siendo la forma de compartir).
4. **Copy limpio**: 3 menciones de beneficio + `REPORT_COPY.export`/`REPORT_EXPORT_COPY` eliminados de `copy.ts`; comentarios históricos de "PDF" limpiados en brand.ts, domain-metrics.ts, calculator.ts y sus tests — sin tocar lógica.
5. **Dependencias removidas**: `puppeteer-core`, `puppeteer`, `@sparticuz/chromium-min` fuera de `package.json`; `next.config.ts` sin la PDF-8 bundle config (serverExternalPackages + outputFileTracingIncludes).
6. **Specs + E2E**: `openspec/specs/pdf-export/` eliminado (canonical); refs de export limpiadas en audit-detail (ADP-8), e2e-testing (E2E-5), deploy-vercel (DPV-4), performance, audit-limits, audit-orchestrator, audit-presenters; `e2e/pdf-download.spec.ts` eliminado.
7. **Crawler preservado**: los tests de content-type `application/pdf` del CRAWLER (fetch-types, fetch index, run-audit-edge-cases) quedaron INTACTOS — no son del feature de export.

Cero cambios de scoring/engine, cero monetización, cero cambios fuera del scope de remoción del proposal.

## Delivery Notes

- Rama `feat/sprint-18-remove-pdf` (6 commits sobre develop `59a4513`): `08ae423` (pipeline + route), `adfba19` (report layer), `9dca0a6` (dashboard), `9de35a2` (copy + comentarios), `03ceacf` (deps), `e2253fb` (specs + E2E).
- Merge: PR #83 → develop → main. **main = develop = `eeeaf3f`** (ya mergeado y pusheado antes del archive; el commit de archive no se pushea).
- No `apply-progress.md` fue producido en este change (gap de proceso documentado en verify, no bloqueante): para una remoción, el equivalente TDD — "tests removidos con el código, suite verde" — fue confirmado por re-ejecución independiente (1049 passed / 0 failed).

## Archive-time Reconciliation

Ninguna — todos los checkboxes de `tasks.md` estaban `[x]` en el artefacto persistido al momento del archive (28/28). El Task Completion Gate pasó sin reparación excepcional.

## Verification Warnings (carried to close, non-blocking)

Registradas como FOLLOW-UPS, no como blockers (forward de hechos finales del orquestador, 2026-09-05):

- **W-1**: `pnpm-lock.yaml` retiene `puppeteer-core@25.8.0` + `@puppeteer/browsers@3.2.1` como dependencias transitivas dev-only de `lighthouse@13.4.1` (devDep pre-existente para `pnpm run lighthouse`, no relacionada con el feature PDF). No entra al bundle serverless. Follow-up: limpiar solo si se remueve lighthouse; aceptable como dev-only.
- **W-2**: `node_modules/.pnpm/@sparticuz+chromium-min@149.0.0` queda como directorio huérfano (ausente de `package.json` y `pnpm-lock.yaml`). Follow-up: un `pnpm install` fresco lo pruna. Sin efecto en CI/Vercel.
- **W-3**: menciones históricas de Puppeteer en `openspec/config.yaml:6` (stack target) y `README.md:28` (Email/PDF). Follow-up cosmético para un sprint futuro (Close Free).

Además (per `verify-report`, suggestions, verificadas como NO remanentes del feature): `src/citability/__fixtures__/page-structure-partial.html:11` contiene "PDF" como contenido natural del fixture; `src/app/__tests__/a11y-contrast.test.ts:63` referencia `~/.cache/puppeteer/` como fallback executable de Playwright (pre-existente).

## Final-State Facts (from orchestrator, outrank intermediate snapshots)

- Merge: PR #83 (`eeeaf3f`) merged a develop y main; **main = develop = `eeeaf3f`**.
- Los 3 warnings de verify-report se registran como follow-ups del roadmap, NO como blockers del archive.
- Commit de archive: `chore(sdd): archive sprint-18-remove-pdf` (conventional — título EN, descripción ES). Sin push, sin PR.

## Spec Sync (delta → canonical)

| Domain | Action | Details |
|--------|--------|---------|
| pdf-export | Eliminado (ya aplicado en apply) | `openspec/specs/pdf-export/spec.md` (PDF-1..PDF-10) borrado en commit `e2253fb` (merged vía PR #83) — la capability ya no existe |
| audit-detail | Actualizado (ya aplicado) | ADP-8 (Export PDF button) removido; nota "removed with the PDF export feature (Sprint 18)" |
| e2e-testing | Actualizado (ya aplicado) | E2E-5 (PDF download flow) removido; nota Sprint 18 |
| deploy-vercel / performance / audit-limits / audit-orchestrator / audit-presenters | Actualizado (ya aplicado) | refs de export eliminadas; solo refs de crawler content-type preservadas (RFL-8, RAO-13) |

**No hubo delta specs que mergear en este archive**: el change es una remoción pura (0 requirements, 0 scenarios — `specs/` del change vacío). Los updates canónicos se hicieron durante apply (commit `e2253fb`) y quedaron mergeados en `eeeaf3f`; el archive verificó el estado canónico final limpio (sin `openspec/specs/pdf-export/`; refs restantes = crawler content-type + notas "removed in Sprint 18"). Sin REMOVED/RENAMED delta handling; sin merge destructivo en archive-time (la regla `rules.archive` "Warn before merging destructive deltas" no aplica).

## Mechanical Copy Evidence

Archival move performed with native shell: `git mv` rejected the untracked source directory ("directorio de fuente está vacío") → `mv` fallback; pre-move recursive snapshot compared against the archived folder:

```text
$ diff -r <snapshot>/source openspec/changes/archive/2026-09-05-sprint-18-remove-pdf
(no output — byte-identical, exit 0)
```

`archive-report.md` is additive-only (did not exist in the source snapshot) and excluded from the comparison. Diff status 0 is the only passing evidence.

## Engram Traceability

Hybrid persistence: archive report saved to Engram as `sdd/2026-09-05-sprint-18-remove-pdf/archive-report` (project `geoaudit`, type architecture, capture_prompt false). Artifacts were read from the OpenSpec filesystem (`openspec/changes/2026-09-05-sprint-18-remove-pdf/` + canonical `openspec/specs/`); no Engram observation reads were required for this phase (filesystem-backed change).

## Roadmap

`docs/SPRINT-ROADMAP.md` actualizado: Sprint 18 (Remove PDF) marcado archivado (main = develop = `eeeaf3f` = PR #83, 1049 tests, PASS WITH WARNINGS 0/0); D6 (PDF: Puppeteer en Vercel) marcado OBSOLETO; Close Free pasa a **Sprint 19** (Sentry + brand presence final + announce/marketing + dominio + remote `relevy.git`); W-1..W-3 registrados como deudas pendientes del roadmap.