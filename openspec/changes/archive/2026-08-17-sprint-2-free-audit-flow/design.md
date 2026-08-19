# Design: Sprint 2 — Free Audit Flow

## Technical Approach

Wire existing `runAudit(url, deps)` (301 tests green) into user-facing flow: Server Action validates + redirects — never runs audit (no DB to persist results, would block progress). `/report?url=` async RSC runs `runAudit` under `<Suspense>` with pulse skeleton + error boundary. Five incremental slices (U1→U5) with injectable-deps testing (zero-network). No new business logic.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Action never runs audit | Action = Zod + protocol filter + normalize → `redirect("/report?url=...")` | `runAudit` blocks 10-60s; redirect + RSC gives Suspense/streaming for free. Without DB, results can't persist between action and page. |
| Fixed-window rate limiter | Fixed window with injectable `RateLimitStore` | Simple, predictable. Sliding window adds complexity not justified until tiered limits with DB in Sprint 3. |
| `force-dynamic` on report page | `dynamic = "force-dynamic"`, `runtime = "nodejs"` | `node:dns` SSRF guard requires Node runtime; `searchParams` + async I/O block static prerendering. |

## Data Flow

```
Browser                       Server (Node)                  External
  │                               │                             │
  ├─ POST form ──────────────────►│                             │
  │                               ├─ rateLimit.check(IP)        │
  │                               ├─ Zod urlInputSchema         │
  │                               ├─ protocol filter (http(s))  │
  │                               ├─ normalize http→https       │
  │  ◄── 302 /report?url= ────────┤                             │
  │                               │                             │
  ├─ GET /report?url= ───────────►│                             │
  │                               ├─ validate searchParams.url  │
  │                               ├─ <Suspense>                 │
  │  ◄── loading.tsx (pulse) ─────┤                             │
  │                               ├─ runAudit(url, deps) ──────►│ fetch
  │                               │  ◄── AuditResult ───────────┤
  │  ◄── report RSC ──────────────┤                             │
```

## File Changes

| File | Action | Slice |
|------|--------|-------|
| `STYLE-BRIEF.md` | Create | U1 |
| `src/app/globals.css` | Modify — Tailwind 4 `@theme` tokens | U1 |
| `src/app/layout.tsx` | Modify — fonts (Instrument Serif/Work Sans/JetBrains Mono), remove /dashboard link | U1·U2 |
| `src/ui/skeleton.tsx` | Create — pulse, `role="status"`, `prefers-reduced-motion` | U1 |
| `src/ui/button.tsx` | Create — primary/secondary/ghost, sm/md, loading spinner | U1 |
| `src/ui/text-field.tsx` | Create — `<input type="url">` + `<label>` + error `role="alert"` | U1 |
| `src/ui/card.tsx` | Create — padding, border, rounded, header/footer slots | U1 |
| `src/ui/severity-badge.tsx` | Create — 5 bands → colors + ES labels | U1 |
| `src/ui/score-ring.tsx` | Create — SVG donut: score 0-100 + band color | U1 |
| `src/app/page.tsx` | Rewrite — landing with `<AuditForm>` | U2 |
| `src/lib/audit/actions.ts` | Create — Server Action: validate → redirect | U2 |
| `src/app/report/page.tsx` | Create — async RSC + `<Suspense>` + empty state | U3 |
| `src/app/report/loading.tsx` | Create — skeleton pulse matching layout | U3 |
| `src/app/report/error.tsx` | Create — boundary + "Reintentar" retry | U3 |
| `src/report/audit-runner.tsx` | Create — `runAudit(url)` + catch→copy map | U4 |
| `src/report/score-hero.tsx` | Create — score + band + url + duration | U4 |
| `src/report/domain-scorecard.tsx` | Create — 5-domain rows, mini-bars, chips | U4 |
| `src/report/top-findings.tsx` | Create — top3/bottom3 citability + schema + blocked bots | U4 |
| `src/report/report-meta.tsx` | Create — `meta.errors` display | U4 |
| `src/lib/rate-limit/index.ts` | Create — `createRateLimiter({ store, windowMs, maxRequests })` | U5 |
| `src/lib/rate-limit/store.ts` | Create — `RateLimitStore` interface + `InMemoryStore` (Map) | U5 |

