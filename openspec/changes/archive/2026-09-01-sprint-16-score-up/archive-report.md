# Archive Report: Sprint 16 — Score Up

- **Change**: `2026-09-01-sprint-16-score-up`
- **Archived**: 2026-09-04
- **Project**: Relevy (repo local `geo-saas`, GitHub `relevy`)
- **Mode**: hybrid (OpenSpec + Engram)

## Status at Close

- **Verdict**: PASS
- **Completeness**: 6/6 requirements · 22/22 scenarios compliant (delta specs: LND-13/LND-9/LND-4 MODIFIED, LND-16/LND-17 ADDED, SHL-11 ADDED)
- **Tasks**: 6/6 complete (T1–T6 checked in the persisted `tasks.md` — Task Completion Gate passed; 0 unchecked)
- **Tests**: `pnpm test` → 1066 passed / 0 failed / 4 skipped (119 files: 118 passed, 1 skipped); `pnpm run lint` → exit 0; `pnpm run typecheck` → exit 0 (tsc --noEmit); axe shell clean; changed-file coverage 100% statements / 100% lines / 92.3% branch / 100% functions
- **Milestone**: develop = `bd954ce` = merge of PR #71 (squash) from `feat/sprint-16-score-up` (branch deleted, pushed). Single PR, forecast Low (~321 changed lines, under the 400-line budget) — no size exception needed.
- **Review gate**: no receipt-driven review artifacts exist for this candidate (no `reviewGate` in status; no `reviews/` artifacts in the change folder) — archived under ordinary repository policy.

## Scope Delivered

1. **Footer byline (LND-13 / SHL-11)**: author byline moved from the FAQ block to the global footer as `<p className="byline">` with real founder name + role ("Fundador de Relevy") from centralized `FOUNDER`/`SHELL_COPY` constants. The expertise engine's `AUTHOR_SELECTOR` matches `.byline` over the full DOM (+5) on the landing and every subpage; the footer stays excluded from citability and E-E-A-T text → zero scoring collateral. `<time>` remains in the FAQ (content-specific date).
2. **FOUNDER.sameAs (LND-9)**: nested founder Person node now carries `sameAs: ORG_SAME_AS` (shared const by reference — URL dedupe guarantees no authoritativeness double-count; +2 expertise).
3. **Case Study section (LND-16)**: H2 "Case Study: ¿Cómo mejoramos el GEO Score de nuestro propio sitio?" (ends in "?", contains "Case Study") between the comparison table and the FAQ, 2 neutral-Spanish paragraphs (90 words, 50-200 band), verified numbers only (14 URLs, 55 vs 57 vs 42.4, 47→62, 2026, 6 engines, <30s).
4. **Changelog section (LND-17)**: H2 "Changelog" + `<ul>` with the three real engine versions in semver (v3.1.0/v3.0.0/v2.0.0, 22/20/17 words per line; block 59 words in the 50-200 band).
5. **PLATFORMS descriptions (LND-4)**: six card `desc` fields rewritten to 2-4 sentences, 52-65 words each (50-200 band), answer-first with explicit subject, one honest stat per card matching `STAT_PATTERN` (2026 / %). Platform name/bot/company/H3 titles untouched.

Zero engine changes, no monetization, no source-code modifications in this phase.

## Honest Shortfall (documented, not a defect)

The composite GEO Score may land **67–70**, not the 70+ target: ES-only bodies cap the experience dimension at 15/25 by design (engine E-E-A-T triggers are English-only — `we|i` leads, case phrases, `changelog`/`case study` headings are locked as English loanwords; headings EN + bodies ES). This is a documented design constraint from the proposal, preserved through spec/design/verify. Verified numbers only, never faked.

## Verification Suggestions (non-blocking, carried to close)

- **S-1 (LND-9)**: "No authoritativeness double-count" is proven at the source level (`FOUNDER.sameAs === ORG_SAME_AS` reference identity), but the engine's `sameAsUrls` dedupe itself is not directly unit-tested in this sprint. Non-blocking — the shared-reference mechanism is sound per D2.
- **S-2 (pre-existing)**: `page.tsx:460` coverage branch (the `categoryScores.length > 0` ternary false-branch) remains uncovered — pre-existing and out of scope for this content-only sprint.

## Final-State Facts (from orchestrator, outrank intermediate snapshots)

- PR #71 merged to `develop` via squash at `bd954ce`, branch `feat/sprint-16-score-up` deleted, `develop` pushed.
- `verify-report.md` was created after the last apply commit (untracked); it belongs to this change and is included in the archive commit.
- `.atl/*` caches and `docs/RELEVY-BRAND-BRIEF.md` are pre-existing unrelated files — excluded from the archive commit.
- No merge to `main` (develop is the integration branch; the user merges to main on milestone).

## Spec Sync (delta → canonical)

| Domain | Action | Details |
|--------|--------|---------|
| app-shell | Updated | SHL-11 ADDED (footer author byline, 3 scenarios) |
| landing-page | Updated | LND-13 MODIFIED (byline → global footer `.byline`), LND-9 MODIFIED (founder Person `sameAs` = `ORG_SAME_AS`, 4 scenarios), LND-4 MODIFIED (answer-first 50-200 word descriptions with stats, 4 scenarios), LND-16 ADDED (Case Study, 4 scenarios), LND-17 ADDED (Changelog, 3 scenarios) |

No REMOVED requirements in this change; merge was additive/updating only — no destructive delta, no `(Reason:)`/`(Migration:)` handling needed. Requirements not mentioned in the deltas preserved unchanged.

## Mechanical Copy Evidence

Archival move performed with native shell (`git mv` rejected the untracked source dir → `mv` fallback); pre-move recursive snapshot compared against the archived folder:

```text
$ diff -r <snapshot>/source openspec/changes/archive/2026-09-01-sprint-16-score-up
(no output — byte-identical, exit 0)
```

`archive-report.md` is additive-only (did not exist in the source snapshot) and excluded from the comparison. Diff status 0 is the only passing evidence.

## Engram Traceability

Hybrid persistence: archive report saved to Engram as `sdd/sprint-16-score-up/archive-report` (project `geoaudit`, type architecture, capture_prompt false). Artifacts were read from the OpenSpec filesystem (`openspec/changes/2026-09-01-sprint-16-score-up/` + canonical `openspec/specs/`); no Engram observation reads were required for this phase.

## Roadmap

`docs/SPRINT-ROADMAP.md` updated: Sprint 16 (Score Up) marked complete (develop = `bd954ce` = PR #71, 1066 tests, PASS 6/6 · 22/22, honest shortfall 67-70 documented); Sprint 17 (Close Free: Sentry + brand presence + announce) remains; the "no Stripe" reality preserved (D4: monetization reintroduced only after validation).