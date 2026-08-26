# Design: Sprint 9 — Audit Calibration (Dogfooding + GEO Score v2.0.0)

## Technical Approach

Two independent threads, one cleanup batch. (1) **Dogfooding fix (WU-1)**: make the landing pass its own engine and close A3.2 with a real verified run. (2) **Recalibration (WU-2 → WU-3)**: diagnose the score crush with data, then soften rubrics (option b) + re-balance weights (option c) and bump `scoringModelVersion` to `2.0.0`. WU-4 is a standalone code-audit cleanup. Each WU ships as an atomic revertible PR.

## Architecture Decisions

| Area | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| JSON-LD | Inline `<script type="application/ld+json">` rendered server-side in `src/app/page.tsx` | Client-side JS injection; JSON-LD component with `dangerouslySetInnerHTML` | `extractJsonLd` selects `script[type="application/ld+json"]` and the schema rubric awards "server_rendered" only when blocks appear in the static HTML source. A server component inline block satisfies both |
| Schemas emitted | `Organization` + `WebSite` (+`potentialAction` SearchAction) + `sameAs[]`; optional `FAQPage` from the pricing FAQ | Organization only; full 12-type set | LND-9 requires name/url/sameAs; SearchAction unlocks schema criterion 5 (+5); `sameAs` feeds both schema criterion 2 and E-E-A-T authority |
| robots.txt + sitemap.xml | `app/robots.ts` + `app/sitemap.ts` | `public/` static files | App Router metadata routes are the idiomatic Next 15 convention; `sitemap.ts` derives URLs programmatically |
| llms.txt | `public/llms.txt` (served at `/llms.txt`) | `app/llms.txt` route handler | `probeSite` issues a HEAD to `${origin}/llms.txt`; `public/` answers HEAD directly. Standard `# section` + links format |
| A3.2 evidence | Real `pnpm verify:scorehero` post-fix run → copy `GeminiView` (totalScore + band + `categoryScores`) into `SCOREHERO_EVIDENCE`, set `auditDate` | Placeholder; hide breakdown | LND-7: verified evidence, never invented. Show the honest score with its band AND the category breakdown (the page already gates it on `categoryScores.length > 0`) — the dogfooding story is on-brand, not hidden |
| Diagnostic (WU-2) | Port the `diag/scorehero-breakdown` script (13 URLs + `categories` field + per-category printing) into `scripts/scorehero-verify.test.ts` | One-off throwaway branch | Makes the breakdown reproducible for post-calibration re-validation; `verify:scorehero` remains the single command |
| Calibration | **(b) soften rubrics + (c) re-balance** | (a) re-map bands as inflation (rejected) | Honest bands stay 90/75/60/40; credit moves into rubrics, not thresholds |
| v2 weights | citability **28** / eeat **24** / technical **20** / schema **14** / platform **14** (=100) | keep 31.25/25/18.75/12.5/12.5 | Citability stays dominant; falls within WU-2 ranges. Exact numbers confirmed by WU-2 decision |
| Weight constant | Add `GEO_SCORE_V2_WEIGHTS`; keep `SPRINT_1_WEIGHTS` for historical tests | Delete SPRINT_1_WEIGHTS | Preserves the "no silent pre-decision weights" scenario (RGS-1) and keeps legacy tests meaningful |
| CSP | `Content-Security-Policy-Report-Only` first, pragmatic directives, then enforce | Enforce immediately | SHL-7: report-only before enforce. Tailwind inline `style` attrs (score-bar width) need `style-src 'unsafe-inline'` |

## Data Flow

