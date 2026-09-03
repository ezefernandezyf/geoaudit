# Design: Sprint 15 — Polish Final

## Technical Approach

Four UI fixes (bar direction, score clip, hamburger, table scroll), copy sync to v3.1.0, PDF discoverability via best-effort id threading, three tech debts. No engine/monetization changes. Most items are single-file edits; the only cross-file flows are the PDF id threading (AuditRunner → AuditReport) and the co-updates (`copy.test.ts`, `run-audit-edge-cases.test.ts`).

## Architecture Decisions

| # | Decision | Options | Choice | Rationale |
|---|---|---|---|---|
| D1 | Thread persisted id to report | (a) prop on AuditReport; (b) extend `ViewModelContext` | **(b)** | `AuditReport` already accepts `ctx?: ViewModelContext` (dashboard detail passes `{auditDate, shareToken}`). Adding `exportPdfHref`/`exportAnonCta` keeps the signature unchanged for existing callers (landing uses `ScoreHero` directly, not `AuditReport`). Dashboard detail passes no new fields → its existing page-header button remains the sole export entry there (no duplicate). |
| D2 | PDF entry when no id | (a) nothing; (b) disabled button | **(a)** | PDF-10: "MUST NOT render — no dead link." A disabled button implies a recoverable action; best-effort persistence failure has no retry affordance. Render only when `exportPdfHref` present. |
| D3 | Hamburger pattern | (a) state in NavLinks + serializable session props; (b) extract shared AuthActions | **(a)** | NavLinks (client) holds `useState(open)`. Navbar passes serializable `isAuthenticated`, `displayName`, `initials`, `plan`, `showMultiPage`. Panel renders links + actions; Navbar wraps desktop actions in `hidden md:flex` so mobile shows only logo + toggle. Plain `<button>` with lucide Menu/X (no IconButton primitive exists); no Button primitive (icon-only). |
| D4 | Inverted bar | (a) reverse array; (b) rewrite | **(a)** | `BENCHMARK_SEGMENTS` entries already carry per-segment width (critical 30, poor 20, fair 15, good 15, excellent 20 = 100) and class. Reversing yields critical(red)→excellent(green) L→R; marker `left: score%` still maps 0=critical-left, 100=excellent-right. Verified: 85→85%→green; 15→15%→red. |
| D5 | Score box | (a) flex-col stack `/100` under number; (b) conditional font-size; (c) min-w expand | **(a)** | Deterministic at any digit count; preserves `text-6xl/7xl` Gemini hierarchy; spec allows stacking. (b) shrinks hero (overengineering, breakpoint logic); (c) fragile (72px serif "100" + mono `/100` can still overflow). Keep `/100` hex `#047857`. |
| D6 | Degraded version | mutate `index.ts:226` + co-update test | **do it** | Union already accepts `3.1.0` (audit-result.ts:120-123). `toGeminiViewModel` never reads `scoringModelVersion` → no presenter branch. `run-audit.test.ts:150` already asserts `3.1.0`. Only `run-audit-edge-cases.test.ts:89-91` pins `2.0.0`. |
| D7 | Hero names-only | names-only highlight, keep ≥50 words | **exact string below** | Lead(17w) + highlight(22w) + tail(15w) = 54w ≥50. Six dimensions by name, no percentages. |

## Data Flow (PDF export)

```
AuditRunner: runAudit → auth() → checkTierLimit → prisma.audit.create
     │  capture persisted.id (best-effort, in try/catch)
     ▼
AuditReport result={result} ctx={{ exportPdfHref: id? `/api/report/${id}/pdf` : null,
                                     exportAnonCta: !userId }}
     ▼
conditional export strip: href → "Exportar PDF" | anon → signup CTA | else → nothing
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/report/score-hero.tsx` | Modify | Reverse `BENCHMARK_SEGMENTS`; stack `/100` under number (`flex-col`), keep `text-6xl/7xl` + `#047857` |
| `src/ui/nav-links.tsx` | Modify | `useState(open)`, hamburger button (`aria-expanded`/`aria-controls`), panel with links + session actions, close on navigate |
| `src/ui/navbar.tsx` | Modify | Wrap desktop actions `hidden md:flex`; pass serializable session props to NavLinks |
| `src/report/audit-runner.tsx` | Modify | Capture `persisted.id`; build `ctx.exportPdfHref`/`exportAnonCta` |
| `src/report/presenters/toGeminiViewModel.ts` | Modify | `ViewModelContext` += `exportPdfHref?`, `exportAnonCta?` (pass-through) |
| `src/report/audit-report.tsx` | Modify | Render conditional export strip (new `REPORT_COPY.export` strings) |
| `src/app/page.tsx` | Modify | `overflow-hidden` → `overflow-x-auto` + `min-w-[640px]` on table wrapper |
| `src/lib/copy.ts` | Modify | v3.1 weights (24/23/15/12/14/12), brand "12 %"/"octava parte", names-only subtitle |
| `src/audit/index.ts` | Modify | `:226` `"2.0.0"` → `"3.1.0"` |
| `eslint.config.mjs` | Modify | ignores += `coverage/**` |
| `src/lib/__tests__/copy.test.ts` | Modify | Co-update weights + names-only subtitle + brand asserts |
| `src/audit/__tests__/run-audit-edge-cases.test.ts` | Modify | `:91` `"2.0.0"` → `"3.1.0"` + comment |
| `src/ui/__tests__/nav-links.test.tsx` | Create | Hamburger: opens panel, actions per session, closes on navigate, desktop unchanged |

## Interfaces / Contracts

```ts
// toGeminiViewModel.ts
export type ViewModelContext = {
  shareToken?: string | null;
  auditDate?: string | null;
  exportPdfHref?: string | null;   // D1: direct /api/report/{id}/pdf when persisted
  exportAnonCta?: boolean;         // D1: anonymous report → signup CTA
};
```

Hero highlight (D7, names-only): `" El GEO Score pondera seis dimensiones que suman el resultado: citabilidad, E-E-A-T, acceso de bots, autoridad de marca, datos estructurados y plataforma."`

## Testing Strategy

| Layer | What | Where |
|-------|------|-------|
| Unit (RTL) | Hamburger open/close, session-conditional actions, desktop unchanged (SHL-10) | `nav-links.test.tsx` (new) |
| Unit (RTL) | Bar order critical→excellent, marker 85→green/15→red; score 100 unclipped (ARU-11/15) | `score-hero.test.tsx` |
| Unit | Copy weights v3.1, names-only subtitle ≥50w, "octava parte" (LND-11/15) | `copy.test.ts` |
| Unit | Degraded path writes `3.1.0` (RAO-16) | `run-audit-edge-cases.test.ts` |
| Unit (RTL) | Export strip: href / anon CTA / none (PDF-10) | `audit-report.test.tsx` |

Co-update risk: `copy.test.ts:289,294-298,308,322-323` (weights/subtitle) and `navbar.test.tsx` (action visibility may assert `md` behavior).

## Threat Matrix

`N/A` — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. (PDF route untouched; hamburger is pure client state.)

## Migration / Rollout

No migration required. Per-item atomic commits; copy+test and version+test travel together.

## Open Questions

None — all D1–D7 resolved with rationale above.