## Key Contracts

```ts
// Rate limiter
interface RateLimitEntry { count: number; windowStart: number }
interface RateLimitStore {
  get(key: string): RateLimitEntry | null;
  increment(key: string, windowStart: number): void;
  reset(key: string): void;
}
type RateLimitResult = { allowed: boolean; remaining: number; resetMs: number }

// Component props (report domain)
type AuditRunnerProps = { url: string }
type ScoreHeroProps = { summary: AuditResult["summary"] }
type DomainScorecardProps = { result: AuditResult }
type TopFindingsProps = { citability: CitabilityResult; schema: SchemaResult; crawlers: CrawlerResult }
type SeverityBadgeProps = { band: SeverityBand }

// FetchErrorCode → ES copy map (ARU-6 handles both union branches)
const FETCH_ERROR_COPY: Record<FetchErrorCode | "unsupported_content_type", string>
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit (RTL) | `AuditForm` — Zod errors, protocol filter, pending state, 429 inline | Render with mock action; assert `role="alert"` messages |
| Unit (RTL) | Report components (`ScoreHero`, `DomainScorecard`, `TopFindings`, `SeverityBadge`) | Render with `auditResultFixture` (valid + degraded); assert scores, "no disponible" chips |
| Unit (pure) | Protocol filter `isAllowedProtocol(url)` | `true` for http/https, `false` for ftp/mailto/etc. |
| Unit (pure) | Rate limiter — window logic, kill switch, store mock | Inject mock `RateLimitStore`; assert under/over limit |
| Integration | `auditAction` with mock limiter | Assert 429 on over-limit, 302 redirect on valid URL |
| Manual | Suspense/streaming, loading pulse, error boundary retry | `pnpm dev` smoke (HARD GATE AGENTS) |

**Not tested**: Streaming (jsdom limitation), `runAudit` (301 tests green Sprint 1), actual fetch (zero-network by design).

## Slice Dependencies (U1→U5)

- **U1** (design foundation): No deps. Ships `STYLE-BRIEF.md`, tokens, all `src/ui/*`, layout fonts. **Blocks all other slices.**
- **U2** (landing + form): Depends on U1 primitives. `page.tsx`, `actions.ts`, layout dashboard-link removal.
- **U3** (report shell): Depends on U1 (Skeleton). Can develop **parallel** to U2.
- **U4** (report render): Depends on U1 + U3. All `src/report/*` components.
- **U5** (rate limiting): Depends on U2 (wire into action) + U4 (error copy map). Kill switch: `RATE_LIMIT_ENABLED=false`.

**Merge order**: U1 → U2 → U3 → (U4 ∥ U5) → final integration smoke.

## Product Decisions Reflected

| D# | Implementation |
|----|---------------|
| D1 (MVP) | Report renders ScoreHero + DomainScorecard + TopFindings + ReportMeta only |
| D2 (re-audit) | `/report?url=` re-runs `runAudit` on every load; mitigated by U5 rate limiter |
| D3 (limiter action-only) | `rateLimit.check(ip)` called in `auditAction` before redirect |
| D4 (silent normalize) | Action normalizes `http→https` pre-redirect; `runAudit` also normalizes |
| D5 (STYLE-BRIEF U1) | `STYLE-BRIEF.md` + tokens created in slice U1 |
| D6 (no dashboard link) | `/dashboard` link removed from `layout.tsx` |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundaries introduced. The Server Action redirects via `next/navigation`; the RSC runs trusted engine code already tested in Sprint 1.

## Migration / Rollout

No migration (no DB). Rollback: revert merge. Rate-limiter kill switch: `RATE_LIMIT_ENABLED=false`.

## Open Questions

- [ ] ARU-9 (AbortSignal on probes): scope to U5 if budget allows (~30 LOC) or defer to Sprint 3.