```
pnpm verify:scorehero
  └─ runAudit × 13 URLs → toGeminiViewModel → { totalScore, categoryScores[] }
       └─ console: url | crawler/citability/content/schema/platform
            └─ USER reviews table → decision (b+c + target weights)
                 └─ implement rubrics + weights.ts + z.literal("2.0.0") + fixture + delta spec
                      └─ update exact-score tests → pnpm test green
                           └─ re-run diag → confirm best real sites land 60-75+
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/app/page.tsx` | Modify | Inline Organization+WebSite JSON-LD; hero/feature copy answer-first with stats |
| `src/app/score-hero-evidence.ts` | Modify | Replace placeholder with real `GeminiView` + `auditDate` + `categoryScores` (A3.2) |
| `src/lib/copy.ts` | Modify | `LANDING_COPY` hero/features → citable passages (definition + `%`/`$`/year stats) |
| `app/robots.ts`, `app/sitemap.ts` | Create | Allow GPTBot/OAI-SearchBot/ClaudeBot/Anthropic-AI/PerplexityBot/Google-Extended/Googlebot/Bingbot; list public routes |
| `public/llms.txt` | Create | `# GeoAudit` summary + links to `/`, `/pricing`, `/terms`, `/privacy` |
| `scripts/scorehero-verify.test.ts` | Modify | Fold in diag branch: 13 URLs + `categories` + per-category print |
| `src/scoring/weights.ts` | Modify | Add `GEO_SCORE_V2_WEIGHTS` (v2.0.0, 28/24/20/14/14) |
| `src/lib/contracts/audit-result.ts` | Modify | `z.literal("1.0.0")` → `z.literal("2.0.0")` (line 88) |
| `src/audit/index.ts` | Modify | Literal casts at 205/366/474; import V2 weights |
| `src/report/presenters/toGeminiViewModel.ts` | Modify | `ENGINE_WEIGHT` from V2 weights |
| `src/citability/scorer.ts`, `src/citability/constants.ts` | Modify | Partial-credit tiers (answer/structure/stats) |
| `src/eeat/authoritativeness.ts` | Modify | Partial authority credit (citations without sameAs; sameAs without authority hits) |
| `src/schema/index.ts` | Modify | Intermediate points in 12-criterion rubric |
| `next.config.ts` | Modify | `async headers()`: CSP(report-only→enforce) + HSTS + X-Content-Type-Options + Referrer-Policy |
| `src/dashboard/dashboard-empty-state.tsx` | Modify | Consume `DASHBOARD_COPY.empty` (neutral) |
| `src/ui/score-bar.tsx` | Modify | `aria-label` on progressbar; `/100` color → `#64748b` |
| `src/billing/pricing-cards.tsx` | Modify | "Recomendado" badge bg → `#047857` |
| `src/ui/navbar.tsx` | Modify | Brand `aria-label` → "GeoAudit — AI Visibility Audit" |
| `README.md`, `.env.example`, `AGENTS.md` | Modify | Real README; stale comments; GitHub-only auth |
| `openspec/specs/geo-score-calculator/spec.md` | Modify | Delta RGS-1/RGS-5/RGS-7 v2.0.0 |

## Interfaces / Contracts

`scoringModelVersion` bump (`"1.0.0"` → `"2.0.0"`) must propagate to **every** reader of the literal and of `SPRINT_1_WEIGHTS`:

- Literal: `audit-result.ts:88` · casts: `audit/index.ts:205,366,474`
- Fixture: `src/lib/contracts/__fixtures__/audit-result.ts:92`
- Weight adapter: `toGeminiViewModel.ts:48-53` (`ENGINE_WEIGHT`)
- Tests asserting version/composite: `contracts/__tests__/audit-result.test.ts:42,83-86`, `scoring/__tests__/calculator.test.ts` (all `SPRINT_1_WEIGHTS` refs + `:210-226`), `audit/__tests__/run-audit.test.ts:96,115,139`
- PDF/presenters/share do **not** read the literal directly — they derive weights via `ENGINE_WEIGHT`, already covered above. No Prisma schema change.

The contract's `meta.auditVersion` stays `z.string()` (fixture value `"1.0.0"` is a pre-existing inconsistency with `AUDIT_VERSION = "0.1.0"`, out of scope).

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit (rubrics) | Partial-credit tiers return intermediate points | New RED tests per RCI-3/5/6, REE-3, RSC-13 scenario; update existing exact-score asserts |
| Unit (scoring) | v2 weights composite + version | Update `calculator.test.ts`/`run-audit.test.ts` to `"2.0.0"` + new weights; keep "all engines 80 → 80" and "sum = 100" invariants |
| Unit (UI) | Neutral empty state | New test renders `DashboardEmptyState` and asserts `DASHBOARD_COPY.empty` (no "hiciste"/"Ejecutá"); fix the constant-vs-component gap |
| Contract | Literal rejects `1.0.0`/`0.9.0` | Update `audit-result.test.ts` |
| E2E | Headers + a11y | Assert CSP(report-only)/HSTS present; axe passes on landing/pricing/report |
| Manual | Post-calibration discrimination | `pnpm verify:scorehero` → best real sites 60-75+ |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No DB migration. WU-1/WU-4 touch static assets, UI and config only (localized revert). WU-3 rollback = restore `z.literal("1.0.0")`, `SPRINT_1_WEIGHTS`, and the old rubrics. CSP ships report-only; enforce only after zero breakage on landing/report.

## Open Questions

- [ ] Exact v2.0.0 weight numbers — finalized by the WU-2 diagnostic decision (default: 28/24/20/14/14).
- [ ] Post-fix landing score before calibration — confirm WU-1 fixes alone clear 50+, then re-run after WU-3 for the final A3.2 number.
- [ ] Whether to fix the `meta.auditVersion` fixture inconsistency (`"1.0.0"` vs `"0.1.0"`) in this sprint or defer.
