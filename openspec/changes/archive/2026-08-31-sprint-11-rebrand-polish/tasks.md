# Tasks: Sprint 11 — Rebrand to Relevy + polish

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,100 (30 files + 9 tests + docs) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 → PR2 → PR3 → PR4 (feature-branch-chain) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |
| Tracker branch | `feat/sprint-11-rebrand-polish` |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units (PRs)

| Unit | Goal | Likely PR | Base | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|------|----------------------|-----------------|-------------------|
| 1 | Brand foundation (brand.ts + copy + og + email) | PR 1 | tracker | `pnpm test -- src/lib/brand.test.ts src/lib/copy.test.ts` | `pnpm dev` landing shows Relevy | revert brand.ts/copy.ts imports |
| 2 | Surfaces + logo (layout/page/share/navbar/footer/icon/logo/a11y) | PR 2 | PR 1 | `pnpm test -- src/ui src/app` | `pnpm dev` navbar/favicon | revert surface edits |
| 3 | PDF + docs (report-template, pdf route, llms.txt, README, AGENTS, .env, comments) | PR 3 | PR 2 | `pnpm test -- src/pdf src/app/api/report` | `pnpm build` + llms.txt fetch | revert docs/template |
| 4 | Anonymous limiter + citability + legal (rate-limit, runner, citability, copy legal) | PR 4 | PR 3 | `pnpm test -- src/lib/rate-limit src/report src/citability` | 3 anon audits then 4th blocked | delete limiter call; reorder revert |

## Phase 1: Brand Foundation (PR 1)

- [x] 1.1 RED: create `src/lib/brand.test.ts` asserting `BRAND_NAME="Relevy"`, `SUPPORT_EMAIL`, `BRAND_DOMAIN`, `BRAND_REPO` (design §Brand). — DONE en PR 1 (8e4c908)
- [x] 1.2 GREEN: create `src/lib/brand.ts` exporting the four constants (design interface). — DONE en PR 1 (8e4c908); incluye BRAND_DESCRIPTOR="AI Visibility & GEO Audit" y BRAND_REPO como URL completa https://github.com/ezefernandezyf/relevy
- [x] 1.3 RED: update `src/lib/copy.test.ts` + `og.test.ts` to expect `BRAND_NAME`/`SUPPORT_EMAIL`. — DONE en PR 1 (80a0de7); + grep-gate unitario (JSON de COPY sin "GeoAudit") y asserts de OG_IMAGE.alt
- [x] 1.4 GREEN: replace ~15 brand literals + email in `src/lib/copy.ts` (copy.ts:265,337) with `BRAND_NAME`/`SUPPORT_EMAIL`; wire `og.ts` `siteName`/`alt` (SHL-9). — DONE en PR 1 (80a0de7): 15 refs reemplazadas (subtitleLead, 5 features, howItWorksTitle, platformsLead, terms.intro, terms[0]/[3]/[4], privacy.intro + emails profile/privacy)

## Phase 2: Surfaces + Logo (PR 2)

