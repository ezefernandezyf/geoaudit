# Tasks: Sprint 7 — UI Fidelity

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~3100–3850 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 6 chained PRs (U1→U6) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| U1 | Primitivas+logo+shell | PR 1 (base=tracker) | `pnpm test src/ui src/app` | `pnpm dev` + navbar/footer | Revert `src/ui/*`, `icon.svg`, `globals.css` |
| U2 | Landing+auth+copy | PR 2 (base=PR1) | `pnpm test src/app src/lib` | `pnpm dev` + `/` y `/login` | Revert `page.tsx`, auth pages, `copy.ts` |
| U3 | Pricing+FAQ | PR 3 (base=PR2) | `pnpm test src/billing` | `pnpm dev` + `/pricing` | Revert `pricing-cards.tsx` + pricing page |
| U4 | Dashboard+perfil+legal | PR 4 (base=PR3) | `pnpm test src/dashboard src/app` | `pnpm dev` + `/dashboard` + profile | Revert dashboard/profile/terms/privacy |
| U5 | Report+adapter (núcleo) | PR 5 (base=PR4) | `pnpm test src/report` | `pnpm dev` + `audits/[id]` + `/share/[token]` | Revert `presenters/`, `report/*`, detail/share |
| U6 | Multi-page UI | PR 6 (base=PR5) | `pnpm test src/app src/report` | `pnpm dev` + `/multipage` | Revert `multipage/*`, form, navbar link |

## U1 — Primitivas + logo + shell (Dep: —)

- [x] U1.1 `globals.css`: hex directos (DNF-9), alias `--font-serif` (DNF-10), keyframes `pulse` + `prefers-reduced-motion` (DNF-11) + test
- [x] U1.2 `src/ui/button.tsx` verbatim Gemini: variants/sizes, `isLoading`→`Loader2` spin + disabled + `aria-busy` (DNF-7) + test
- [x] U1.3 `src/ui/card.tsx` verbatim: `default|muted|highlight`, `noPadding`, sin slots header/footer (DNF-9) + test
- [x] U1.4 `src/ui/text-field.tsx`: label uppercase `tracking-wider`, `useId`, error/helperText/leftIcon/rightElement/hideLabelVisually, slot error `min-h-[18px]` (DNF-9) + test
- [x] U1.5 `src/ui/severity-badge.tsx` verbatim: lowercase band, props `score`/`dot`/`size`/`labelOverride` (DNF-5) + test
- [x] U1.6 `src/ui/score-bar.tsx`: color por `category.status` (band real 90/75/60/40), `onClick`/`isInteractive` (DNF-9) + test
- [x] U1.7 `src/ui/skeleton.tsx` + `AuditReportSkeleton`: variants rectangular/circular/text, width/height/label (DNF-11) + test
- [x] U1.8 `src/ui/logo.tsx` SVG G serif + onda emerald + globo + wordmark, `size?`; `app/icon.svg` favicon (DNF-12) + test
- [x] U1.9 `src/ui/navbar.tsx`: active route (`usePathname`), plan pill, user chip + logout, logo (SHL-1..4) + test
- [x] U1.10 `src/ui/footer.tsx`: links `/terms` + `/privacy` (SHL-5, LGL-5) + test
- [x] U1.11 Reescribir asserts token→hex en `src/ui/__tests__` (10 archivos)
- [x] U1.12 Actualizar `STYLE-BRIEF.md` a hex directos (risk 6)

## U2 — Landing + auth + copy neutro (Dep: U1)

- [x] U2.1 `src/lib/copy.ts`: `COPY` tipado central, voseo→neutro (AUDIT_FORM_ERRORS, FETCH_ERROR_COPY, share-modal, AUTH_COPY, landing) (ATH-9, LGL-4) + test string
- [x] U2.2 `url-policy.ts` + `fetch-error-copy.ts` importan de `copy.ts` (source-of-truth) + test
- [x] U2.3 `app/page.tsx` hero: badge "GEO Engine" (LND-5) + isla `AuditForm` con botón DENTRO del input + sample URLs prefill (LND-1) + test
- [x] U2.4 cards 01-05 contrastados, card 03 navy `#0f172a` + número emerald (LND-2) + test
- [x] U2.5 ScoreHero demo + tabla bandas reales 90/75/60/40 (LND-3) + test
- [x] U2.6 seis plataformas (LND-4) + CTA pricing + test
- [x] U2.7 `app/login`: card centrada Gemini, "Continuar con GitHub", link "Inicie sesión" (ATH-6,8,9) + test
- [x] U2.8 `app/signup`: card + beneficios + copy neutro (ATH-6,7,9) + test
- [x] U2.9 `src/ui/github-auth-card.tsx` restyle Gemini + test
- [x] U2.10 Reescribir tests landing/auth/copy (token→hex, voseo→neutro)

