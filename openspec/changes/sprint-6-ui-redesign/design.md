# Design: Sprint 6 — UI Redesign (Port del diseño Gemini)

## Technical Approach

Port de presentación sobre datos reales. La capa de negocio (contracts/auth/prisma/billing/share/engine/middleware/PDF) queda intacta. El Gemini design (`/home/ezeyf/Descargas/geoaudit/`) es solo referencia visual: se traducen composiciones y primitivas, nunca su shape de datos (`CategoryScore`, `platforms` mock, `SEVERITY_BANDS`). Las vistas leen `AuditResult`; los score bars derivan de `domain-metrics.ts` (`rowScore`) — misma fuente que el PDF.

RSC-first: todo lo que no necesita estado es Server Component. Son clientes solo `AuditForm`, `GitHubAuthCard`, `CheckoutButton`, `ShareLinkPanel`/`ShareModal`, el `StageStepper` (timer) y la búsqueda del dashboard (`useState`). Animación funcional mínima: skeleton pulse + hover 150ms; se descartan `animate-in`/motion.

## Architecture Decisions

| Decision | Choice | Rationale (vs alternativas) |
|---|---|---|
| ScoreBar fuente | `severityForScore(score)` (compartido) + `width: score%` | Rechazado: Gemini `getBarColor` (umbrales 80/65/45/25 duplicados). El contrato P3 es la única verdad. |
| Matriz 6 plataformas | Fila = `perPlatform.platforms[id].score` + `crawlers.perBot[bot]`; Claude sin `perPlatform` → "No medido" | Rechazado: mock `platforms` de Gemini. `perPlatform` tiene 5 ids (aio/chatgpt/perplexity/gemini/copilot); Claude solo existe en `perBot` (`Claude-Web`). Mapeo explícito en `platform-matrix.ts`. |
| Stepper de stages | Cliente, time-based sobre la ventana 10–60s; reemplazado por el reporte al resolver Suspense | Rechazado: emitir eventos por engine (tocaría `runAudit`, fuera de scope). El engine retorna atómico: no hay progreso por stage. El stepper es pacing visual, nunca afirma estado de engine. |
| Navbar auth | Server Component (`auth()` en layout) + `LogoutButton` cliente (`signOut`) | Rechazado: navbar cliente con session via prop → hidratación redundante. |
| Share | `ShareModal` (dialog) reutiliza la lógica de acciones de `ShareLinkPanel` | Rechazado: duplicar create/revoke. Se extrae el form al modal; las Server Actions se inyectan igual. |
| Pricing | Restyle solo; el catálogo ya es mensual sin toggle (PRC-5 ya se cumple) | Rechazado: agregar toggle anual (fuera de scope, feature inventada). |

## Data Flow

```
AuditForm(auditAction) ─redirect→ /report?url ─Suspense─→ AuditRunner.runAudit(url)
   AuditRunner ─persiste Audit (best-effort)─→ <AuditReport result={AuditResult}>
   AuditReport = ScoreHero + DomainScorecard(ScoreBar×5) + PlatformMatrix + TopFindings + ReportMeta
```

Live run (ARU-10) — stepper solo mientras `runAudit` está pending:

```
ReportSkeleton (fallback)
   └─ StageStepper: fetch ▸ crawlers ▸ citability ▸ content ▸ schema ▸ platform
        timer avanza etapa → Suspense resuelve → stepper reemplazado por AuditReport
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modify | + `lucide-react` |
| `src/ui/button.tsx` | Modify | + variantes `emerald`/`danger`, size `lg`, slot `icon` |
| `src/ui/card.tsx` | Modify | + prop `noPadding` (opcional, aditivo) |
| `src/ui/text-field.tsx` | Modify | + `leftIcon`/`helperText` (opcional, aditivo) |
| `src/ui/score-bar.tsx` | Create | Nuevo primitivo 0-100 |
| `src/ui/navbar.tsx` / `footer.tsx` | Create | Shell global |
| `src/app/layout.tsx` | Modify | Envuelve children en Navbar+Footer |
| `src/app/page.tsx` | Replace | Landing completa (hero+form real, 5 dominios, bandas, 6 plataformas, teaser) |
| `src/app/{login,signup}/page.tsx` | Modify | Shell restyle (mantiene GitHubAuthCard) |
| `src/report/domain-scorecard.tsx` | Modify | Usa `ScoreBar` (borra mini-bar inline) |
| `src/report/platform-matrix.tsx` | Create | Matriz 6 plataformas (perPlatform+perBot) |
| `src/report/audit-report.tsx` | Modify | Compone `PlatformMatrix` |
| `src/report/stage-stepper.tsx` | Create | Cliente, timer-driven |
| `src/app/report/report-skeleton.tsx` | Modify | + `StageStepper` |
| `src/dashboard/page.tsx` | Modify | + hero agregado + búsqueda |
| `src/dashboard/audit-history-table.tsx` | Modify | Restyle + filtro cliente (búsqueda) |
| `src/dashboard/score-trend.tsx` | Modify | Restyle pure-CSS |
| `src/dashboard/share-modal.tsx` | Create | Modal (reusa lógica de ShareLinkPanel) |
| `src/app/dashboard/audits/[id]/page.tsx` | Modify | Botón "Compartir" abre modal |
| `src/billing/pricing-cards.tsx` | Modify | Restyle (mensual, sin toggle) |
| `src/report/multi-page-report.tsx` | Modify | Filas con `ScoreBar`+`SeverityBadge` |

## Interfaces / Contracts

```ts
// src/ui/score-bar.tsx — primitivo nuevo (DNF-9)
type ScoreBarProps = { score: number; label?: string; className?: string };
// role="progressbar" aria-valuenow={score} aria-valuemin=0 aria-valuemax=100
// fill = severityForScore(score); width = `${score}%`

