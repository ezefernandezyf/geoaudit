# Design: Sprint 7 — UI Fidelity

## Technical Approach

Port 1:1 de los componentes Gemini (referencia `/home/ezeyf/Descargas/geoaudit/src/components/**`) sobre el codebase real. Los estilos se copian **verbatim** (hex directos `bg-[#0f172a]`, `text-[#475569]`, composiciones, fondos contrastados); lo único que se refactoriza es el **binding de datos**: el mock `generateDynamicAudit` se reemplaza por un **presenter puro** `toGeminiViewModel(AuditResult)` en `src/report/presenters/`. Todo componente de reporte/landing/dashboard se vuelve **presentador puro** de ese view model. El negocio (`src/audit/`, `src/scoring/`, `src/lib/audit/`, billing, auth, PDF) queda intacto.

## Architecture Decisions

| Opción | Tradeoff | Decisión |
|---|---|---|
| Tokens `@theme` (Sprint 6) | Clean pero desincronizado del look Gemini | **Hex directos** (DNF-9); `@theme` se reduce a `--font-*` |
| Copiar `types.ts` de Gemini | Fields sin fuente real (`citationRate`, `impactScore`, `lastCrawled`) | **View model propio honesto** en `presenters/types.ts`, Gemini-shaped pero nullable |
| Bandas Gemini 80/65/45/25 | Fiel visualmente | **Real `severityForScore` 90/75/60/40** (D1); la fidelidad es de composición, no de umbrales |
| SeverityBadge Gemini lowercase | Real contract es Capitalized | **Badge verbatim (lowercase)**; el adapter normaliza `.toLowerCase()` |
| Toggle anual pricing | Gemini lo tiene | **Solo mensual** (PRC-5, D2) |

## Adapter (src/report/presenters/)

```
src/report/presenters/
  types.ts            # GeminiBand, CategoryScore, Finding, PlatformRow, GeminiView
  toGeminiViewModel.ts# única función pura: AuditResult → GeminiView
  findings.ts         # deriveFindings(citability, schema, crawlers) → Finding[]
  platforms.ts        # buildPlatformRows → re-export del mapeo 6 filas (Claude null)
  __tests__/
```

**View model (campos exactos):**

```ts
type GeminiBand = "excellent" | "good" | "fair" | "poor" | "critical";
interface GeminiView {
  totalScore: number; band: GeminiBand; domain: string; title: string;
  summary: string; durationSeconds: number; auditDate: string | null;
  categoryScores: CategoryScore[]; findings: Finding[];
  platforms: PlatformRow[]; shareToken: string | null;
}
interface CategoryScore { id; name; score; maxScore:100; weight:string; status:GeminiBand; keyMetric:string|null; description:string; }
interface Finding { id; title; severity:GeminiBand; category:"Crawlers"|"Citabilidad"|"Datos estructurados"; description:string; impactScore:null; codeSnippet?:string; codeLanguage?:"json"; recommendation:string; }
interface PlatformRow { id; name; bot; readiness:number|null; access:"allowed"|"blocked"|"unknown"; }
```

**Mapeos** (todo en `toGeminiViewModel`, reusa `rowScore`/`DOMAIN_ROWS` de `domain-metrics.ts` y `severityForScore` de `scoring/calculator.ts`):

- `totalScore = Math.round(summary.geoScore)` · `band = severityForScore(geoScore).toLowerCase()` (real, no `getBandFromScore`).
- `domain = hostname(summary.url)` · `title = domain` (no hay título real → fallback, APT-3).
- `summary = "dominio.com — GEO Score 68 (regular) en ~5s"` (solo métricas reales: score, band, domain, duración).
- `durationSeconds = max(1, Math.round(durationMs/1000))` · `auditDate = null` (persisted `createdAt` lo aporta el caller).
- `categoryScores[5]` = `DOMAIN_ROWS` (Acceso de bots/Citabilidad/E-E-A-T/Datos estructurados/Plataforma) vía `rowScore(result, engine)`; `weight` de `SPRINT_1_WEIGHTS` mapeado (crawler→technical 18.75, citability 31.25, eeat 25, schema 12.5, platform 12.5); `status = severityForScore(score).toLowerCase()`; `keyMetric = null` (honestidad).
- `findings[]` = `deriveFindings`: bots bloqueados de `crawlers.perBot`, `schema.issues`, `citability.bottom3` (a mejorar) / `top3` (positivo). `impactScore: null` siempre; `codeSnippet` solo de `schema.generated` (JSON.stringify) — nunca inventado.
- `platforms[6]` = 6 filas (ChatGPT/Claude/Perplexity/Gemini/Google AI Overviews/Bing Copilot): `readiness` de `perPlatform` (5 ids: aio/chatgpt/perplexity/gemini/copilot); **Claude `platformKey:null` → `readiness:null`**; `access` de `perBot` (Claude→`Claude-Web`). Sin `citationRate`/`presenceInPrompts`/`lastCrawled`.
- `shareToken` = passthrough (null si ausente).