## U3 — Pricing + FAQ (Dep: U1, U2)

- [x] U3.1 `src/billing/pricing-cards.tsx`: Pro destacada (borde emerald + badge "Recomendado" + scale), SOLO mensual sin toggle (PRC-5,6) + test
- [x] U3.2 `app/pricing/page.tsx`: cards + FAQ facturación (ciclo/cancelación/cambios) (PRC-7); `checkoutAction`/`portalAction` intactos + test
- [x] U3.3 Reescribir tests pricing (token→hex)

## U4 — Dashboard + perfil + términos (Dep: U1–U3)

- [x] U4.1 `app/dashboard/page.tsx`: runner bar (input + "Run Audit" dentro + user chip) (DSH-8) + test
- [x] U4.2 grid 12-col: Aggregate `col-4` + Trend `col-8` misma fila, 12 barras CSS puras (DSH-9) + test
- [x] U4.3 `src/dashboard/audit-history-table.tsx`: header bar + chip Multi-Page + refresh + fila "SCANNING..." (DSH-10,11) + test
- [x] U4.4 restyle Gemini de `src/dashboard/*` (aggregate-hero, score-trend, share-modal, billing-cta, empty-state) + test
- [ ] U4.5 `app/dashboard/profile`: nombre/email/tier/uso "4/10", portal PRO o CTA upgrade, soporte (PRF-1..6) + test
- [ ] U4.6 `app/terms` RSC estático, shell Gemini, copy neutro (LGL-1,3,4) + test
- [ ] U4.7 `app/privacy` RSC estático (LGL-2,3,4) + test
- [ ] U4.8 Reescribir tests dashboard/profile/legal (token→hex, voseo→neutro)

## U5 — Report/detail/share/live + adapter (Dep: U1–U4) — EL CORAZÓN

- [ ] U5.1 `src/report/presenters/types.ts`: GeminiBand/CategoryScore/Finding/PlatformRow/GeminiView (APT-1) + test shape
- [ ] U5.2 `toGeminiViewModel.ts`: score+band lowercase real, title fallback, summary real, durationSeconds, categoryScores[5]=rowScore+weights, shareToken (APT-2..6,9,10) + test fixtures
- [ ] U5.3 `findings.ts`: deriveFindings citability top3/bottom3 + schema.issues + perBot bloqueados; codeSnippet solo `schema.generated`; impactScore null (APT-7,10) + test
- [ ] U5.4 `platforms.ts`: 6 filas, Claude `readiness:null` + access `Claude-Web` (APT-8) + test
- [ ] U5.5 `report/score-hero.tsx`: hero completo + benchmark bar umbrales reales (ARU-11) + test
- [ ] U5.6 `domain-scorecard` + `top-findings` + `report-meta`: presentadores puros del view model (ARU-10) + test
- [ ] U5.7 `report/platform-matrix.tsx`: 6 plataformas, Claude "No medido" (ARU-12) + test
- [ ] U5.8 `report/audit-report.tsx`: consume `toGeminiViewModel`, RSC/Suspense/error intactos (ARU-10) + test
- [ ] U5.9 `app/dashboard/audits/[id]`: hero + scorecard 5 + matriz 6 col + findings con código real (ADP-6) + ShareModal Gemini con acciones reales (ADP-7) + Export PDF gated PRO (ADP-8) + test
- [ ] U5.10 `app/share/[token]`: pill "Verificado" + token ID + footer CTA (SHR-7..9) + test
- [ ] U5.11 `app/report` live: `StageStepper` animado (spinner + progress + círculos numerados) + `AuditReportSkeleton`, sin simulación + test
- [ ] U5.12 Reescribir tests report/detail/share (view model, token→hex, voseo→neutro)

## U6 — Multi-page UI (Dep: U5)

- [ ] U6.1 `report/multi-page-form.tsx`: `useActionState` + `multiPageAuditAction` real, gate PRO con CTA (MPU-1,2), error codes neutros (MPU-3) + test
- [ ] U6.2 `app/multipage/page.tsx`: selector rutas + inspector Gemini, datos reales, omitir schemaFound/crawlTimeMs/status (MPU-4,5; MPA-10,11) + test
- [ ] U6.3 `report/multi-page-report.tsx`: presenter de `MultiPageResult` (MPA-10,11) + test
- [ ] U6.4 navbar link multi-page (MPU-6) + test
- [ ] U6.5 Reescribir tests multipage (token→hex)

## Notas

- Threat matrix: N/A (sin routing nuevo ni subprocess; acciones existentes con gates intactos) → sin RED-test de matriz.
- Negocio intacto: `src/audit/`, `src/scoring/`, `src/lib/audit/` (orquestación), auth, billing, PDF no se tocan.