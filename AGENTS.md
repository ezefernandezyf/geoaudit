# Relevy — Agent Context

> Micro-SaaS de auditoría GEO/SEO automatizada. Ingresá una URL → GEO Score 0-100 + reporte completo de AI visibility (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews, Bing Copilot).

## Stack

- **Framework**: Next.js 15 (App Router) + TypeScript strict
- **Styling**: Tailwind CSS 4 + design system propio con tokens (sin librerías de componentes prefabricadas)
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Auth**: NextAuth.js v5 (Auth.js) — GitHub OAuth (único proveedor)
- **Monetization**: None — single Free plan (10 audits / 30 days, no payments)
- **Email**: Resend (V1) — **PDF**: Puppeteer + HTML template con print CSS
- **Validation**: Zod 4 (contracts compartidos en `src/lib/contracts/`)
- **Testing**: Vitest + React Testing Library + Playwright E2E
- **Package Manager**: pnpm (build scripts aprobados con `pnpm approve-builds`)
- **Deploy**: Vercel + GitHub Actions (lint + typecheck + test) + Sentry (monitoring)

## Architecture

- **App Next.js única** — el server (RSC, Server Actions, API routes) y el client conviven en el mismo proyecto. Una sola terminal (`pnpm dev`). No hay monorepo server/web/shared.
- **Screaming Architecture**: los dominios de negocio son carpetas top-level en `src/`:
  - `src/crawlers/` — AI crawler access map (robots.txt parser + header checker)
  - `src/citability/` — citability block analysis + scoring
  - `src/schema/` — schema detection + JSON-LD validation/generation
  - `src/eeat/` — content E-E-A-T assessment
  - `src/platform/` — platform readiness checks
  - `src/scoring/` — GEO Score composite calculator
  - `src/lib/contracts/` — Zod schemas compartidos server/client
- **`app/` = SOLO routing** (`page.tsx`, `layout.tsx`, `route.ts`). Los Server Components en `app/` importan desde los dominios; la lógica de negocio NO vive en `app/`.
- **Flujo de datos**: Input → Zod validation → dominio (fetch + análisis) → render en Server Component.

## Design

- Dirección visual definida en **STYLE-BRIEF.md** (se crea antes del primer sprint de UI).
- **Sin librerías de componentes prefabricadas**: componentes propios con Tailwind + tokens.
- Validación con skills: `impeccable` (audit/critique/polish) + `design-taste-frontend` (dirección anti-genérica).
- Base del brief §12: navy `#0f172a` + emerald `#10b981` + amber `#f59e0b` + red `#ef4444`; Instrument Serif (headings) + Work Sans (body) + JetBrains Mono (JSON-LD).
- **Animación: funcional sí, decorativa no.** Crítico: skeleton con pulso durante el audit asíncrono (streaming/Suspense). Micro-interacciones al mínimo.
- **Anti-patterns pesan máximo** (producto data-heavy): nada de dashboards genéricos, tablas ilegibles o scores sin contexto.
- UX states obligatorios: Loading / Success / Error / Empty para todo proceso asíncrono.

## Conventions

- Conventional Commits: `feat(scope):`, `fix(scope):`, `chore:`, `docs:`, `test(scope):` — **título en inglés, descripción en español**
- TypeScript: strict mode, never `any`
- Never build after changes, never add "Co-Authored-By" to commits
- ESLint + Prettier en cada cambio: `pnpm run lint` / `pnpm run format`
- Zod: contracts en `src/lib/contracts/` como single source of truth (server valida, client infiere tipos)
- Cero sobreingeniería. Cero complejidad sin justificación explícita. "Clear over clever."

## Git Workflow (STRICT — zero exceptions)

**Repo**: renombrado manualmente a `relevy` en GitHub ([github.com/ezefernandezyf/relevy](https://github.com/ezefernandezyf/relevy)); el checkout local puede conservar el nombre `geo-saas` y el alias redirige. `geoaudit` no debe reaparecer como marca visible en ningún artefacto nuevo.

1. **`develop`** = rama de integración (fuente de verdad en desarrollo). **`main`** = release estable: SOLO versiones 100% estables, se mergea `develop → main` al completar cada sprint/milestone.
2. **Feature branches**: cada tarea arranca en una branch nueva desde `develop`: `feat/short-name`, `fix/short-name`, `chore/short-name`
3. **Atomic commits**: un cambio lógico por commit, formato conventional
4. **PR a develop primero**: push branch → PR a `develop`, squash-merge
5. **Main on milestone**: `develop` → PR a `main` cuando el sprint está completo
6. **Clean working tree**: sin archivos untracked, sin WIP antes del PR
7. **Lint antes de push**: `pnpm run lint && pnpm run format` deben pasar
8. **Tests antes de merge**: `pnpm test` debe pasar
9. **HARD GATE**: `pnpm dev` + smoke test manual antes de mergear a `main`

## How to Run

```bash
pnpm install              # instala dependencias
pnpm run prisma:generate  # genera el cliente Prisma
pnpm run prisma:migrate   # corre migraciones
pnpm dev                  # UNA sola terminal: Next dev server (server + client)
```

## Fases SDD

`explore → propose → spec → design → tasks → apply → verify → archive`

- **Modo interactivo**: después de cada fase, el orquestador muestra el resultado y espera decisión del usuario antes de lanzar la siguiente.
- **Artefactos**: `both` — OpenSpec (archivos versionables en `openspec/`) + Engram (recuperación entre sesiones).
- **PRs**: `ask-on-risk` — si el plan de tareas estima riesgo alto o >400 líneas, se pregunta antes de aplicar.
- **Review budget**: 400 líneas.
- **Modo profesor**: nunca dar la solución completa; guiar con preguntas y pistas; corregir errores; no avanzar hasta que el usuario demuestre comprensión.

## Roadmap

- **Referencia única**: `geo-saas-brief.md` §17 — Sprint 0 (setup) → Sprint 7 (launch). NO duplicar el detalle acá. El avance posterior al Sprint 7 (8, 9, …) vive en los changes SDD de `openspec/changes/`.
- **STYLE-BRIEF.md** se crea antes del primer sprint de UI (entrada al Sprint 2), no antes.
- Cada sprint se ejecuta como un change SDD propio; el detalle se define en la fase proposal de ese change, no de antemano.

## Skills clave

- `geo-audit`, `geo-citability`, `geo-schema`, `geo-technical`, `geo-report` — el audit engine es la versión SaaS del workflow de consultoría GEO del usuario.
- `impeccable`, `design-taste-frontend` — dirección y validación de diseño.