// src/report/platform-matrix.tsx — derivación pura (ADP-6)
const PLATFORM_ROWS = [
  { name:"ChatGPT", bot:"GPTBot", platformKey:"chatgpt" },
  { name:"Claude", bot:"Claude-Web", platformKey:null }, // sin score → "No medido"
  { name:"Perplexity", bot:"PerplexityBot", platformKey:"perplexity" },
  { name:"Gemini", bot:"Google-Extended", platformKey:"gemini" },
  { name:"Google AI Overviews", bot:"Googlebot", platformKey:"aio" },
  { name:"Bing Copilot", bot:"Bingbot", platformKey:"copilot" },
] as const;
// readiness = perPlatform[platformKey]?.score; access = perBot[bot]

// src/report/stage-stepper.tsx — cliente
type StageStepperProps = { stages: readonly { id: string; label: string; estimateMs: number }[] };
```

## Work Units (U1→U4, chained)

| WU | Archivos | Forecast | Depende de |
|----|----------|----------|------------|
| U1 primitivas | `package.json`, `ui/button|card|text-field`, `ui/score-bar|navbar|footer` | ~300 L | — |
| U2 landing/auth | `layout.tsx`, `page.tsx`, `login|signup/page.tsx` | ~350 L | U1 |
| U3 report/dash/share | `report/*`, `report-skeleton`, `dashboard/*`, `share-modal`, detail `page.tsx` | ~400 L | U1 |
| U4 pricing/multipage | `billing/pricing-cards`, `pricing/page.tsx`, `multi-page-report` | ~300 L | U1 |

Total ~1350 L → **Chained PRs recommended: Yes** (Feature Branch Chain: U1 → feature/tracker; U2→U1, U3→U1, U4→U3). Cada slice es atómico, verificable (lint+typecheck+test) y revertible.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit (primitivas) | ScoreBar width/color/aria; Button nuevas variantes; Navbar anónimo/auth; StageStepper avance | RTL + Vitest; fixtures de `variants.ts` |
| Unit (derivación) | `platform-matrix` mapeo 6 filas (incl. Claude "No medido") | puro, sin React |
| Integration (vistas) | DomainScorecard usa ScoreBar; AuditReport incluye Matrix; MultiPageReport con ScoreBar | RTL sobre `AuditResult` fixture real |
| Regression | 710 tests: actualizar los rotos por restyle (button/card/text-field/domain-scorecard/audit-report/report-skeleton/multi-page/pricing-cards) | `pnpm test` verde antes de merge |

Strict TDD: RED primero para ScoreBar/Navbar/StageStepper/PlatformMatrix; los tests de componentes existentes que asumen markup viejo se actualizan en el mismo work unit (no se dejan rojos).

## Threat Matrix

N/A — sin routing nuevo, shell, subprocess, automatización VCS/PR, clasificación de ejecutables ni integración de procesos. Los únicos límites (Server Actions de share/checkout) quedan intactos.

## Migration / Rollout

No migration required. Cada work unit U1→U4 es un PR atómico y revertible; contratos/engine/PDF intactos.

## Open Questions

- [ ] ¿El stepper time-based requiere slots por stage calibrados contra el runtime real (fetch vs platform dominan el tiempo)? Propuesta: fetch 0–8s, crawlers 8–16, citability 16–24, content 24–32, schema 32–40, platform 40–60.
- [ ] ¿La búsqueda del dashboard filtra en cliente con el estado dentro de `audit-history-table.tsx` (lo vuelve client) o vía un wrapper `DashboardSearch` que mantiene la tabla server? Propuesta: wrapper cliente alrededor de la tabla.
