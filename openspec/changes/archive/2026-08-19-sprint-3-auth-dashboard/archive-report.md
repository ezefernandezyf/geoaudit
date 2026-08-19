# Archive Report: sprint-3-auth-dashboard

**Change**: sprint-3-auth-dashboard
**Archived**: 2026-08-19
**Mode**: hybrid (OpenSpec filesystem + Engram)
**Archive location**: `openspec/changes/archive/2026-08-19-sprint-3-auth-dashboard/`

## Final State (at close)

This report reflects the FINAL state of the change at archive time, per the Final-State
Authority hierarchy. `verify-report.md` is an intermediate snapshot describing the state
of the work at verification time (branch `feat/s3-u5`, HEAD `875c5eb`); the orchestrator's
final-state handoff at archive launch is a more recent account and outranks it where they
differ. No unresolved contradictions remain; the two items carried as WARNING in the
verification snapshot are resolved below with evidence.

- **Verification verdict**: PASS WITH WARNINGS — `gentle-ai.verify-result/v1` envelope,
  `verdict: pass_with_warnings`, `blockers: 0`, `critical_findings: 0`,
  `requirements: 25/25`, `scenarios: 31/31` (auth-pages 5, dashboard 5, tier-limits 6,
  auth-github 4, database-connection 3, rate-limiting 2).
- **Tests**: 521 passed / 1 skipped (71 files), `pnpm test` exit 0.
- **Lint / Typecheck**: 0 errors / clean (exit 0); `prisma generate` exit 0.
- **Tasks**: 27/27 complete across 5 work units (U1 DB foundation, U2 auth upgrade,
  U3 persistencia+tier, U4 dashboard, U5 limiter DB).
- **Delivery**: 5 chained PRs #18–#22 + tracker #23 → `develop` (`004bcd0`); milestone
  PR #24 → `main` (`b1f1e34`, CI PASS).
- **HARD GATEs**: migration applied to real Supabase (6 tables + enum, zero errors);
  DB-backed limiter against real Supabase 3/3 (atomic upsert count 2, new-window new
  row, reset); **real GitHub OAuth smoke COMPLETED by the orchestrator after
  verification** (login → callback → dashboard → audit → historial; pre-adapter stale
  cookie bug resolved with re-login).
- **Documented deviations** (8, from verify-report, all preserved): Prisma 7 datasource
  `url` in `prisma.config.ts`; edge-safe `auth.config.ts` split; `exposeUserIdInSession`;
  structural types `AuditCountClient`/`RateLimitEntryClient`; `getDefaultRateLimiter()`
  async factory; `severityBand` persisted as English contract value; no TTL/cleanup for
  `RateLimitEntry`; `build` omitted from verify gate (AGENTS.md "never build" rule).

### WARNING resolution (verify-report snapshot → final state)

| Snapshot claim (verify-report, 2026-08-18) | Final state (at close) | Evidence |
|---|---|---|
| WARNING 1: auth-github R6 "Session rows linked" not met — spec contradicts JWT strategy | **RESOLVED at archive** — spec corrected: R6 now states the adapter persists `User` + `Account` and writes NO `Session` rows (stateless). Spec and implementation are coherent. | Correction applied to the delta spec before archive AND to the merged `openspec/specs/auth-github/spec.md` |
| WARNING 2: real GitHub OAuth handshake pending (orchestrator manual smoke) | **COMPLETED by orchestrator** — login → callback → dashboard → audit → historial; stale-cookie bug fixed with re-login | Orchestrator launch prompt (highest authority); verify-report updated with "Post-Verification Evidence" section |
| WARNING 3: `RateLimitEntry` table growth (no TTL) | **Carried forward** — informational; recommended cleanup before production (`deleteMany(windowStart < now - windowMs)`) | Not a blocker; no CRITICAL issues anywhere |

## Gates

### Native Review Receipt Gate

**No review governs this change.** `reviewGate` is structurally absent in the native
status output for this candidate: no review transaction, ledger, receipt, bundle, or
gate context exists (no `reviews/` artifacts in the change folder, none in Engram), and
no `reviewOffer` is present either — receipt-driven development does not exist for this
candidate (kill switch off). Per the gate contract, archive proceeds under ordinary
repository policy; there is nothing to read or block on. This is recorded as the absence
of native review governance — it is NOT an `allow` verdict and NOT a claim that a review
receipt exists. An explicit review artifact that failed validation would still block;
none exists here.

### Task Completion Gate