## RSC / Client Split

| Server (presentadores puros) | Client islands (`"use client"`) |
|---|---|
| Button, Card, TextField, SeverityBadge, ScoreBar, Skeleton+AuditReportSkeleton, Logo, Navbar, Footer | AuditForm (hero + runner bar), StageStepper (timer), ShareModal, CheckoutButton, AuditHistoryTable (filtro), copy buttons, MultiPageForm, LogoutButton, GitHubAuthCard |
| ScoreHero, DomainScorecard, PlatformMatrix, TopFindings, ReportMeta, AuditReport, MultiPageReport, AggregateHero, ScoreTrend, PricingCards | — |

**Flujo**: server page (RSC) → `toGeminiViewModel(result)` → presenter puro → islas interactivas reciben props serializables (view model + Server Actions inyectadas por la página). Se eliminan `useState`/`setTimeout`/`window` de simulación de los páginas Gemini (DashboardPage, LandingPage, LiveReportPage): la simulación de progreso la hereda `StageStepper` (timer real ya existente) y `Suspense`/actions reales cubren loading/error.

## Primitivas (firmas verbatim de Gemini)

- **Button**: `variant?: "primary"|"secondary"|"ghost"|"emerald"|"danger"` · `size?: "sm"|"md"|"lg"` · `isLoading?` (→ `Loader2` spin + disabled + `aria-busy`) · `leftIcon?`/`rightIcon?`. (Se renombra `loading`→`isLoading` del botón actual al de Gemini.)
- **Card**: `variant?: "default"|"muted"|"highlight"` · `noPadding?` (Gemini NO tiene header/footer slots → se eliminan).
- **TextField**: `label` · `error?` · `helperText?` · `leftIcon?` · `rightElement?` · `hideLabelVisually?` (label uppercase `tracking-wider`; `useId`; slot error `min-h-[18px]`).
- **SeverityBadge**: `band: GeminiBand` · `labelOverride?` · `size?` · `showDot?` · `score?`. **Conflicto**: Gemini lowercase `band`; el adapter entrega lowercase → badge verbatim no cambia. El `score`/`dot`/`size` se añaden.
- **ScoreBar**: `category: CategoryScore` · `onClick?` · `isInteractive?`. El `getBarColor` numérico (80/65/45/25) se reemplaza por **color derivado de `category.status`** (band real) — mismo visual, umbrales reales.
- **Skeleton**: `variant? "rectangular"|"circular"|"text"` · `width?/height?` · `label?` + **`AuditReportSkeleton`** (ScoreHero/Scorecard/Findings placeholders).

## Logo + Favicon

`src/ui/logo.tsx` — `<Logo />` SVG inline: mark "G" serif (Instrument Serif) + onda emerald + globo, + wordmark "GeoAudit". Props `size?`. Usado en Navbar, Login, Signup, share header. Favicon: `app/icon.svg` (Next metadata) reemplaza `app/favicon.ico`. `globals.css`: añadir alias `--font-serif: var(--font-instrument-serif)` (DNF-10) y keyframes `pulse` + `prefers-reduced-motion` (DNF-11).

## Páginas

| Ruta | Composición Gemini (adaptada a datos reales) |
|---|---|
| `/` landing | Hero badge "GEO Engine" + H1 + input con botón **dentro** + sample URLs (isla `AuditForm`), cards 01-05 (03 navy + número emerald), ScoreHero demo + tabla de bandas **reales 90/75/60/40**, 6 plataformas, CTA pricing |
| `/login` `/signup` | Card centrada, beneficios en signup, "Continuar con GitHub" (ATH-8), link "Inicie sesión" (GitHubAuthCard restyled) |
| `/pricing` | Cards Free/Pro/Enterprise, **Pro destacada** (borde emerald + "Recomendado" + `-translate-y-2`), solo mensual (sin toggle), FAQ facturación; checkoutAction/portalAction intactos |
| `/dashboard` | Runner bar (input + "Run Audit" + user chip), grid 12-col (Aggregate `col-4` + Trend `col-8`, 12 barras CSS), tabla con header bar + chip "Multi-Page" + refresh + fila "SCANNING..." |
| `/dashboard/profile` | nombre/email/tier/uso `4/10`/portal (PRO) o CTA upgrade/upgrade/soporte — `User`+`Subscription` reales |
| `/dashboard/audits/[id]` | ScoreHero completo + benchmark real, scorecard 5, matriz 6 col (Claude "No medido"), findings con código real, ShareModal (acciones reales), Export PDF gated PRO |
| `/share/[token]` | Pill "Verificado" + token ID + reporte + footer CTA "Ejecuta tu propia auditoría" |
| `/report` live | Stepper animado (spinner + progress bar + círculos numerados) sobre `StageStepper` real + `AuditReportSkeleton` |
| multi-page | form `useActionState` + `multiPageAuditAction` (PRO gate) + página selector de rutas + inspector (datos reales `citability.pageScore`/`durationMs`, omitir `schemaFound`/`crawlTimeMs`/`status`) |
| `/terms` `/privacy` | RSC estáticos, shell compartido, copy neutro |

