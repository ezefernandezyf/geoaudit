# Tasks: Sprint 17 — UI Polish

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~800 (prod ~330 + tests ~470) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 PDF → PR 2 Mobile → PR 3 Landing → PR 4 JSON-LD |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High
```

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | PDF arch resolver (PDF-4) | PR 1 (base: tracker branch) | `pnpm vitest run src/pdf/__tests__/render.test.ts` | N/A locally — prod-only path (`NODE_ENV=production`); Vercel preview smoke | Revert render.ts + render.test.ts |
| 2 | Mobile drawer island (SHL-10) | PR 2 (base: PR 1 branch) | `pnpm vitest run src/ui/__tests__/mobile-menu.test.tsx src/ui/__tests__/nav-links.test.tsx src/ui/__tests__/navbar.test.tsx` | `pnpm dev` — viewport <md: toggle on right opens drawer; Escape/overlay close, focus returns to toggle | Revert nav-config.ts, mobile-menu.tsx, navbar.tsx, nav-links.tsx + both test files |
| 3 | Landing rhythm (LND-18) | PR 3 (base: PR 2 branch) | `pnpm vitest run src/app/__tests__/page.test.tsx` | `pnpm dev` — visual S4–S7 gray/white rhythm; exactly 6 `rounded-xl` cards | Revert page.tsx section classes + LND-18 tests |
| 4 | JSON-LD org attrs (LND-9) | PR 4 (base: PR 3 branch) | `pnpm vitest run src/lib/brand.test.ts src/app/__tests__/page.test.tsx` | `pnpm dev` — view-source ld+json: areaServed/industry/numberOfEmployees present, no award | Revert brand.ts + page.tsx + tests |

Note: Unit 2 alone ≈ 550-600 changed lines — atomic island extraction + test migration (a move counts as add+delete; co-update constraint). Decision at apply: accept as one slice (size:exception) or split `nav-config.ts` prep into its own PR.

Threat matrix: N/A (no routing/shell/subprocess boundary) → no threat-matrix RED tasks.

## Phase 1: PDF resolver (D1)

- [x] **T1 — PDF-4 arch resolver** — T1.1 RED: `src/pdf/__tests__/render.test.ts` +3: x64 → `chromium-v149.0.0-pack.x64.tar`, arm64 → `...-pack.arm64.tar`, unknown arch → `PdfRenderError`. T1.2 GREEN: `src/pdf/render.ts` — delete `CHROMIUM_PACK_URL`, add exported `resolveChromiumPackUrl(arch = process.arch)`; call at line 81. Commit `fix(pdf): resolve chromium pack URL by arch (PDF-4)`. **Done in PR1 (ffcae73)** — merged to develop via PR #73.

## Phase 2: Mobile drawer (D2-D4)

- [x] **T2 — SHL-10 drawer island** — T2.1 RED: create `src/ui/__tests__/mobile-menu.test.tsx` — 5 tests migrated from `nav-links.test.tsx` (query via `screen`/`document.body`, portal breaks `container.querySelector`) + 4 new: portal-to-body, closed `aria-hidden`+`inert`, Escape+focus-return, overlay-click+focus-return. T2.2 GREEN: create `src/ui/nav-config.ts` (`LINKS`, `MULTI_PAGE_LINK`, `buildLinks`); create `src/ui/mobile-menu.tsx` (toggle `md:hidden`, portaled drawer `fixed right-0` + overlay, `inert` closed); `src/ui/nav-links.tsx` desktop-only (drops `open`/panel/actions); `src/ui/navbar.tsx` renders `<MobileMenu>` in right container; drop the 5 mobile tests from `nav-links.test.tsx`. Commit `feat(shell): mobile drawer island portaled to body (SHL-10)`. **Done in PR2 (b4ea788)** — merged to develop via PR #77 (drawer + landing fondos combinados tras romperse la cadena).

## Phase 3: Landing backgrounds (D5)

- [x] **T3 — LND-18 rhythm** — T3.1 RED: `src/app/__tests__/page.test.tsx` +LND-18: S4 exactly 6 `div.rounded-xl`, S5/S6 white bands, S5b white `rounded-2xl` recuadro, gray-surface eyebrows `#475569`, table wrapper `overflow-x-auto` + `min-w-[640px]`. T3.2 GREEN: `src/app/page.tsx` — D5 map: S4 gray + white `rounded-2xl` recuadro (6 cards untouched), S5 `border-y bg-white` band, S5b gray + recuadro, S5c `border-y`→`border-t`, S6 `border-b bg-white` band, S7 gray; gray eyebrows → `#475569`. Commit `feat(landing): interleaved section backgrounds (LND-18)`. **Done in PR3 (b24e3d9)** — 5 LND-18 tests RED → GREEN; suite 1071 passed, lint + typecheck clean.

## Phase 4: JSON-LD (D6)

- [x] **T4 — LND-9 org attrs** — T4.1 RED: `src/lib/brand.test.ts` +3 constant assertions; `src/app/__tests__/page.test.tsx` JSON-LD += `areaServed` "AR", `industry` "Software", `numberOfEmployees` 1, no `award`. T4.2 GREEN: `src/lib/brand.ts` +`ORG_AREA_SERVED`, `ORG_INDUSTRY`, `ORG_EMPLOYEES`; `src/app/page.tsx` `OrganizationJsonLd` (lines 60-85) renders the 3 props; `award` omitted. Commit `feat(brand): org areaServed/industry/employees (LND-9)`. **Done in PR4 (f8dc577)** — RED 4 fallos (3 brand + 1 page) → GREEN; suite 1069 passed, lint + typecheck clean.

## Phase 5: Verification gate

- [x] **T5 — Gate** — `pnpm test` · `pnpm run lint` · `pnpm run format` · `pnpm run typecheck` green; `pnpm dev` smoke: drawer a11y, landing rhythm, JSON-LD; `a11y.test.tsx` co-update only if broken. **Satisfied by verify-report.md** — independent `pnpm test` 1084 passed / 0 failed (4 pre-existing skips), lint exit 0, typecheck exit 0; verdict PASS.

## Archive-time reconciliation (sdd-archive, 2026-09-04)

T1, T2, and T5 were marked `[x]` during the archive phase, not by `sdd-apply`. The apply phase was cut short (no `apply-progress.md` artifact was ever written — prior verify interrupted), so the checkbox markers for T1/T2 never landed despite the implementation being merged and green on `develop` (T1 → `ffcae73` = PR #73; T2 → `b4ea788` = PR #77; T4 → `f8dc577` = PR #78; T3 → `b24e3d9` inside PR #77). T5 is the verification gate, satisfied by the independent `pnpm test` / `pnpm run lint` / `pnpm run typecheck` run recorded in `verify-report.md` (PASS — 4/4 requirements, 24/24 scenarios, 1084 passed / 0 failed). This is the exceptional archive-time reconciliation backed by verify-report PASS per the Task Completion Gate; see `archive-report.md`.