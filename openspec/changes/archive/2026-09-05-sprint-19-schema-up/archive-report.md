# Archive Report: Sprint 19 — Schema Up

- **Change**: `2026-09-05-sprint-19-schema-up`
- **Archived**: 2026-09-05
- **Project**: Relevy (repo local `geo-saas`, GitHub `relevy`)
- **Mode**: hybrid (OpenSpec + Engram)
- **Branch**: `feat/sprint-19-schema-up` (sin mergear aún — el orquestador crea el PR a develop después)

## Status at Close

- **Verdict**: PASS WITH WARNINGS
- **Completeness**: 5/5 requirements, 16/16 scenarios compliant.
- **Tasks**: 21/21 checkboxes `[x]` in the persisted `tasks.md` (6 work units + final gate). Zero unchecked tasks; no archive-time reconciliation needed.
- **Tests**: `pnpm test` → 1058 passed / 0 failed / 4 skipped (115 files passed | 1 skipped); `pnpm run lint` → exit 0; `pnpm run typecheck` → exit 0 (build gate per repo convention — never build after changes).
- **Engine fixture (one-shot)**: `scoreSchema(page("ld-landing-93.html"))` → `businessType === "publisher"`, `score === 93`.
- **Review gate**: no receipt-driven review artifacts exist for this candidate (no `reviewGate` in structured status; no review artifacts anywhere in the repo) — archived under ordinary repository policy.
- **Milestone**: NO mergeado. Implementación en `feat/sprint-19-schema-up` (7 commits sobre develop `d6eb900`); PR a develop pendiente (el orquestador lo crea tras el archive).

## Alcance entregado (racional)

Sprint 19 sube el schema score de la landing de 62 → 93 con datos 100% reales (LND-7, nunca inventar), y agrega `BreadcrumbList` al dashboard autenticado.

1. **`ORG_SAME_AS` 3→5 (LND-9 MODIFIED)**: `src/lib/brand.ts` agrega 2 perfiles reales verificados — `https://www.tiktok.com/@ezefernandezdev` y `https://github.com/ezefernandezyf/relevy` — a los 3 existentes (github.com/ezefernandezyf, linkedin.com/in/ezequiel-fernandez-59a21a387, ezefernandez.com). `countValidSameAs` sube de 9 (3×3) a 15 (5×3); `FOUNDER` hereda por referencia.
2. **Article JSON-LD (LND-19.2 ADDED)**: tercer bloque `<script type="application/ld+json">` `@type:"Article"` (NO TechArticle) en `src/app/page.tsx` (`ArticleJsonLd()` local, patrón de Organization/WebSiteJsonLd), con datos reales de `copy.ts`/`brand.ts`: `headline` = heading del Case Study, `datePublished` "2026-08-20", `dateModified` "2026-08-28", `author` = `FOUNDER`, `publisher` = Organization Relevy, `url` = `APP_URL`. → `article_author` 10/10 + `business_type_schema` publisher 10/10.
3. **`speakable` + `#case-study` (LND-19.3 ADDED)**: el Article lleva `speakable.cssSelector: ["#case-study"]` y el recuadro del Case Study (div, no section) gana `id="case-study"` en el HTML servido (page.tsx). → `speakable` 5/5, con test de presencia (sin selector colgante, honestidad).
4. **`award` NO inventado (LND-19.4 ADDED)**: no existe premio real; se omite y `src/lib/brand.ts` documenta `missing_recommended` honesto 13/15 (13/15 en `organization_person`). Sin test que afirme un award inventado.
5. **BreadcrumbList dashboard (DASH-19.1 ADDED)**: componente compartido `src/ui/breadcrumb-list-json-ld.tsx` (`BreadcrumbListJsonLd({ items })`, ListItem posicional 1-based, `item` absoluto) inyectado en 3 rutas autenticadas: `/dashboard` (Home > Dashboard), `/dashboard/audits/[id]` (Home > Dashboard > Auditoría), `/dashboard/profile` (Home > Dashboard > Perfil). → `breadcrumbs` 5/5. No existe `dashboard/layout.tsx`; inyección por página.
6. **Fixture engine**: `src/schema/__fixtures__/ld-landing-93.html` (mirror de la landing) pin `scoreSchema` → 93 + `businessType` publisher (test one-shot `index.test.ts`).

Cero cambios de scoring fuera de schema, cero monetización, cero cambios fuera del scope del proposal.

## Delivery Notes

- Rama `feat/sprint-19-schema-up` (7 commits sobre develop `d6eb900`): `0c26894` (feat(schema): add tiktok and github sameAs) · `7a91078` (feat(landing): add Article JSON-LD with speakable) · `ab99fa1` (feat(dashboard): add BreadcrumbList JSON-LD) · `86402b4` (test(schema): pin landing-93 fixture + engine assertions) · `f855502` (docs(schema): document award missing_recommended 13/15) · `4e759e8` (docs(sdd): mark tasks complete) · `9076ffa` (docs(sdd): verify sprint-19-schema-up).
- **Merge**: NO realizado al cierre del archive. PR a develop en curso (el orquestador lo crea después; commit de archive NO se pushea).
- Commit de archive: `chore(sdd): archive sprint-19-schema-up` (conventional — título EN, descripción ES). Sin push, sin PR.

