# Exploration: sprint-15-polish-final

> Phase: `explore` · Change: `2026-09-01-sprint-15-polish-final` · Branch: `develop` (290b191)
> Objective: bugfix + UI polish sprint (product scope belongs to `propose`). READ-ONLY exploration — no files other than this one were touched.

## 1. Benchmark bar invertida (score-hero)

**File**: `src/report/score-hero.tsx`

- `BENCHMARK_SEGMENTS` (lines 54-60), left→right: `excellent 20% (bg-[#10b981])` → `good 15% (bg-[#10b981]/80)` → `fair 15% (bg-[#f59e0b])` → `poor 20% (bg-[#f59e0b]/90)` → `critical 30% (bg-[#ef4444])`. **Green sits at the LEFT, red at the RIGHT.**
- Marker: `markerLeft = `${Math.min(100, Math.max(0, totalScore))}%`` (line 78), rendered `style={{ left: markerLeft }}` (line 153) — assumes the scale runs 0 at left → 100 at right.
- **Contradiction confirmed**: the segment order does NOT match the 0-100 scale. A score of 85 (Excellent) puts the marker at `left: 85%` — inside the RED critical segment (70-100% of the bar). The bar visually contradicts the score.
- **Inversion**: reorder `BENCHMARK_SEGMENTS` to `critical 30%` → `poor 20%` → `fair 15%` → `good 15%` → `excellent 20%` (red left, green right). Marker math unchanged; widths/colors unchanged; `BENCHMARK_ROWS` (text threshold list, lines 37-51) is positional-free and stays as-is.
- **Test safety**: `src/report/__tests__/score-hero.test.tsx` asserts only marker `left` styles, threshold row labels and Spanish band labels — never segment order or colors. Inversion breaks nothing.
- **A11y**: segments are plain `<span>`s, marker is `aria-hidden="true"` — no role/name changes needed.
- **Surface**: same component renders in `src/report/audit-report.tsx:44`, `src/report/multi-page-report.tsx:108` (aggregate) and `:225` (selected page), and the landing scorecard (`src/app/page.tsx`). One fix covers all.

## 2. GEO Score nn/100 desborda el recuadro (score-hero)

**File**: `src/report/score-hero.tsx` (same component — no layout difference between single/multi-page/landing usage)

- Score box (line 85): `flex min-w-[130px] flex-col justify-center ... p-5 sm:min-w-[160px]` → inner width 90px mobile / 120px sm.
- Score row (lines 89-96): `flex items-baseline gap-2` with `text-6xl sm:text-7xl` serif number (`text-7xl` = 72px) + `text-xl font-bold font-mono` "/100".
- A 3-digit score at 60-72px Instrument Serif ≈ 90-120px + gap 8px + "/100" ≈ 40px → row ≈ 140-165px, **exceeding the 90-120px inner width**. The flex row cannot wrap, so the box content forces width past `min-w` and the hero wrapper `overflow-hidden` (line 81) clips; the right benchmark column (`min-w-[210px] shrink-0`, line 133) also compresses the left cluster on narrow screens.
- Fixture is 2-digit ("68") so unit tests don't see it; the failure is real at "100".
- Fix candidates (for propose/design): wrap the `/100` under the number, drop to `text-5xl sm:text-6xl`, drop `min-w`, or let the row wrap — keep the `/100` AA contrast hex `#047857` already fixed (PERF-3 note, line 93).

## 3. Navbar sin menú hamburguesa en mobile

**Files**: `src/ui/navbar.tsx` (server shell), `src/ui/nav-links.tsx` (client island), `src/app/layout.tsx` (session/plan resolution), `src/middleware.ts` (auth guard)

- Links: `NavLinks` renders `className="hidden ... md:flex"` (`nav-links.tsx:38`) — **Producto + Multi-página are completely absent below `md`**.
- Actions in the right cluster: anon → `Inicie sesión` + `Cree su cuenta` links (navbar.tsx:99-111, **always visible, no breakpoint**); user → plan pill `hidden sm:inline-flex` (:66), avatar link (name `hidden md:block`, :90), `LogoutButton`.
- **No mobile menu exists anywhere**: grep for `useState.*(open|menu)`, `hamburger`, `MenuIcon`, `Sheet` across `src/` → zero matches. No prior menu pattern to reuse — the proposal designs it from scratch.
- Natural seam: `NavLinks` is already `"use client"` (usePathname) — a hamburger toggle + collapsible panel can live there (or a new client island) without converting the Navbar shell.
- Shell layout: `layout.tsx:69` renders `<Navbar session={session} plan={plan} />`; Navbar stays a sync server component by contract (RTL tests).

## 4. Tabla comparativa ilegible en mobile

**File**: `src/app/page.tsx:580-618` (section 5, LND-14)

