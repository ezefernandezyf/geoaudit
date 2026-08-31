# Relevy

Micro-SaaS de auditoría GEO (Generative Engine Optimization) y SEO para visibilidad en motores de búsqueda con IA. Ingrese una URL y obtenga un GEO Score de 0 a 100 con un reporte completo de AI visibility en ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews y Bing Copilot.

El repositorio vive en [github.com/ezefernandezyf/relevy](https://github.com/ezefernandezyf/relevy) (renombrado manualmente desde `geo-saas`; el alias redirige).

## Qué hace

Relevy analiza un sitio web en cinco dimensiones y entrega un score compuesto ponderado:

| Dimensión | Peso (v2.0.0) | Qué evalúa |
| --------- | ------------- | ---------- |
| Citabilidad | 28 % | Probabilidad de que los motores de IA citen pasajes de la página como fuente |
| E-E-A-T | 24 % | Experiencia, experticia, autoridad y confiabilidad del contenido |
| Técnico | 20 % | Acceso de crawlers de IA (robots.txt, headers, metaetiquetas) |
| Schema | 14 % | JSON-LD / Schema.org para corroboración de entidades |
| Plataforma | 14 % | Readiness, SSR, OpenGraph y headers por motor generativo |

Cada auditoría genera un reporte con hallazgos priorizados, desglose por categoría, exportación PDF y links de compartición. El plan Free incluye 10 auditorías cada 30 días, con multi-página, PDF y compartición incluidos.

## Stack

- **Framework**: Next.js 15 (App Router) + TypeScript strict
- **Styling**: Tailwind CSS 4 + design system propio (sin librerías de componentes)
- **Base de datos**: PostgreSQL (Supabase) + Prisma ORM (driver adapters)
- **Auth**: NextAuth.js v5 (Auth.js) — GitHub OAuth
- **Plan**: Free único — 10 auditorías / 30 días (sin pagos)
- **Email**: Resend — **PDF**: Puppeteer + HTML template con print CSS
- **Validación**: Zod 4 (contracts compartidos en `src/lib/contracts/`)
- **Testing**: Vitest + React Testing Library + Playwright E2E + @axe-core/playwright
- **Deploy**: Vercel + GitHub Actions (lint + typecheck + test) + Sentry

## Requisitos

- Node.js 20+ y pnpm
- Una instancia de PostgreSQL (Supabase) para `DATABASE_URL`
- (Opcional) Apps de OAuth GitHub y Resend para los flujos completos

## Cómo correr

```bash
pnpm install              # instala dependencias
cp .env.example .env      # completa las variables (ver .env.example)
pnpm run prisma:generate  # genera el cliente Prisma
pnpm run prisma:migrate   # corre las migraciones
pnpm dev                  # Next dev server (server + client) en :3000
```

## Cómo testear

```bash
pnpm test                          # suite completa (Vitest)
pnpm test <ruta>                   # tests acotados a un archivo/carpeta
pnpm verify:scorehero              # diagnóstico de calibración sobre 13 URLs reales
pnpm run lint && pnpm run typecheck
```

Los tests E2E de a11y y contraste (`src/app/__tests__/a11y-contrast.test.ts`) requieren el dev server arriba y se saltan en CI sin server (convención skip-if-no-env):

```bash
pnpm dev   # terminal 1
A11Y_CONTRAST_URL=http://localhost:3000 pnpm test src/app/__tests__/a11y-contrast.test.ts
```

## Estructura

Screaming Architecture: los dominios de negocio son carpetas top-level en `src/`, y `app/` es solo routing (Server Components que importan desde los dominios).

```
src/
├── crawlers/      # AI crawler access map (robots.txt + header checker)
├── citability/    # análisis de citabilidad + scoring
├── schema/        # detección de schema + validación/generación JSON-LD
├── eeat/          # evaluación de contenido E-E-A-T
├── platform/      # readiness por plataforma (SSR, OpenGraph, headers)
├── scoring/       # calculadora del GEO Score compuesto
├── report/        # presentadores y componentes del reporte
├── dashboard/     # dashboard de historial de auditorías
├── ui/            # componentes UI propios (design system)
└── lib/           # contracts (Zod), copy centralizada, rate limiting, fetch
```

La copia de UI está centralizada en `src/lib/copy.ts` en español neutro (usted, sin voseo).

## SDD

El proyecto se desarrolla con SDD (Spec-Driven Development): cada sprint es un *change* con proposal, spec, design, tasks, apply y verify. Los artefactos viven en `openspec/`:

- `openspec/changes/` — changes activos (proposal, spec, design, tasks por sprint)
- `openspec/specs/` — specs de capacidades (delta por change)

## Convenciones

- Conventional Commits: `feat(scope):`, `fix(scope):`, `chore:`, `docs:` — título en inglés, descripción en español
- TypeScript strict, nunca `any`
- Sin librerías de componentes prefabricadas: componentes propios con Tailwind + tokens
- Cero sobreingeniería. Cero complejidad sin justificación explícita
- Git: `develop` es la rama de integración; `main` solo releases estables (ver AGENTS.md)