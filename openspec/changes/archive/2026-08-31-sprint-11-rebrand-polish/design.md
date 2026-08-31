# Design: Sprint 11 — Rebrand to Relevy + polish

## Technical Approach

String-level rebrand driven by a single shared brand module plus three isolated defects: an IP-based anonymous limiter, a disjoint top3/bottom3 fix, and a free-model legal rewrite. No schema, migration, contract, or routing change.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| Brand source of truth | New `src/lib/brand.ts` exporting `BRAND_NAME="Relevy"`, `BRAND_DOMAIN="relevy.app"`, `SUPPORT_EMAIL="ezefernandezyf@gmail.com"`, `BRAND_DESCRIPTOR="AI Visibility & GEO Audit"`, `BRAND_REPO="https://github.com/ezefernandezyf/relevy"` | Inline literals; constants inside `copy.ts` | `copy.ts` is copy-only (imports a contract type); a brand module is importable by non-copy surfaces (layout, og, pdf, page JSON-LD) without a copy dependency. |
| Logo integration | Keep `Logo` API (`size`, `showWordmark`, `className`, `decorative`); `showWordmark=false` IS the markOnly variant. Mark = user SVG paths injected into `logo.tsx` + `icon.svg`; placeholder mark (navy tile + emerald `R` path) until the SVG arrives | New `markOnly` prop | Existing `showWordmark` already covers it; no call-site churn. |
| Wordmark/tagline | Wordmark "Relevy" only; drop the "AI Visibility Audit" sub-line (brief §3 "sin tagline"). Navbar `aria-label` becomes `"Relevy"` | Keep tagline | Brief mandates no tagline; also simplifies the WCAG label-content-name match. |
| Anonymous limiter | Reuse `createRateLimiter` with `windowMs=30d`, `maxRequests=3`; key `anon:{ip}` namespaced at the call site | New store, rolling window | Fixed window is already guaranteed by `(key, windowStart)` UPSERT + anchored increment. |
| Gate location | `audit-runner.tsx` only, after `runAudit`, `!userId` branch, before render | Pre-check in `actions.ts` | TLM-11 mandates single authoritative increment; `actions.ts` has no IP context. |
| Citability disjunction | Derive `bottom3` from `scored` filtered by `top3` block ids (`Set`), then `byBottom` + `slice(0,3)` | Independent sorts (current bug) | Guarantees disjoint lists for any block count; <3 complement → fewer bottoms. |
| Legal copy | Rewrite `LEGAL_COPY.terms[2]` + `privacy[1]`; keep section numbering (user decision) | Renumber sections | Renumbering touches tests/nav anchors; user opted to preserve numbering. |

## Data Flow — anonymous limit

```
runAudit(url) ──▶ auth() ──┬─ userId? ──▶ checkTierLimit ──▶ persist (existing)
                            └─ !userId ──▶ headers() ──▶ resolveClientKey ──▶
                                key = `anon:${ip}` ──▶ anonLimiter.check(key)
                                ├─ allowed ──▶ render report (no persist)
                                └─ blocked ──▶ AnonymousLimitState (new copy)
```

`check()` is increment + decision in one call: over-budget returns `allowed:false` WITHOUT incrementing (matches `createRateLimiter`), so "3rd allowed, 4th blocked" and "exactly one increment per completed audit" both hold. Concurrency slightly over-admits (read-then-increment), identical to the existing burst limiter — accepted. `peek()` deferred (unused).

## File Changes