- Markup: semantic `<table class="w-full text-left text-sm">` inside wrapper `overflow-hidden rounded-xl border border-[#e2e8f0] bg-white` (:580) — **NOT `overflow-x-auto`**; there is no `min-w` on the table either.
- 3 columns: `["Criterio", "Relevy", "Auditoría manual"]` (`src/lib/copy.ts:228`); cells `px-6 py-3.5`.
- Mobile break: at 360px viewport, `px-6` (48px) × 3 columns leaves ≈ 104px/column; long cells (e.g. `copy.ts:233` "6: ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews y Bing Copilot") squeeze the 3rd column to illegibility, and `overflow-hidden` removes the horizontal-scroll escape.
- Test safety: `src/app/__tests__/page.test.tsx:463` asserts ≥3 real rows render (LND-14) — text-based, survives any responsive restructure.
- Fix candidates: `overflow-x-auto` + `min-w-[640px]` on the table (same pattern as `src/report/platform-matrix.tsx:133`), or a mobile stacked card layout (thead hidden, `td` → label+value), or shorter cell copy. Note the table is a **semantic `<table>` on purpose** (RCI-5/RPL-10 points) — keep `<table>` markup; a `display:block`/grid refactor may lose that intent, prefer `overflow-x-auto` + min-width.

## 5. Hero copy con pesos v3.0 STALE (engine = v3.1.0)

**Engine truth**: `src/scoring/weights.ts:102-111` — `GEO_SCORE_V3_1_WEIGHTS`: citability 24, eeat 23, technical 15, schema 12, platform 14, brand_authority 12 (sum 100). Landing evidence `src/app/score-hero-evidence.ts` is **correct** (brand 12%, asserted in `scripts/scorehero-verify.test.ts:200-216`).

**Stale copy — `src/lib/copy.ts` (all v3.0.0 values 22,4/19,2/16/20/11,2/11,2):**

| Line | Location | Stale text |
|------|----------|-----------|
| 143 | `hero.subtitleHighlight` | "citabilidad (22,4 %), E-E-A-T (19,2 %), acceso de bots (16 %), autoridad de marca (20 %), datos estructurados (11,2 %) y plataforma (11,2 %)" — **all six weights stale** |
| 164 | features[01] Acceso de bots | "El acceso de bots pondera el 16 %" |
| 169 | features[02] Citabilidad | "pondera el 22,4 %" |
| 174 | features[03] E-E-A-T | "pondera el 19,2 %" |
| 179 | features[04] Datos estructurados | "ponderan el 11,2 %" |
| 184 | features[05] Plataforma | "pondera el 11,2 %" |
| 189 | features[06] Autoridad de marca | "pondera el 20 % del GEO Score: … pierde esa **quinta parte**" (12 % ≈ octava parte) |
| 270 | faq[0] ¿Qué es el GEO Score? | same all-six-weights list as 143 |
| 290 | faq[4] Autoridad de marca | "Pondera el **20 %** del GEO Score: … pierde esa **quinta parte**" |

- **NOT stale**: `comparison.rows` (dimension list without weights, :239), CTA (:211-216), scorecard (:197-200), anon-limit copy.
- **Stale comments**: copy.ts:136-140, :154-158, :260-262 say "v3 weights (RGS-1)" (sprint-13 era).
- **Surgical-edit watch**: :174 "suman hasta **24 puntos** por dimensión" (E-E-A-T rubric points — NOT a weight) and :179 "puntúa **12 criterios**" (schema criteria count — NOT a weight) must NOT be "corrected".
- **Breaking tests — MUST be updated in the same change**: `src/lib/__tests__/copy.test.ts` asserts the v3.0.0 weights at lines 289, 294-298, 308, 322-323 (comment at :288 calls 20% "the v3 brand_authority weight (RGS-1)").

## 6. PDF export — el gate YA EXISTE (diagnóstico a revisar)

- **Route** `src/app/api/report/[id]/pdf/route.ts:41-44`: `auth()` → 401 anonymous; ownership `findFirst({ id, userId })` → 404 (PDF-2). Share token does NOT bypass (route ignores `shareToken`).
- **Trigger**: only `/dashboard/audits/[id]` (`src/app/dashboard/audits/[id]/page.tsx:137-143`), auth-gated by middleware (`src/middleware.ts:26` matcher `/dashboard/:path*` → 307 /login) + page-level `redirect("/login")` (:84-86).
- **Anonymous users cannot export**: no persisted audit → no id; and even with a shared-link id, the route 401s. The "future objective" (anon can't export) is **already true at every layer**.
- PDF is FREE for every authenticated user (no tier gate, PDF-3 removed); available for multi-page too (same header, template discriminates D3 shapes).
- **Real product gap** (for propose to decide): anonymous users have NO PDF affordance at all, while the landing/anon copy markets "exportación a PDF" as an account benefit (`copy.ts:33, 214, 280`). Options: (a) accept current state (document only), or (b) add an anon-facing "Exportar PDF" CTA on the live report that redirects to signup — a marketing gate, not a security one.
- Tests: `src/app/api/report/[id]/pdf/__tests__/route.test.ts` (401/404/500/200 contract) + `e2e/pdf-download.spec.ts` (auth-only) — both consistent with the current gate; safe either way.

## 7. Deudas técnicas

### 7a. Rangos predichos RGS-1 stale (sprint-14 spec vs corpus medido)

- Predicted ranges: `openspec/changes/archive/2026-09-01-sprint-14-geo-calibration/specs/geo-score-calculator/spec.md:47` — scenario "Benchmark re-verification discriminates": "moz scores 58-63, relevy.app scores 50-54, the average lands in 40-60, and no site is below 25".
- Measured (sprint-14 corpus): promedio **42.4**, moz **57** (1 pt under 58-63), relevy.app **55** (1 pt over 50-54), average in range ✓. `docs.anthropic.com → "Anthropic"` (eTLD+1 fix verified in `src/brand/scoring.ts:101-115`).
- Corpus source: `scripts/scorehero-verify.test.ts` `CANDIDATE_URLS` (14 URLs), run manually via `pnpm verify:scorehero` (network, not in standard suite).
- Refresh the spec scenario ranges to the measured corpus values when this change's spec is written (archive is immutable — the delta lives in the new change's spec, per OpenSpec convention).

