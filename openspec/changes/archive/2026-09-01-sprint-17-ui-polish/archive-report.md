# Archive Report: Sprint 17 — UI Polish

- **Change**: `2026-09-01-sprint-17-ui-polish`
- **Archived**: 2026-09-04
- **Project**: Relevy (repo local `geo-saas`, GitHub `relevy`)
- **Mode**: hybrid (OpenSpec + Engram)

## Status at Close

- **Verdict**: PASS
- **Completeness**: 4/4 requirements · 24/24 scenarios compliant (delta specs: PDF-4 MODIFIED, SHL-10 MODIFIED, LND-9 MODIFIED, LND-18 ADDED)
- **Tasks**: 5/5 complete (T1–T5). T3/T4 were already `[x]` in the persisted `tasks.md`; T1, T2, and T5 were reconciled to `[x]` at archive time — see the Reconciliation note below (intentional-with-warnings archive).
- **Tests**: `pnpm test` → 1084 passed / 0 failed / 4 skipped (119 files: 118 passed, 1 skipped); `pnpm run lint` → exit 0; `pnpm run typecheck` (tsc --noEmit) → exit 0. Coverage: not collected (no coverage script in this change).
- **Milestone**: develop = `ad116c1` = merge of PR #78 (JSON-LD) on top of PR #73 (PDF) and PR #77 (drawer + landing fondos). Pushed to origin.
- **Review gate**: no receipt-driven review artifacts exist for this candidate (no `reviewGate` in structured status; no review artifacts in the change folder) — archived under ordinary repository policy.

## Scope Delivered

1. **PDF arch resolver (PDF-4)**: `CHROMIUM_PACK_URL` (bare pack URL, HTTP 404 → prod 500 `{"error":"render_failed"}`) replaced by exported `resolveChromiumPackUrl(arch = process.arch)` in `src/pdf/render.ts` — `x64` → `chromium-v149.0.0-pack.x64.tar`, `arm64` → `...-pack.arm64.tar`, unknown arch → typed `PdfRenderError`. Both branches + the error path pinned in `render.test.ts` (3 tests). Vercel runs x86_64 today; the `process.arch` derivation is arm64-proof. No existing test broke (`deps.launch` injection and route mock untouched).
2. **Mobile drawer island (SHL-10)**: `MobileMenu` client island rendered from the Navbar's RIGHT container (`md:hidden` toggle); drawer + overlay portaled to `document.body` via `createPortal`, escaping the header's `backdrop-blur-md` containing block that clipped the previous in-header panel. New a11y contract: close on Escape / overlay click / toggle, focus moves into the drawer on open and returns to the toggle on close, closed drawer is `aria-hidden` + `inert`. `NavLinks` is desktop-only; shared links live in `src/ui/nav-config.ts`. 5 mobile tests migrated to `mobile-menu.test.tsx` (portal-safe `screen`/`document.body` queries) + 4 new a11y tests; the 8 `navbar.test.tsx` tests intact.
3. **Landing rhythm (LND-18)**: interleaved gray/white section backgrounds breaking the four-gray run S5→S5b→S6→S7: S4 gray + white `rounded-2xl` recuadro (the 6 platform cards keep `bg-[#f8fafc] rounded-xl`), S5 `border-y bg-white` band, S5b gray + white recuadro, S5c absorbed into S6 via `border-t` (single continuous white band, no white-white seam), S6 `border-b bg-white`, S7 gray with its existing CTA recuadro. Gray-surface eyebrows bumped `#64748b` → `#475569` (AA 4.5:1 on `#f8fafc`); white-band eyebrows keep `#64748b`. Table wrapper stays `overflow-x-auto` + `min-w-[640px]`, recuadro OUTSIDE the wrapper. `extractMainContent` is class-agnostic → zero citability collateral.
4. **JSON-LD org attrs (LND-9)**: `ORG_AREA_SERVED="AR"` (matches `BRAND_ADDRESS`), `ORG_INDUSTRY="Software"`, `ORG_EMPLOYEES=1` in `src/lib/brand.ts`, rendered from the `OrganizationJsonLd` node; `award` deliberately OMITTED — no real award exists, inventing one would violate LND-7. Accepted tradeoff: the schema engine keeps reporting `missing_recommended` for `award` (count drops 4 → 1).

Zero engine/scoring changes, no monetization, no source modifications outside the four scoped areas in this phase.

## Delivery Notes

- **Original chain broken**: the planned 4-PR feature-branch chain (PR 1 PDF → PR 2 Mobile → PR 3 Landing → PR 4 JSON-LD) broke mid-flight — the `--delete-branch` cleanup deleted base branches, invalidating the chain bases. Recovered by combining the mobile drawer + landing fondos work into **PR #77** (`Sprint 17: Mobile drawer + Landing backgrounds`, `b4ea788`), which re-based the remaining work. Final delivery: **PR #73** (`ffcae73`, PDF), **PR #77** (`b4ea788`, drawer + landing), **PR #78** (`ad116c1`, JSON-LD) — all merged to `develop`.
- **Branches deleted**: all sprint branches removed after merge, including the residual tracker and pr2 branches (per the git workflow rule: never squash+delete in a chain — D8).
- **TDD evidence gap**: no `apply-progress.md` was ever written (the prior verify was interrupted), so the TDD-cycle evidence was reconstructed from `tasks.md` commit notes + independent source/test inspection by verify. T1/T2 checkbox markers never landed at apply time even though the code shipped green — reconciled at archive (below).

