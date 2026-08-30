# Archive Report — sprint-10-free-mode

**Change**: sprint-10-free-mode
**Archived**: 2026-08-30 → `openspec/changes/archive/2026-08-30-sprint-10-free-mode/`
**Mode**: hybrid (OpenSpec filesystem + Engram)
**Verdict**: PASS WITH WARNINGS → **CLOSED** (all warnings resolved or deferred by explicit decision; live smoke completed)

## Final State (at close)

Per the Final-State Authority hierarchy, this report reflects the state AT CLOSE, not the intermediate snapshots:

- **Verify**: PASS WITH WARNINGS, 0 CRITICAL, 0 blockers. Strict envelope validates (`gentle-ai sdd-verify-validate` → `valid: true`, verdict `pass_with_warnings`, evidence_revision `sha256:30d1852fb52de5ee740af5d492796eefe126a208225440e8c78df065c0429771`, requirements 55/55, scenarios 37/37, 876 tests passed / 0 failed, build exit 0).
- **Deploy warning (DPV-1/3/4 live smoke)**: **RESOLVED** post-verify — live smoke completed on **relevy.app** (build OK, GitHub login OK, audit OK, PDF OK). The verify-report's "deferred" DPV rows are superseded by this orchestrator-confirmed final state; the repo-side evidence (`build:vercel` script, down-migration applied) is confirmed.
- **LEGAL_COPY stale billing references** (`copy.ts:291-292` "Planes y facturación", `copy.ts:321` "procesar pagos"): **deferred to Sprint 11** by explicit orchestrator decision (Rebrand & Polish owns legal copy). Not a blocker.
- **TDD evidence format** (inline RED→GREEN instead of dedicated table): cosmetic deviation, TDD demonstrably followed (RED tests exist and re-verified green).
- **SUGGESTIONs carried forward to Sprint 11**: profile pill lowercase `free` vs spec "Free" (cosmetic); `.env.example` missing `NEXTAUTH_URL`/`NEXT_PUBLIC_APP_URL`; stale comments `layout.tsx:42` and `score-hero-evidence.ts:24`.
- **Post-verify fix**: `15eb349` on main — `prisma.config.ts` uses `DIRECT_DATABASE_URL` (session pooler 5432 + `pgbouncer=true`) because Prisma Migrate hangs with the transaction pooler 6543. Included in final state.

## Gates

- **Native Review Receipt Gate**: `reviewGate` structurally ABSENT — receipt-driven development kill switch OFF (`gentle-ai review mode status`: off, decided by default), zero review artifacts for this candidate (`reviewLedger/Receipt/Bundle/Context/State` all missing). Archive proceeded under ordinary repository policy; nothing to read or block on. Declined `reviewOffer` present in dispatcher output — invitation, not a gate.
- **Task Completion Gate**: persisted `tasks.md` shows 29/29 `[x]`; native status `taskProgress.allComplete: true`. No stale unchecked tasks; no exceptional reconciliation needed.
- **CRITICAL issues**: 0 in verify-report.
- **Dispatcher routing note**: native `sdd-status` reports `nextRecommended: verify` / `archive: blocked` with EMPTY `blockedReasons`, because the runtime-attempt ledger (`sdd-runtime/v1`) has no records for this change — the same legacy state under which sprints 4–9 were archived. The dispatcher's own archive instruction ("archive only when verify-report.md exists and every task checkbox is complete") is satisfied, blockedReasons is empty, and the strict verify envelope validates. Recorded for traceability; not a blocker.

## Specs Synced (canonical `openspec/specs/`)

### Deleted (capability removed)
- `billing/` — whole capability removed (BLG-1..10)
- `pricing/` — whole capability removed (PRC-1..8)

### Renamed
- `tier-limits/` → **`audit-limits/`** (user decision). Directory moved byte-identical (`diff -r` empty), content merged: single FREE limit 10/30d; TLM-1/7/8/9 REMOVED; TLM-2/3/5/10 MODIFIED; TLM-4/6 preserved. Header records the rename.

### New
- `deploy-vercel/` — DPV-1..4 (env vars, migrations at build, no-500, end-to-end smoke). Copied byte-identical from the full-spec delta (`diff -r` empty).