**27/27 implementation tasks checked** in the persisted tasks artifact (both the
filesystem `tasks.md` and Engram #1580); **0 unchecked** at archive time. No stale
checkboxes needed reconciliation.

### Action Context Guard

`actionContext.mode: repo-local`, workspace root `/home/ezeyf/Escritorio/geo-saas`; all
archive operations (spec sync + move) stayed inside the planning root and repo. No
`workspace-planning` mode was active.

## Spec Sync (delta → main specs)

| Domain | Action | Details |
|--------|--------|---------|
| `auth-pages` | **NEW** | Full spec copied mechanically → `openspec/specs/auth-pages/spec.md` (ATH-1..5) + provenance header |
| `dashboard` | **NEW** | Full spec copied mechanically → `openspec/specs/dashboard/spec.md` (DSH-1..5) + provenance header |
| `tier-limits` | **NEW** | Full spec copied mechanically → `openspec/specs/tier-limits/spec.md` (TLM-1..6) + provenance header |
| `auth-github` | **MERGED** (baseline R1–R5 + delta R2/R3 MODIFIED + R6/R7 ADDED) | R2: custom `/login` sign-in entry; R3: matcher `/dashboard/:path*` → 307 `/login?callbackUrl=`; R6: Prisma adapter persists `User`+`Account`, no `Session` rows (JWT stateless) — **R6 corrected at archive**; R7: `pages.signIn` wired. Preserved R1/R4/R5 |
| `database-connection` | **MERGED** (baseline R1–R3 + R4 MODIFIED + R5/R6 ADDED) | R4: schema with 6 Sprint 3 models + first migration; R5: Audit model; R6: RateLimitEntry model. Preserved R1/R2/R3 |
| `rate-limiting` | **MERGED** (baseline RTL-1..7 + RTL-2/RTL-6 MODIFIED) | RTL-2: injectable store, async contract, production default now DB-backed; RTL-6: from SHOULD doc-note to MUST DB-backed `PrismaRateLimitStore` with atomic UPSERT + kill-switch bypass scenario. Preserved RTL-1/3/4/5/7; compliance matrix updated |

Provenance headers follow the repo convention established at Sprint 2 archive
(`> **Change**: \`<change>\` · **Type**: New capability (ADDED)`) for the 3 NEW domain
specs; the 3 MERGED specs retain their existing baseline headers/style and their
requirements tables were updated to include the new/modified rows.

### R6 correction (auth-github)

The delta spec's original wording — "creating `User`, `Account`, and `Session` rows
while keeping the JWT session strategy" — was internally contradictory: with
`session.strategy: "jwt"`, `@auth/prisma-adapter` persists `User` and `Account` but
writes no `Session` rows (stateless). The corrected text (applied to both the archived
delta spec and the merged main spec) states: the adapter creates `User` + `Account`
rows, no `Session` row is written, and the `Session` model exists for future
database-session use. This resolves verify-report WARNING 1; the implementation
(`auth.ts` with adapter + JWT strategy) was already coherent with the corrected wording.

## Mechanical Copy Verification (readback)

- Spec copy (new domains): `diff -r openspec/changes/sprint-3-auth-dashboard/specs/{domain}/spec.md <temp-copy>` → **empty output** (byte-identical) for `auth-pages`, `dashboard`, `tier-limits`. Provenance headers were added AFTER the mechanical copy (editorial addition, not byte reproduction) and are documented above.
- Archive move: recursive pre-move snapshot (`cp -R` to `mktemp -d`) compared against the archived folder after `git mv` → **`diff -r` empty output** (byte-identical; the source directory was confirmed gone). `archive-report.md` is additive and excluded from the comparison (it did not exist in the source snapshot).
- The archive report is the only file written after the readback; no artifact content was routed through model Read/Write for copying.

## Engram Traceability

Observation IDs read for this archive (all full-content via `mem_get_observation`, not
previews):

| Artifact | Engram ID | Filesystem |
|----------|-----------|------------|
| explore | #1575 | (exploration.md not persisted to fs) |
| proposal | #1576 | `openspec/changes/archive/2026-08-19-sprint-3-auth-dashboard/proposal.md` |
| specs | #1578 | `.../specs/` (6 domains) |
| design | #1579 | `.../design.md` |
| tasks | #1580 | `.../tasks.md` |
| apply-progress | #1581 | (Engram-only) |
| verify-report | #1632 | `.../verify-report.md` |

## Dispatcher Status Note

Native `gentle-ai sdd-status` projected `nextRecommended: verify` and
`dependencies.archive: blocked` at archive launch, with **empty `blockedReasons`** and
phase instruction "Archive only when verify-report.md exists and every task checkbox is
complete" — both conditions hold. The blocked projection is an artifact of the
dispatcher's runtime transaction state (the verification run was not bracketed by an
`sdd-attempt` transaction and `verify-report.md` is an untracked working-tree file), not
an unresolved blocker: the orchestrator's launch prompt confirmed the final state
(verify PASS WITH WARNINGS, delivery to `develop`, milestone merge to `main`, HARD GATE
OAuth real completed), which is the most recent and highest-ranked account. Archive
proceeded under ordinary policy with 0 CRITICAL findings.

## Archive Contents

- proposal.md ✅
- design.md ✅
- specs/ (auth-github, auth-pages, dashboard, database-connection, rate-limiting, tier-limits) ✅
- tasks.md ✅ (27/27 complete, 0 unchecked)
- verify-report.md ✅ (updated at archive with Post-Verification Evidence; envelope unchanged)
- archive-report.md ✅ (this file, additive)

## Risks / Next

- **`RateLimitEntry` growth**: no TTL/cleanup — schedule a periodic
  `deleteMany(windowStart < now - windowMs)` before production launch.
- **`NODE_ENV=production` store wiring** only asserted via unit test + mocked dynamic
  imports; re-verify in a deployed environment (Vercel) before launch.
- Baseline for **Sprint 4 (Stripe)**: all 6 specs are now in `openspec/specs/` as the
  source of truth; `tier-limits` TLM-1 (FREE/PRO tier) is the contract Stripe
  subscription sync will build on.