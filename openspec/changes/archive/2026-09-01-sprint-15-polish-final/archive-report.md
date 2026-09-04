# Archive Report: Sprint 15 — Polish Final

- **Change**: `2026-09-01-sprint-15-polish-final`
- **Archived**: 2026-09-03
- **Project**: Relevy (repo local `geo-saas`, GitHub `relevy`)
- **Mode**: hybrid (OpenSpec + Engram)

## Status at Close

- **Verdict**: PASS WITH WARNINGS
- **Completeness**: 11/11 requirements · 30/30 scenarios compliant (spec deltas ARU-11/ARU-15, SHL-10, LND-11/LND-14/LND-15, PDF-10, RGS-1, RAO-10/RAO-16, R8)
- **Tasks**: 8/8 complete (T1–T8 checked in the persisted `tasks.md` — Task Completion Gate passed)
- **Tests**: `pnpm test` → 1052 passed / 0 failed / 4 skipped (118 files passed, 1 skipped); `pnpm run lint` → exit 0; `pnpm run typecheck` → clean; `pnpm verify:scorehero` → 5/5
- **Milestone**: develop = `f5f14a6` = merge of PR #70 (squash) from `feat/sprint-15-polish-final` (branch deleted). PR approved with maintainer `size:exception` for 726 authored code+test lines (OpenSpec docs ~719 excluded from review count).
- **Review gate**: no receipt-driven review artifacts exist for this candidate (no `reviewGate` in status; kill switch not exercised) — archived under ordinary repository policy.

## Scope Delivered

1. **Report UI (ARU-11/ARU-15)**: benchmark segments reversed to critical→excellent left→right (red `#ef4444` left, green `#10b981` right); marker/widths/colors intact; `/100` stacked under the score number (`flex-col`), `text-6xl/7xl` + `#047857` preserved — 3-digit score no longer clipped on any surface (report, multi-page, landing).
2. **App shell (SHL-10)**: mobile hamburger menu below `md` (client NavLinks island, `useState(open)`, `aria-expanded`/`aria-controls`, close-on-navigate) exposing all nav links + session actions; desktop `md+` unchanged; Navbar stays a synchronous server component with serializable session props.
3. **Landing (LND-11/LND-14/LND-15)**: copy weights synced to v3.1.0 (24/23/15/12/14/12; brand "12 %"/"octava parte"); hero subtitle names-only (no percentages, 55-word passage ≥ 50-word floor); "24 puntos"/"12 criterios" untouched; comparison table `overflow-x-auto` + `min-w-[640px]` with semantic `<table>` preserved.
4. **PDF export (PDF-10)**: live `/report` shows "Exportar PDF" → `/api/report/{id}/pdf` when the audit persisted (best-effort id threading via `ViewModelContext.exportPdfHref`); no dead link when persistence failed; anonymous users get a signup CTA; PDF route untouched (PDF-2/PDF-9 already gate auth + ownership).
5. **Tech debts**: degraded invalid-URL branch now writes `scoringModelVersion: "3.1.0"` (was "2.0.0", `src/audit/index.ts`); ESLint ignores `coverage/**`; RGS-1 benchmark scenario refreshed to the measured corpus (docs-only delta).

## Verification Warnings & Suggestions

- **W-1 (delivery process, resolved at close)**: authored code+tests totaled 726 lines vs. the 400-line review budget. Resolved by the orchestrator's explicit maintainer `size:exception` for the single PR #70 — not a defect. This was the only open decision at verify time.
- **S-1 (non-blocking)**: `nav-links.test.tsx` could assert the toggle's `md:hidden` class to close the loop on the CSS-only hide.
- **S-2 (non-blocking)**: `scripts/scorehero-verify.test.ts` asserts only `entries.length > 0`; the measured corpus numbers (moz 57, relevy 55, avg 42.4) are documented values, not enforced assertions — acceptable for a real-network scenario.
- **S-3 (non-blocking, pre-existing)**: Vitest ESM-in-CommonJS warning under the native config loader; not introduced by this change.

## Final-State Facts (from orchestrator, outrank intermediate snapshots)

- PR #70 merged to `develop` via squash at `f5f14a6`, branch `feat/sprint-15-polish-final` deleted, `develop` pushed.
- `verify-report.md` was created after the last apply commit (untracked); it belongs to this change and is included in the archive commit.
- `.atl/*` caches and `docs/RELEVY-BRAND-BRIEF.md` are pre-existing unrelated files — excluded from the archive commit.
- No merge to `main` (develop is the integration branch; the user merges to main on milestone).

## Spec Sync (delta → canonical)

| Domain | Action | Details |
|--------|--------|---------|
| project-setup | Updated | R8 ADDED (lint ignores `coverage/**`) |
| pdf-export | Updated | PDF-10 ADDED (live report export entry, 3 scenarios) |
| audit-orchestrator | Updated | RAO-10 MODIFIED (scenario asserts "3.1.0"), RAO-16 MODIFIED (union 2.0.0\|3.0.0\|3.1.0, degraded branch writes 3.1.0, 3 scenarios) |
| landing-page | Updated | LND-11 MODIFIED (names-only subtitle), LND-14 MODIFIED (responsive table), LND-15 ADDED (v3.1.0 weight copy, 4 scenarios) |
| app-shell | Updated | SHL-10 ADDED (mobile nav menu, 4 scenarios) |
| geo-score-calculator | Updated | RGS-1 MODIFIED (benchmark scenario refreshed: moz 57, relevy 55, avg 42.4, 14 URLs, Anthropic eTLD+1) |
| audit-report-ui | Updated | ARU-11 MODIFIED (segments critical→excellent), ARU-15 ADDED (unclipped 3-digit score, 2 scenarios) |

Sprint-14 archive untouched (RGS-1 refresh lives in this change's delta per OpenSpec immutability convention — the delta text records that the sprint-14 archive stays immutable).

## Mechanical Copy Evidence

Archival move performed with native shell `git mv`; pre-move recursive snapshot compared against the archived folder:

```text
$ diff -r <snapshot>/source openspec/changes/archive/2026-09-01-sprint-15-polish-final
(no output — byte-identical, exit 0)
```

`archive-report.md` is additive-only (did not exist in the source snapshot) and excluded from the comparison. Diff status 0 is the only passing evidence.

## Engram Traceability

Hybrid persistence: archive report saved to Engram as `sdd/sprint-15-polish-final/archive-report` (project `geoaudit`, type architecture, capture_prompt false). Artifacts were read from the OpenSpec filesystem (`openspec/changes/2026-09-01-sprint-15-polish-final/` + canonical `openspec/specs/`); no Engram observation reads were required for this phase.

## Roadmap

`docs/SPRINT-ROADMAP.md` updated: Sprint 15 (Polish Final) marked complete; Sprint 16 (score up: landing content 55→70+, citability/E-E-A-T/brand presence) and Sprint 17 (close free: Sentry + brand presence + announce) planned; the "no Stripe" reality preserved (D4: monetization reintroduced only after validation).