### Merged (MODIFIED deltas → canonical, non-delta requirements preserved)
| Domain | Action | Requirements |
|--------|--------|--------------|
| audit-limits (ex tier-limits) | Renamed + MODIFIED | TLM-2/3/5/10 updated (10/30d); TLM-1/7/8/9 removed; TLM-4/6 kept |
| pdf-export | MODIFIED | PDF-9 updated (non-owner 404 added); PDF-3 (tier gate) removed |
| share-links | MODIFIED | SHR-3/5 updated (no tier gate, no tier in payload); SHR-3 FREE-blocked scenario removed |
| multi-page-audit | MODIFIED | MPA-1/7 updated (authenticated user, 30-day window); MPA-8 (PRO gate) removed |
| dashboard | MODIFIED | DSH-6 (billing CTA) removed |
| app-shell | MODIFIED | SHL-2 updated (static "Free" pill) |
| app-profile | MODIFIED | PRF-3/4 updated (Free plan, 10/30); PRF-5 (manage subscription) removed |
| audit-detail | MODIFIED | ADP-7/8 updated (share/export ungated) |
| multipage-ui | MODIFIED | MPU-3/6 updated (no upgrade code, all authed users); MPU-2 (PRO gate) removed |
| database-connection | MODIFIED | R4 updated (schema without billing models, down-migration); R7 (Subscription model) removed |
| e2e-testing | MODIFIED | E2E-5 updated (FREE PDF flow); E2E-4 (stripe checkout) removed |
| landing-page | MODIFIED | LND-6 updated (no pricing teaser; "Auditar gratis" anonymous CTA) |
| auth-github | MODIFIED | R6 updated (no `User.tier` on sign-up persistence) |
| accessibility | MODIFIED | A11Y-2/6 updated (pricing page/controls out of scope) |

## Engram Observations Read (traceability)

- #1823 decision — Sprint 10 decisions (PRO→FREE, remove pricing teaser)
- #1824 architecture — `sdd/sprint-10-free-mode/spec`
- #1825 architecture — `sdd/sprint-10-free-mode/design`
- #1826 architecture — `sdd/sprint-10-free-mode/tasks`
- #1827 architecture — `sdd/sprint-10-free-mode/apply-progress`
- #1828 architecture — `sdd/sprint-10-free-mode/verify-report`

## Verification of the Archive Operation

- `diff -r` snapshot vs `openspec/changes/archive/2026-08-30-sprint-10-free-mode/` → **empty** (byte-identical; only `archive-report.md` added after the readback, additive-only).
- Active changes dir no longer contains `sprint-10-free-mode`.
- Archived folder contains: proposal.md, design.md, tasks.md (29/29 complete), verify-report.md, specs/ (17 delta domains).
- `pnpm run typecheck` → clean (0 errors).

## Debts Transferred to Sprint 11 (Rebrand & Polish)

1. **Rebrand GeoAudit → Relevy** (domain relevy.app purchased): product name, wordmark, OG/metadata, `geo-audit-{id}.pdf` filename, spec purposes, README/AGENTS.
2. **LEGAL_COPY stale billing references** — `src/lib/copy.ts:291-292` "Planes y facturación" (paid plans billed monthly) + `copy.ts:321` privacy "procesar pagos" must be rewritten for the single-FREE plan.
3. **Favicon** (new Relevy icon).
4. **Real email** for account/support: ezefernandezyf@gmail.com.
5. **Anonymous limit flow**: free anonymous audits currently don't count toward the 10/30d limit (TLM-6); Sprint 11 introduces the 3-audit anonymous cap.
6. **Bug citability**: same passages scoring best/worst — investigate.
7. **Copywriting polish** + SUGGESTIONs: profile pill lowercase `free` → "Free"; add `NEXTAUTH_URL`/`NEXT_PUBLIC_APP_URL` to `.env.example`; remove stale comments `layout.tsx:42`, `score-hero-evidence.ts:24`.
8. **Repo rename on GitHub** to match the new brand.

## Intentional-with-Warnings Notes

- Archive proceeded with 0 CRITICAL findings and no user override required; the two remaining WARNING-class items (LEGAL_COPY, TDD format) were resolved/deferred by explicit orchestrator decisions before launch, and the deploy warning was resolved by live smoke evidence.

## SDD Cycle Complete

The change has been fully planned, implemented (PRs #61-#65), verified (876 tests, live smoke), and archived. Ready for the next change (Sprint 11 — Rebrand & Polish).