## Archive-time Reconciliation

Ninguna — todos los checkboxes de `tasks.md` estaban `[x]` en el artefacto persistido al momento del archive (21/21). El Task Completion Gate pasó sin reparación excepcional.

## Verification Findings (carried to close, non-blocking)

Registradas como FOLLOW-UPS / notas, no como blockers (forward de hechos finales del orquestador, 2026-09-05):

- **WARNING (TDD evidence format)**: `apply-progress` reporta la evidencia TDD como prosa por-WU, no como la tabla estricta RED/GREEN/TRIANGULATE/SAFETY NET/REFACTOR de `strict-tdd-verify.md`. La sustancia está presente (RED→GREEN descrito por WU con nombres de test; 9 test files modificados/agregados; 1058 pass / 0 fail), pero el orden RED-first lo afirma el agente de apply, no es verificable independientemente desde el DAG git (cada WU commitea test+impl atómicamente). No bloquea: los tests existen y pasan.
- **SUGGESTION (drift de IDs en proposal)**: `proposal.md` usa IDs pre-finales `REQ-19.1/19.2/19.3` vs los IDs finales de los delta specs (`LND-19.2/19.3/19.4`, `DASH-19.1`). Drift cosmético de docs; los delta specs (y ahora el canonical) son autoritativos.
- **SUGGESTION (breadcrumbs cubiertos indirectamente)**: `DASH-19.1` "Breadcrumbs criterion satisfied" se cubre indirectamente (criterio del engine vía `ld-rubric-rich.html` → breadcrumbs 5 + 3 tests de estructura del dashboard). Ningún test corre `scoreSchema` sobre un BreadcrumbList servido end-to-end — aceptable por diseño (el crawl dogfood autenticado nunca entra al dashboard). Futura triangulación posible.
- **Score verificado**: fixture `ld-landing-93.html` pin `score === 93` + `businessType === "publisher"`.

## Final-State Facts (from orchestrator, outrank intermediate snapshots)

- Implementación completa y verificada en `feat/sprint-19-schema-up` (7 commits); verify PASS WITH WARNINGS 5/5 · 16/16 · 1058 tests.
- **NO mergeado** al cierre del archive: el orquestador crea el PR a develop después.
- Los findings (1 WARNING + 2 SUGGESTIONs) se registran como follow-ups, NO como blockers del archive.
- Commit de archive: `chore(sdd): archive sprint-19-schema-up` — título EN, descripción ES. Sin push, sin PR.

## Spec Sync (delta → canonical)

| Domain | Action | Details |
|--------|--------|---------|
| landing-page | Actualizado (merge de delta) | LND-9 MODIFIED (`ORG_SAME_AS` 3→5, 5 perfiles reales, sameAs 15/15, escenario "sameAs scores 15/15" agregado, nota "(Previously:)" actualizada) + LND-19.2 ADDED (Article JSON-LD real) + LND-19.3 ADDED (speakable `#case-study`) + LND-19.4 ADDED (award honesto `missing_recommended` 13/15). Tabla de requisitos + Compliance Matrix actualizadas. |
| dashboard | Actualizado (merge de delta) | DASH-19.1 ADDED (BreadcrumbList en 3 rutas autenticadas, componente compartido). Tabla de requisitos + Compliance Matrix actualizadas. |

`docs/SPRINT-ROADMAP.md` actualizado: Sprint 19 (Schema Up) marcado archivado (1058 tests, PASS WITH WARNINGS 5/5 · 16/16, fixture pin 93, PR a develop en curso); Close Free pasa a **Sprint 20** (Sentry + brand presence final + announce/marketing + dominio + remote `relevy.git` + follow-ups W-1..W-3 del Sprint 18 + merge de `feat/sprint-19-schema-up`).

## Mechanical Copy Evidence

Archival move performed with native shell: `git mv` (archivos trackeados) movió el folder completo a `openspec/changes/archive/2026-09-05-sprint-19-schema-up/`; snapshot recursivo pre-move comparado contra el folder archivado:

```text
$ diff -r <snapshot>/source openspec/changes/archive/2026-09-05-sprint-19-schema-up
(no output — byte-identical, exit 0)
```

`archive-report.md` es additive-only (no existía en el snapshot fuente) y queda excluido de la comparación. Diff status 0 es la única evidencia de paso.

## Engram Traceability

Hybrid persistence: archive report guardado en Engram como `sdd/2026-09-05-sprint-19-schema-up/archive-report` (proyecto `geoaudit`, tipo architecture, capture_prompt false). Los artefactos se leyeron del filesystem OpenSpec (`openspec/changes/sprint-19-schema-up/` + canonical `openspec/specs/`); no se requirieron lecturas de observaciones de Engram para esta fase (change respaldado por filesystem).

## Roadmap

`docs/SPRINT-ROADMAP.md` actualizado: Sprint 19 (Schema Up) archivado (1058 tests, PASS WITH WARNINGS 5/5 · 16/16, fixture `ld-landing-93` pin 93 + publisher); Close Free pasa a **Sprint 20** (Sentry + brand presence final + announce/marketing + dominio + remote `relevy.git`; follow-ups W-1..W-3 del Sprint 18; merge de `feat/sprint-19-schema-up` a develop).