## Copy neutro (`src/lib/copy.ts`)

Un solo módulo exporta `const COPY = { ... }` tipado. Migran voseo→neutro: `AUDIT_FORM_ERRORS` ("Esperá"→"Espere", "Alcanzaste"→"Alcanzó"), `FETCH_ERROR_COPY` ("Verificá"→"Verifique", "Probá"→"Pruebe"), share-modal `ERROR_COPY` ("Necesitás"→"Necesita", "Mejorá"→"Mejore"), `AUTH_COPY` ("Iniciá sesión"→"Inicie sesión", "Creá tu cuenta"→"Cree su cuenta"), landing ("obtené"→"obtenga", "Comenzá"→"Comience", "Ingresá"→"Ingrese", "Mejorá"→"Mejore"). Los módulos `url-policy`/`fetch-error-copy`/`share-modal`/`github-auth-card` importan de `copy.ts` (source-of-truth compartida con tests). Nuevo copy neutro para findings, share, profile, términos/privacidad.

## Slicing U1–U6 (chained PRs, ~3.100–3.850 L)

| U | Archivos | Dep. |
|---|---|---|
| U1 primitivas+logo+shell | `ui/{button,card,text-field,severity-badge,score-bar,skeleton,logo,navbar,footer}.tsx`, `app/icon.svg`, `globals.css` | — |
| U2 landing+auth+copy | `app/page.tsx`, `app/login`, `app/signup`, `lib/copy.ts`, `github-auth-card` | U1 |
| U3 pricing+FAQ | `billing/pricing-cards.tsx`, `app/pricing/page.tsx` | U1, U2 |
| U4 dashboard+perfil+términos | `app/dashboard/page.tsx`, `dashboard/*`, `app/dashboard/profile`, `app/terms`, `app/privacy` | U1–U3 |
| U5 report/detail/share/live+adapter | `report/presenters/*`, `report/{score-hero,domain-scorecard,platform-matrix,top-findings,report-meta,audit-report,multi-page-report}.tsx`, `app/dashboard/audits/[id]`, `app/share/[token]`, `dashboard/share-modal`, `app/report` | U1–U4 |
| U6 multi-page UI | `app/multipage/*`, `report/multi-page-form`, navbar link | U5 |

Orden secuencial (cada U = un PR atómico revertible; U5 es el corazón y depende del adapter).

## Testing Strategy (Strict TDD, negocio intacto)

| Capa | Qué | Cómo |
|---|---|---|
| Adapter puro | `toGeminiViewModel` (APT-1..10): band lowercase, fallback title, duración, categoryScores[5]=rowScore, findings sin impactScore, platforms[6] con Claude null, shareToken passthrough | Vitest, fixtures `AuditResult` |
| Presentadores | ScoreHero benchmark real, ScoreBar color por band, matriz Claude "No medido", findings sin snippet inventado | RTL, view model directo |
| Copy neutro | `copy.ts` sin voseo, `url-policy`/`fetch-error-copy`/`share-modal` importan central | Vitest string asserts |
| RSC con session | Navbar/dashboard/profile/detail render con `session` prop inyectada | RTL (session como prop) |
| UI existente | **~30–40 archivos de test** que aseveran clases token (`bg-navy`/`bg-surface`) y copy voseo → reescribir asserts a hex + neutro; tests de comportamiento intactos | Vitest/RTL |
| Gates | `pnpm test` (774→verde), `lint`, `typecheck`, `build` | CI |

## Threat Matrix

N/A — sin routing nuevo, shell, subprocess, VCS/PR automation, ni clasificación de ejecutables; el flujo es presentacional sobre Server Actions existentes (`auditAction`, `multiPageAuditAction`, `create/revokeShareToken`, `checkoutAction`/`portalAction`), que conservan sus gates (rate-limit, zod, auth, `requirePaidTier`, tier limit) intactos.

## Migration / Rollout

No migration. Cada U es un PR squash-merge a `develop` reversible; el negocio no se toca, así que revertir UI no afecta engine/billing/auth. Actualizar `STYLE-BRIEF.md` en el mismo change para reflejar hex directos (risk #6).

## Open Questions

- [ ] Ninguna bloqueante: D1/D2/D3 ya resueltas en el proposal (bandas reales, solo mensual, multi-page con datos reales).
