# Archive Report — sprint-11-rebrand-polish

**Change**: sprint-11-rebrand-polish
**Archived**: 2026-08-31 → `openspec/changes/archive/2026-08-31-sprint-11-rebrand-polish/`
**Mode**: hybrid (OpenSpec filesystem + Engram)
**Verdict**: PASS WITH WARNINGS → **CLOSED** (build warning resolved at merge gate; tasks reconciled against authoritative Engram state; one external pending documented, not blocking)

## Final State (at close)

Per the Final-State Authority hierarchy, this report reflects the state AT CLOSE, not the intermediate snapshots:

- **Verify**: PASS WITH WARNINGS, 0 CRITICAL, 0 blockers. Strict envelope validates (verdict `pass_with_warnings`, evidence_revision `sha256:b1761a42f71500762eb4f44f0091c6a9664db657b8157466698b3da14217b091`, requirements 12/12, scenarios 28/28, `pnpm test` 903 passed / 4 skipped / 0 failed, `typecheck` + `lint` exit 0).
- **Build warning (`next build` not run at verify)**: **RESOLVED** post-verify — the orchestrator ran `pnpm run build` OK at the merge gate; PRs #66–#69 (feature-branch-chain `feat/s11-f1..f4`) integrated to `develop` + `main` (`5273c39`). The verify-report's "deferred to merge gate" row is superseded by this orchestrator-confirmed final state.
- **On-disk `tasks.md` unchecked (23 `[ ]`)**: **RECONCILED at archive** — see Task Completion Gate below. The authoritative `[x]` state lives in Engram tasks observation #1835 (23/23 complete, with per-task commit evidence).
- **PR 4 = 531 changed lines** (>400 budget): pre-agreed final slice of the feature-branch-chain (ask-on-risk resolved in tasks); 437 of those lines are tests + fixtures. Process note, not a defect.
- **Repo rename `geoaudit` → `relevy` on GitHub**: **PENDING EXTERNAL** (manual user step). GitHub redirects meanwhile; `BRAND_REPO` (`github.com/ezefernandezyf/relevy`) and `sameAs`/links already target the new name. Documented in README/AGENTS (task 3.4). Not a blocker, not resolved by this archive.
- **Live domain smoke** of the rebrand on `relevy.app`: not verified in this slice; expected after merge + deploy. Confirm visually on next release.

## Decisions (closed in this change)

1. **Rebrand GeoAudit → Relevy**: single shared brand module `src/lib/brand.ts` (`BRAND_NAME`, `BRAND_DOMAIN`, `SUPPORT_EMAIL`, `BRAND_DESCRIPTOR`, `BRAND_REPO`) drives ~30 production files + 9 test files + `public/llms.txt` + docs. Zero visible "GeoAudit" hits in `src/`/`public/` production code (grep gate 5.1; remaining refs are negative assertions, deletion comments, synthetic audit-target fixtures, and `prisma.test.ts` DATABASE_URL — all excluded by design).
2. **Logo**: user-generated Relevy mark (Gemini SVG — two quote paths, navy `#0f172a` dark:fill-white + emerald `#10b981`, no tile, viewBox 32x32) integrated early in PR 1 (`f88cb7e`); wordmark "Relevy" Instrument Serif; tagline dropped (brief §3); favicon `icon.svg` = same mark; `Logo` API (`size`, `showWordmark`, `className`, `decorative`) preserved — `showWordmark=false` IS the markOnly variant.
3. **Anonymous limit 3/30d**: second limiter `getAnonymousAuditLimiter()` (singleton, `anon:{ip}`, `PrismaRateLimitStore`, fixed window anchored at first increment, kill switch `RATE_LIMIT_ENABLED`), enforced ONLY in `audit-runner.tsx` at completion (`!userId` branch), no pre-check in `actions.ts`. Signed-in flow untouched (TLM-11, RTL-8).
4. **Citability fix**: `bottom3` derived from the complement of `top3` block ids (`Set` filter) — disjoint lists for any block count; <3 remaining → fewer bottoms, never a repeated passage (RCI-10). New fixtures: 3/4/5-genuine/8-block pages.
5. **Legal free model**: `LEGAL_COPY.terms[2]` → "3. Plan único gratuito" (10 audits / 30-day window, no costs/subscriptions); `privacy[1]` drops "procesar pagos"; section numbering preserved (LGL-6).
6. **Sprint-10 suggestions closed**: profile pill unified to "Plan Free"; `.env.example` + `NEXTAUTH_URL` + `NEXT_PUBLIC_APP_URL`; stale comments cleared (`layout.tsx:42`, `score-hero-evidence.ts:24`, `presenters/types.ts`, `next.config.ts`, `vitest.config.ts`, `globals.css`).

## Gates

