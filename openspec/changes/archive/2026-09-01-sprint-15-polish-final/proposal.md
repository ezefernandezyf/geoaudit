# Proposal: Sprint 15 — Polish Final

## Intent

Final polish before project close: 4 UI fixes, copy synced to v3.1.0 weights, PDF discoverability on `/report`, 3 tech debts. No monetization; no engine changes.

## Scope

### In Scope

1. **Benchmark bar inverted** (`score-hero.tsx`): reorder segments L→R — critical 30 → poor 20 → fair 15 → good 15 → excellent 20 (red L, green R); marker/widths/colors unchanged.
2. **Score box clips at 3 digits**: keep `text-6xl/7xl`; stack `/100` under number; relax `min-w`; keep `#047857`.
3. **No mobile menu**: client NavLinks island — hamburger < md + panel (links + actions); Navbar stays sync server (RTL).
4. **Comparison table illegible on mobile**: `overflow-x-auto` + `min-w-[640px]` (platform-matrix pattern); keep semantic `<table>` (RCI-5/RPL-10).
5. **Stale v3.0 weights + long hero**: weights → 24/23/15/12/14/12 (hero/features/FAQ); brand 12 % + "octava parte"; shorten hero subtitle (Open Q); co-update `copy.test.ts:289-323`; keep "24 puntos" (:174), "12 criterios" (:179).
6. **PDF export not discoverable on `/report`**: capture `audit.create` id → `AuditReport` → auth: "Exportar PDF" (→ `/api/report/{id}/pdf`); anon: signup CTA. Route untouched (user-confirmed).
7. **Tech debts**: (a) `index.ts:226` "2.0.0"→"3.1.0" + edge-case test; (b) eslint ignores `coverage/**`; (c) RGS-1 delta (moz 57, relevy 55, avg 42.4, 14-URL corpus); archive immutable.

### Out of Scope

Monetization · PDF route hardening · desktop navbar redesign · scoring engine changes · relevy.app content (sprint-16-score-up).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `landing-page`: v3.1 weights, shorter hero subtitle, responsive table (LND-11/13/14)
- `app-shell`: mobile hamburger menu requirement
- `audit-report-ui`: bar direction critical→excellent, no-clip score box
- `pdf-export`: export entry on live report (auth) + signup CTA (anon)
- `geo-score-calculator`: RGS-1 benchmark ranges refreshed (delta)
- `audit-orchestrator`: degraded invalid-URL write version → 3.1.0

## Risks

- `copy.test.ts` breaks unless co-updated — High. Same change; watch :174/:179.
- 3.1.0 bump breaks edge-case test (pins "2.0.0") — High. Co-update test + RAO-16 comment.
- Hero drops below 50-word LND-11 floor — Med. Keep ≥50 or relax assertion.
- Persisted id missing on DB failure — Low. Render entry only when id exists.

## Rollback Plan

Per-item PR revert (atomic commits). Copy+test and version+test travel together; PDF entry conditional — no data risk.

## Dependencies

None. Co-updates: `copy.test.ts`, `run-audit-edge-cases.test.ts`.

## Success Criteria

- [ ] Score 85 → green marker; 15 → red (all surfaces)
- [ ] 100/100 unclipped on mobile and sm
- [ ] Hamburger < md exposes all actions; md+ unchanged
- [ ] All weights v3.1; `copy.test.ts` green; hero shorter
- [ ] PDF export on logged-in `/report`; anon CTA; PDF route tests green; lint ignores `coverage/`; RGS-1 delta written

## Open Questions

1. Hero subtitle: percentages vs names-only? Recommend names-only (percentages already in features/FAQ).