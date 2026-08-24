# Tasks: Sprint 6 — UI Redesign

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1350 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 4 chained PRs (U1→U4) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| U1 | Primitivas + lucide-react | PR 1 (base: tracker) | `pnpm test src/ui` | `pnpm dev` — home anónima | Revert PR 1; `src/ui/` + `package.json` |
| U2 | Landing + login/signup | PR 2 (base: PR 1) | `pnpm test src/app` | `pnpm dev` — landing → audit flow | Revert PR 2; `app/layout.tsx` + `app/page.tsx` |
| U3 | Report/dash/share | PR 3 (base: PR 1) | `pnpm test src/report src/dashboard` | `pnpm dev` — audit real + detalle | Revert PR 3; `src/report/` + `src/dashboard/` |
| U4 | Pricing + multi-page | PR 4 (base: PR 3) | `pnpm test src/billing src/report` | `pnpm dev` — /pricing + multi-page | Revert PR 4; `src/billing/` + `multi-page-report` |

Dependencies: U2, U3, U4 depend on U1 (ScoreBar, Card noPadding, Button variants, shell). Tests broken by restyle are updated in the same unit (never left red).

## Work Unit 1 — Primitives (base)

- [x] U1.1 `package.json`: add lucide-react dep (DNF-10)
- [x] U1.2 RED button test: emerald/danger variants, size lg, icon slot (DNF-7)
- [x] U1.3 `button.tsx`: add emerald/danger, size lg, `icon` slot
- [x] U1.4 RED card test: `noPadding` prop (DNF-6)
- [x] U1.5 `card.tsx`: add `noPadding`, rounded-xl/p-6 tokens
- [x] U1.6 RED text-field test: `leftIcon`/`helperText` (DNF-8)
- [x] U1.7 `text-field.tsx`: add `leftIcon`/`helperText`
- [x] U1.8 RED score-bar test: width=score%, fill=severityForScore, progressbar aria (DNF-9)
- [x] U1.9 `score-bar.tsx`: create 0-100 primitive (severityForScore fill)
- [x] U1.10 RED navbar/footer tests: anon vs auth, logo→/, Precios→/pricing (SHL-2/3/4)
- [x] U1.11 `navbar.tsx` + `LogoutButton` (client) + `footer.tsx`: create (SHL-2/3/4, DNF-10)

## Work Unit 2 — Landing + Auth (depends U1)

- [x] U2.1 `layout.tsx`: wrap children in Navbar + Footer (SHL-1)
- [x] U2.2 RED landing test: AuditForm→auditAction, 5 domains, bands, 6 platforms (LND-1..5)
- [x] U2.3 `page.tsx`: replace with full landing (hero, domains, bands, platforms, teaser)
- [x] U2.4 RED login/signup tests: GitHubAuthCard + callbackUrl preserved (ATH-1/2)
- [x] U2.5 `login|signup/page.tsx`: restyle shell, keep GitHubAuthCard/error

## Work Unit 3 — Report + Dashboard + Share (depends U1)

- [x] U3.1 RED platform-matrix test: 6 rows perPlatform+perBot, Claude "No medido" (ADP-6)
- [x] U3.2 `platform-matrix.tsx`: create pure derivation (PLATFORM_ROWS)
- [x] U3.3 RED stage-stepper test: timer advance, no engine state claim (ARU-10)
- [x] U3.4 `stage-stepper.tsx`: create client stepper
- [x] U3.5 `domain-scorecard.tsx`: use ScoreBar, update its test (ARU-8)
- [x] U3.6 `audit-report.tsx`: compose PlatformMatrix + mono findings (ARU-8, ADP-4/7)
- [x] U3.7 `report-skeleton.tsx`: add StageStepper, role=status, motion-safe (ARU-3)
- [x] U3.8 `dashboard/page.tsx`: aggregate hero (DSH-8) + CSS-only trend (DSH-2)
- [x] U3.9 `audit-history-table.tsx`: restyle + client search filter (DSH-1/9)
- [x] U3.10 RED share-modal test: copy/revoke reuse actions, PRO-gate (SHR-3/7)
- [x] U3.11 `share-modal.tsx` + detail "Compartir" opens modal + share page restyle (ADP-8, SHR-7)

## Work Unit 4 — Pricing + Multi-Page (depends U1)

- [x] U4.1 RED pricing test: monthly only, no toggle/-17% (PRC-5)
- [x] U4.2 `pricing-cards.tsx`: monthly restyle, keep checkout/portal (PRC-1)
- [x] U4.3 `pricing/page.tsx`: restyle three plans
- [x] U4.4 `multi-page-report.tsx`: rows with ScoreBar + SeverityBadge (MPA-10)