### 7b. Excluir `coverage/` de eslint

- `eslint.config.mjs:15-21` ignores `node_modules/**`, `.next/**`, `out/**`, `build/**`, `next-env.d.ts` — **`coverage/**` NOT present**, and `coverage/` exists with generated artifacts (base.css, block-navigation.js, favicon.png, …). Add `"coverage/**"` to the `ignores` array.

### 7c. SUGGESTIONs del verify-report sprint-13 (`.../2026-09-01-sprint-13-brand-authority/verify-report.md:120-123`)

1. **S1 — OPEN (evolved)**: `src/audit/index.ts:226` — degraded invalid-URL branch writes `scoringModelVersion: "2.0.0"` while v3 paths write the current version. Sprint 13 suggested "3.0.0"; **now the correct target is "3.1.0"** (v3.1.0 is the write version since sprint 14).
2. **S2 — OPEN**: `src/brand/probes.ts:154` — Wikipedia match by exact title (or `brand (disambiguation)`); brands with differently-titled articles don't resolve. Documented MVP heuristic, no BRA-1 violation; revisit with data.
3. **S3 — RESOLVED by sprint 14**: `brandFromDomain` now uses the registrable domain (eTLD+1, `src/brand/scoring.ts:72-73, 101-115`) — `docs.anthropic.com` → "Anthropic". Nothing to do.

## Approaches (consolidated)

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| A — Fix in place, minimal diffs (invert segments, wrap score row, overflow-x-auto + min-w table, mobile menu island, copy v3.1 + test updates) | Small, test-safe, no structural risk | Mobile menu needs a new small client component | Low-Med |
| B — A + anon-facing PDF CTA gated to signup on the live report | Completes the marketing story ("PDF as account benefit") | Scope creep; touches audit-runner/report surfaces; new tests | Med |
| C — A + responsive comparison restructure to stacked mobile cards | Best mobile readability | Loses the semantic `<table>` extraction intent unless done carefully (prefer overflow-x-auto first) | Med |

## Recommendation

Approach A: every item except the PDF is a confirmed, localizable defect with known fix seams and test-safe surfaces (score-hero tests assert no segment order; copy tests are the only ones that must change with the copy). For the PDF item, treat the diagnosis as **already-gated**: propose should decide whether to add the anon-facing CTA (option b) or simply document the existing gate — it is NOT a security fix. The RGS-1 range refresh goes into the new change's spec as a MODIFIED scenario (archive stays immutable).

## Risks

- **copy.test.ts breaks** if weights change without updating assertions (lines 289, 294-298, 308, 322-323) — same change, or `pnpm test` goes red.
- **Surgical copy edits**: :174 "24 puntos" (rubric) and :179 "12 criterios" (schema criteria) are NOT weights — a naive find/replace of "24 %"/"12 %" would corrupt them.
- **Bar inversion is visual-only**: marker logic unchanged, but double-check the landing scorecard (`src/app/page.tsx`) renders the same component — it inherits the fix automatically; no regression path.
- **Mobile menu** has no existing pattern in the repo — design it as a client island to keep the Navbar shell a sync server component (RTL contract, layout.tsx:69).
- **Comparison table**: keep `<table>` semantics (RCI-5/RPL-10); prefer `overflow-x-auto` + `min-w` over a markup refactor.
- **coverage/ ignore** is config-only, zero risk; **audit/index.ts:226** version bump is behavior-neutral for degraded (non-persisted) results.
- PDF: do not "harden" the route — the gate already exists; a change here is product/marketing, not security.

## Ready for Proposal

Yes — all 7 items located with exact paths/lines, current implementation confirmed, test impact mapped (only `copy.test.ts` and the sprint-14 spec scenario need co-updates). The only item needing a product decision before propose: whether the PDF work is "document only" or "anon-facing CTA gated to signup".