- [x] 2.6 GREEN: redesign `src/ui/logo.tsx` + `src/app/icon.svg` to Relevy mark; `showWordmark=false` = markOnly; placeholder navy tile + emerald `R` with TODO `swap when user provides SVG` (SHL-4). — DONE ANTICIPADO en PR 1 (f88cb7e) por decisión del orquestador (logo de Gemini YA disponible): mark real del usuario integrado (2 paths comillas navy #0f172a dark:fill-white + emerald #10b981, sin tile, viewBox 32x32), wordmark "Relevy" Instrument Serif, tagline eliminado (brief §3), API {size, showWordmark, className, decorative} preservada. favicon icon.svg = mismo símbolo.
- [x] 2.1 RED: update navbar/footer/logo/page/layout/crawl-assets/profile tests to expect `BRAND_NAME` + `Plan Free` (SHL-4, SHL-8, SHL-9, PRF-3, PRF-6, LND-9). — DONE en PR 2 (1b316a7, 5274d8c, b99a758, 877da73). EXCEPCIÓN RESUELTA: crawl-assets.test.ts:82 se actualizó en PR 3 junto con llms.txt (d7d47ba).
- [x] 2.2 RED: update `src/test/a11y-helpers.ts:30` brand-link aria-label → `"Relevy"` (easy-miss, design). — DONE en PR 2 (5274d8c); los 4 shells a11y (app/login/report/dashboard) pasan vía helper compartido.
- [x] 2.3 GREEN: replace wordmark/aria in `src/ui/navbar.tsx` + `footer.tsx` (`© Relevy`, mailto→`SUPPORT_EMAIL`). — DONE en PR 2 (5274d8c).
- [x] 2.4 GREEN: JSON-LD `name`/`url`/`sameAs` + title template in `layout.tsx`/`page.tsx`/`share`/`score-hero-evidence.ts` (LND-9); clear stale TODO. — DONE en PR 2 (1b316a7, b99a758). JSON-LD `url` sigue derivado de NEXT_PUBLIC_APP_URL (env de F3 lo setea en prod).
- [x] 2.5 GREEN: profile pill `free`→`Plan Free` (`dashboard/profile/page.tsx`, PRF-3). — DONE en PR 2 (877da73).

## Phase 3: PDF + Docs (PR 3)

- [x] 3.1 GREEN: PDF title/brand in `src/pdf/report-template.ts`, filename `relevy-{id}.pdf` in pdf `route.ts`, brand in `og.ts` alt. — DONE en PR 3 (ae10bc1, aa17d61): template title `${BRAND_NAME} — ${BRAND_DESCRIPTOR}`, wordmark `<span class="brand">${BRAND_NAME}</span>`, footer `${BRAND_NAME} — Reporte de auditoría GEO`; regla CSS muerta `.brand em` eliminada; filename `relevy-{id}.pdf` en route + test. og.ts alt YA estaba en PR 1 (80a0de7). Test nuevo en report-template.test.ts (title/brand/footer + not.toContain GeoAudit).
- [x] 3.2 GREEN: `public/llms.txt` → Relevy + `relevy.app` + 10/30d claim (LND-10); `README.md`, `AGENTS.md`, `.env.example` (`NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`). — DONE en PR 3 (d7d47ba, d219f0a): llms.txt reescrito (Relevy, relevy.app, "10 auditorías cada 30 días", sin claim stale ni geoaudit-tau); crawl-assets.test.ts:82 → `# Relevy` + aserción nueva LND-10 (límite 10/30d, sin "3 auditorías", sin geoaudit-tau); README/AGENTS rebrandeados; .env.example + NEXT_PUBLIC_APP_URL (consumida por sitemap/robots/page/layout) + NEXTAUTH_URL (doc-only, suggestion del verify).
- [x] 3.3 GREEN: clear stale comments (`presenters/types.ts` — ref a Descargas/geoaudit, `next.config.ts`, `vitest.config.ts`, `globals.css` plugin name). — DONE en PR 3 (3891501): presenters/types.ts → `/home/ezeyf/Descargas/relevy/src/types.ts`; next.config.ts header; vitest.config.ts plugin `relevy:css-stub` + header; globals.css tokens.
- [x] 3.4 DOC: document manual GitHub repo rename → `relevy` in README/AGENTS. — DONE en PR 3 (d219f0a): AGENTS.md nota "Repo" en Git Workflow (rename manual, geo-saas alias local, geoaudit prohibido como marca); README.md párrafo con URL del repo. EXTRA: scripts/scorehero-verify.test.ts dogfooding → relevy.app (87dc3f0), coordinado con redeploy.

## Phase 4: Anonymous Limit + Citability + Legal (PR 4)

- [x] 4.1 RED: extend `rate-limit/index.test.ts` — `anon:1.2.3.4` ≠ `1.2.3.4`, 3/30d fixed window via fake timers, kill switch (RTL-8). — DONE (c3098b3): 6 tests nuevos (constantes 3/30d, 3ra OK + 4ta bloqueada, ventana anclada día 29 bloqueado / día 31 reset, namespace anon:{ip} vs IP plana sobre store compartido, singleton dev/test, kill switch RTL-8 con resetModules). RED = 6 failed / 18 passed.
- [x] 4.2 GREEN: add `ANON_AUDIT_WINDOW_MS`, `ANON_AUDIT_MAX_REQUESTS`, `getAnonymousAuditLimiter()` singleton in `rate-limit/index.ts` (RTL-8). — DONE (c3098b3): singleton memoizado igual que getDefaultRateLimiter, mismo createDefaultStore (Prisma prod / InMemory dev-test) y kill switch heredado (RTL-7). GREEN = 24/24.
- [x] 4.3 RED: extend `audit-runner.test.tsx` — mock `headers()`, assert one `check("anon:{ip}")`, 4th blocked → `AnonymousLimitState`, no persist (TLM-6, TLM-11). — DONE (1fbbc79): mocks hoisted de next/headers + @/lib/rate-limit (anonLimiter compartido, default allowed para no romper tests anónimos previos). RED = 2 failed / 15 passed.
- [x] 4.4 GREEN: anonymous branch in `audit-runner.tsx` after `runAudit` (`!userId`), `headers()`→`resolveClientKey`→`anon:{ip}`; add limit copy (TLM-6, TLM-11). — DONE (1fbbc79): branch else con headers() → resolveClientKey → check(`anon:${ip}`) → AnonymousLimitState (role=alert, copy ANONYMOUS_AUDIT_LIMIT_COPY en copy.ts, neutral sin voseo). Logueados no tocan el limiter anónimo. GREEN = 17/17 + copy.test 21/21.
- [x] 4.5 RED: citability fixtures `page-three-blocks.html`/`page-four-blocks.html`; assert 3+0, 3+1, no id overlap (RCI-10). — DONE (457c70e): 4 fixtures nuevos — page-three-blocks (3), page-four-blocks (4), page-five-sections (5 genuino; el "five-blocks" existente tiene 6 — gotcha del design), page-eight-blocks (8). Asserts 3+0, 3+1, 3+2, 3+3 con complemento exacto (XOR) + orden worst-first/best-first. RED = 3 failed / 11 passed.
- [x] 4.6 GREEN: derive `bottom3` from `scored.filter(!top3Ids)` then `byBottom`+`slice(0,3)` in `src/citability/index.ts:101-102` (RCI-10). — DONE (457c70e): top3Ids = Set de ids del top3; bottom3 = complemento ordenado por byBottom acotado a 3. Contrato intacto (asserts exactos del fixture de 6 bloques siguen verdes; findings/report-template pasivos sin cambios). GREEN = 14/14 (46/46 con folder citability + run-audit).
- [x] 4.7 GREEN: rewrite `LEGAL_COPY.terms[2]` + drop "procesar pagos" in `privacy[1]`, keep numbering (LGL-6). — DONE (5273c39): terms[2] → "3. Plan único gratuito" (10 auditorías / ventana 30 días, sin costos ni suscripciones); privacy[1] sin "procesar pagos". Numeración preservada. RED = 3 failed / 21 passed → GREEN = 24/24.

## Phase 5: Gate (PR 4)

- [x] 5.1 Verify `grep -ri geoaudit src/ public/` zero visible hits (exclude prisma.test.ts + history). — VERIFICADO en PR 4: 0 hits en código de producción src/ + public/ (no-test). Quedan SOLO refs legítimas: aserciones NEGATIVAS (report-template.test.ts, copy.test.ts:151, share page.test.tsx:96, crawl-assets.test.ts:103, page.test.tsx), comments de documentación de eliminación (brand.test.ts:14, profile page.test.tsx:100, page.test.tsx:310, share page.test.tsx:93, AGENTS.md:53), fixtures sintéticos de test que simulan el sitio AUDITADO (platform meta-*.html ×3, page-ssr-rich.html, citability page-self-contained.html + meta.test.ts:16) y prisma.test.ts DATABASE_URL (excluido por design). Decisión F3 mantenida: fixtures se dejan (no son superficie de producto).
- [x] 5.2 Full suite `pnpm test` + `lint` + `typecheck` + `build` green once. — VERIFICADO en PR 4: `pnpm test` → 903 passed / 4 skipped / 0 failed (113 files); `pnpm run typecheck` 0 errores; `pnpm run lint` 0 errores (1 warning preexistente coverage/block-navigation.js, generado — fuera de scope); `pnpm run format` sin cambios pendientes. NOTA: `build` NO corrido en este batch — **RESUELTO en el gate de merge del orquestador**: `pnpm run build` OK post-merge (5273c39 en develop + main), PRs #66-#69 integrados.

## Estado final (reconciliado en archive)

23/23 tareas completas (1.1-1.4, 2.1-2.6, 3.1-3.4, 4.1-4.7, 5.1-5.2), 4 PRs (feature-branch-chain): PR #66 (feat/s11-f1), #67 (feat/s11-f2), #68 (feat/s11-f3), #69 (feat/s11-f4) — integrados a develop + main (5273c39).