## Archive-time Reconciliation (intentional-with-warnings)

Per the Task Completion Gate, `sdd-apply` owns checkbox completion; `sdd-archive` performs checkbox reconciliation only as an exceptional repair with explicit orchestrator instruction and proof. The orchestrator explicitly instructed reconciliation for T1/T2 (code merged and green, markers stale); T5 (verification gate) is proven complete by the verify-report's own independent execution. Evidence: verify-report PASS (4/4 requirements, 24/24 scenarios, `pnpm test` 1084 passed / 0 failed, lint + typecheck exit 0) + commit presence on `develop` (`ffcae73`, `b4ea788`, `b24e3d9`, `f8dc577`). The exact reason is recorded in `tasks.md` (section "Archive-time reconciliation (sdd-archive, 2026-09-04)") and this report.

## Verification Warnings (carried to close, non-blocking)

- **W-1 (per verify-report, at verification time)**: `apply-progress.md` absent from the change directory — prior verify interrupted before writing output; TDD-cycle evidence reconstructed (tasks.md commit notes + independent re-execution). No functional impact; recommendation for the pipeline: persist `apply-progress.md` in future changes so Strict-TDD verify reads the canonical TDD-cycle table.
- **W-2 (per verify-report, at verification time)**: T1/T2 unchecked in tasks.md despite merged green code — resolved at archive by the reconciliation above; final state at close: 5/5 complete.

## Final-State Facts (from orchestrator, outrank intermediate snapshots)

- Delivery: PRs #73 (`ffcae73`), #77 (`b4ea788`), #78 (`ad116c1`) merged to `develop`; `develop` = `ad116c1`, pushed.
- Post-merge state: `.atl/*` caches and `docs/RELEVY-BRAND-BRIEF.md` are PRE-EXISTING unrelated files — excluded from the archive commit. `verify-report.md` was untracked and belongs to this change — included in the archive commit.
- No merge to `main` (the user merges on milestone; D8: integrate by the tip, milestone via release branch).
- Roadmap: Sprint 17 (UI polish) complete; the close-free work (Sentry + brand presence + announce) moves to **sprint-18-close-free**; the no-Stripe reality is preserved (D4).

## Spec Sync (delta → canonical)

| Domain | Action | Details |
|--------|--------|---------|
| app-shell | Updated | SHL-10 MODIFIED (portaled right-side drawer: toggle right `md:hidden`, `createPortal` to `document.body`, Escape/overlay-close/focus-return, `aria-hidden`+`inert` closed, `NavLinks` desktop-only — 9 scenarios) |
| landing-page | Updated | LND-9 MODIFIED (`areaServed` "AR" / `industry` "Software" / `numberOfEmployees` 1 from brand constants, `award` omitted — 6 scenarios), LND-18 ADDED (interleaved gray/white backgrounds, exactly 6 `rounded-xl` cards, `overflow-x-auto` wrapper — 5 scenarios) |
| pdf-export | Updated | PDF-4 MODIFIED (arch-derived pack resolver `resolveChromiumPackUrl(arch = process.arch)`, typed error on unsupported arch — 4 scenarios) |

No REMOVED or RENAMED requirements in this change; merge was additive/updating only — no destructive delta, no `(Reason:)`/`(Migration:)` handling needed. Requirements not mentioned in the deltas preserved unchanged (SHL-1..SHL-9/SHL-11, LND-1..LND-8/LND-10..LND-17, PDF-1..PDF-3/PDF-5..PDF-10).

## Mechanical Copy Evidence

Archival move performed with native shell (`git mv` rejected the untracked source dir → `mv` fallback); pre-move recursive snapshot compared against the archived folder:

```text
$ diff -r <snapshot>/source openspec/changes/archive/2026-09-01-sprint-17-ui-polish
(no output — byte-identical, exit 0)
```

`archive-report.md` is additive-only (did not exist in the source snapshot) and excluded from the comparison. Diff status 0 is the only passing evidence.

## Engram Traceability

Hybrid persistence: archive report saved to Engram as `sdd/sprint-17-ui-polish/archive-report` (project `geoaudit`, type architecture, capture_prompt false). Artifacts were read from the OpenSpec filesystem (`openspec/changes/2026-09-01-sprint-17-ui-polish/` + canonical `openspec/specs/`); no Engram observation reads were required for this phase.

## Roadmap

`docs/SPRINT-ROADMAP.md` updated: Sprint 17 (UI Polish) marked complete (develop = `ad116c1` = PRs #73/#77/#78, 1084 tests, PASS 4/4 · 24/24); next is **Sprint 18 (Close Free)** — Sentry (monitoreo) + brand presence final + announce/marketing + dominio final + remote local → `relevy.git` (cosmético); the "no Stripe" reality preserved (D4: monetization reintroduced only after validation).