| File | Action | Change |
|---|---|---|
| `src/lib/brand.ts` | Create | Brand/email/domain/repo constants |
| `src/lib/rate-limit/index.ts` | Modify | +`ANON_AUDIT_WINDOW_MS`, `ANON_AUDIT_MAX_REQUESTS`, `getAnonymousAuditLimiter()` singleton |
| `src/report/audit-runner.tsx` | Modify | Anonymous branch: `headers()` + `anon:{ip}` check + new limit state |
| `src/lib/copy.ts` | Modify | ~15 brand refs → `BRAND_NAME`, email → `SUPPORT_EMAIL`, legal §3/§1 rewrite, + anonymous limit copy |
| `src/citability/index.ts` | Modify | Disjoint top3/bottom3 (complement of top3 ids) |
| `src/ui/logo.tsx`, `src/app/icon.svg` | Replace | Relevy mark (placeholder until user SVG) |
| `src/ui/navbar.tsx`, `footer.tsx` | Modify | wordmark/aria, `© Relevy`, mailto → `SUPPORT_EMAIL` |
| `src/app/layout.tsx`, `page.tsx`, `share/[token]/page.tsx`, `score-hero-evidence.ts` | Modify | title template, JSON-LD `name`/`url`/`sameAs`, GitHub link, share wordmark, stale TODO |
| `src/lib/og.ts`, `src/pdf/report-template.ts`, `src/app/api/report/[id]/pdf/route.ts` | Modify | `siteName`/`alt`, PDF title/brand, filename `relevy-{id}.pdf` |
| `src/report/presenters/types.ts`, `next.config.ts`, `vitest.config.ts`, `globals.css` | Modify | stale comment, config comments, plugin name |
| `public/llms.txt`, `README.md`, `AGENTS.md`, `.env.example` | Modify | brand/domain, `NEXTAUTH_URL`+`NEXT_PUBLIC_APP_URL`, 10/30d claim |
| `src/test/a11y-helpers.ts` | Modify | brand-link aria-label assertion (easy miss) |
| `scripts/scorehero-verify*` | Modify | dogfooding domain (coordinated with redeploy) |
| 9 test files | Modify | brand/email/domain assertions |

`findings.ts` and `report-template.ts` are **passive consumers** — no code change; they render disjoint lists once the engine emits them.

## Interfaces / Contracts

```ts
// brand.ts
export const BRAND_NAME = "Relevy";
export const SUPPORT_EMAIL = "ezefernandezyf@gmail.com";
export const BRAND_DOMAIN = "relevy.app";
export const BRAND_DESCRIPTOR = "AI Visibility & GEO Audit";
export const BRAND_REPO = "https://github.com/ezefernandezyf/relevy";

// rate-limit/index.ts
export const ANON_AUDIT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const ANON_AUDIT_MAX_REQUESTS = 3;
export function getAnonymousAuditLimiter(): Promise<RateLimiter>;
```

No Zod contract changes. `CitabilityResult` (`top3: string[]`, `bottom3: string[]`) unchanged.

## Testing Strategy

| Layer | What | Approach (TDD) |
|---|---|---|
| Rename | brand constant exposed, no drift | `brand.test.ts` asserts values; grep gate in verify |
| Rename | surfaces say Relevy | Update `copy/og/navbar/footer/logo/page/layout/crawl-assets/profile` tests to expect `BRAND_NAME` |
| Limiter | 3/30d, namespace isolation, kill switch | Extend `rate-limit/index.test.ts`; assert `anon:1.2.3.4` ≠ `1.2.3.4`; fixed-window via fake timers |
| Runner | anonymous gate increments once, blocks 4th, signed-in unaffected | Extend `audit-runner.test.tsx`: mock `headers`, assert `check("anon:...")` called once, `AnonymousLimitState` renders, no persist |
| Citability | disjoint top3/bottom3 | New ≤5-block fixtures (`page-three-blocks.html`, `page-four-blocks.html`); assert 3+0, 3+1, 3+2, and no id overlap |

## Threat Matrix

`N/A` — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration. Rollback per work unit (each PR atomic): delete `getAnonymousAuditLimiter()` call to restore; citability is a pure reorder; brand constants are isolated.

## Open Questions

- [ ] Placeholder mark default if user SVG not ready at apply (proceed vs hold WU2).
- [ ] `scripts/scorehero-verify*` domain: switch to `relevy.app` now or after DNS + redeploy.

## Key Learnings

1. The `createRateLimiter.check()` method both increments and decides, returning allowed without incrementing when over budget, so a single call satisfies the anonymous gate's one-increment-per-completed-audit requirement.
2. The fixed-window anchoring already works via the Prisma UPSERT on composite key and windowStart-anchored increments, so the anonymous limiter needs no store or schema changes.
3. The citability fix changes only the engine, because findings and PDF templates consume the disjoint string lists from the unchanged shared contract.
4. Brand strings also live in non-test helpers like a11y-helpers.ts and test-only DATABASE_URL strings in prisma.test.ts, which must be excluded from the rename grep gate.
5. The existing five-blocks fixture actually contains six blocks, so genuine sub-six-block fixtures are required to prove the disjoint top3/bottom3 fix.