- **Native Review Receipt Gate**: `reviewGate` structurally ABSENT in native status — receipt-driven development kill switch OFF (`gentle-ai review mode status`: off, decided by default), zero review artifacts for this candidate (`reviewLedger/Receipt/Bundle/Context/State` all missing). Archive proceeded under ordinary repository policy; nothing to read or block on.
- **Task Completion Gate**: on-disk `tasks.md` showed 23 unchecked `[ ]` (apply did not touch `openspec/` per orchestrator order). The orchestrator explicitly instructed archive-time stale-checkbox reconciliation, and apply-progress (#1837, F1–F4 per-task commits) + verify-report (#1838) prove every task complete. **EXCEPTIONAL MECHANICAL RECONCILIATION performed**: all 23 tasks marked `[x]` in the archived `tasks.md` with per-task commit evidence, matching the authoritative Engram observation #1835 (23/23 `[x]`). Verification: 23 `[x]` / 0 `[ ]` in archived artifact.
- **CRITICAL issues**: 0 in verify-report. No override accepted or needed.
- **Dispatcher routing note**: native `sdd-status` reported `taskProgress 0/23` / `nextRecommended: apply` / `archive: blocked` solely because of the stale on-disk checkboxes; `blockedReasons` was empty. Resolved by the authorized reconciliation above — the archive instruction ("archive only when verify-report.md exists and every task checkbox is complete") is satisfied post-reconciliation.

## Specs Synced (canonical `openspec/specs/`)

All 7 delta domains had existing canonicals → **merged** (non-delta requirements preserved):

| Domain | Action | Requirements |
|--------|--------|--------------|
| app-shell | MODIFIED + ADDED | SHL-4 updated (Relevy mark + favicon); SHL-8 ADDED (shared support email constant); SHL-9 ADDED (brand title/OG/copyright) |
| audit-limits | MODIFIED + ADDED | TLM-6 updated (anon counts toward IP limit, no persist); TLM-11 ADDED (3 anon / 30d fixed window / IP, gate at completion) |
| rate-limiting | ADDED | RTL-8 ADDED (`getAnonymousAuditLimiter()` 3/30d `anon:{ip}`, no pre-check) |
| citability-engine | MODIFIED | RCI-10 updated (disjoint top3/bottom3, fewer bottoms when <3 remain) + detailed section added |
| landing-page | MODIFIED | LND-9 updated (JSON-LD Relevy + relevy.app + relevy repo); LND-10 updated (llms.txt Relevy + 10/30d accurate claim) |
| app-profile | MODIFIED | PRF-3 updated ("Plan Free" pill unified); PRF-6 updated (support uses shared email constant) |
| legal-pages | MODIFIED + ADDED | LGL-6 ADDED (free-model legal copy, no paid plans/payments) |

Header change lines and Purpose paragraphs updated per domain to record `sprint-11-rebrand-polish`; compliance matrices updated. No REMOVED or RENAMED requirements in this change.

## Engram Observations Read (traceability)

- #1831 architecture — `sdd/sprint-11-rebrand-polish/explore`
- #1832 architecture — `sdd/sprint-11-rebrand-polish/proposal`
- #1833 architecture — `sdd/sprint-11-rebrand-polish/spec`
- #1834 architecture — `sdd/sprint-11-rebrand-polish/design`
- #1835 architecture — `sdd/sprint-11-rebrand-polish/tasks` (authoritative 23/23 `[x]`)
- #1836 architecture — Relevy logo SVG from Gemini (ready to integrate)
- #1837 architecture — `sdd/sprint-11-rebrand-polish/apply-progress` (F1–F4 accumulated)
- #1838 architecture — `sdd/sprint-11-rebrand-polish/verify-report`

## Verification of the Archive Operation

- `diff -r` snapshot (pre-move recursive copy) vs `openspec/changes/archive/2026-08-31-sprint-11-rebrand-polish/` → **empty** (byte-identical; only `archive-report.md` added after the readback, additive-only). Verbatim `diff -r` output included in the phase result.
- Active changes dir no longer contains `sprint-11-rebrand-polish` (only legacy `sprint-6-ui-redesign` remains, untouched).
- Archived folder contains: proposal.md, design.md, tasks.md (23/23 `[x]`), verify-report.md, specs/ (7 delta domains).
- `pnpm run typecheck` → clean (0 errors).

## External Pending (user step, NOT a code failure)

- **GitHub repo rename `geoaudit` → `relevy`**: manual user step (documented in README/AGENTS; task 3.4). Until done, GitHub redirects the old URL; `BRAND_REPO`/`sameAs`/links already use `ezefernandezyf/relevy`.

## Debts Transferred to Sprint 12 (Brand Authority) and Launch

1. **Sprint 12 — Brand Authority engine** (6th engine): brand mention scanning across platforms AI systems rely on (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews, Bing Copilot), weighted 20% of the GEO Score. Planned as its own SDD change.
2. **Sprint 13 — Launch**: Stripe production + Sentry production monitoring.
3. **Repo rename completion**: confirm the manual GitHub rename `geoaudit` → `relevy` landed (external pending from this change).
4. **Live smoke of the rebrand** on `relevy.app` (visual confirmation of Relevy mark/brand on the deployed landing; post-merge).

## Intentional-with-Warnings Notes

- Archive proceeded with 0 CRITICAL findings and no user override required. The two WARNING-class items were closed at archive: (1) build warning resolved by orchestrator merge gate (`pnpm run build` OK, merged `5273c39`); (2) on-disk tasks.md reconciled at archive per explicit orchestrator instruction, backed by authoritative Engram #1835 + apply-progress #1837 + verify-report #1838. The PR-4 line-count note is a documented process artifact of the pre-agreed chain split, not a defect. The repo rename remains an external pending user step.

## SDD Cycle Complete

The change has been fully planned (explore → propose → spec → design → tasks), implemented (4 PRs #66–#69, feature-branch-chain), verified (PASS WITH WARNINGS, 903 tests, build green at merge gate), and archived. Ready for the next change (Sprint 12 — Brand Authority).