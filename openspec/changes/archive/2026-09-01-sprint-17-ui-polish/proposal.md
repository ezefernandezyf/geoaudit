# Proposal: Sprint 17 — UI Polish

## Intent

Sprint-16 closed with four production-quality gaps: PDF export 404s in production (chromium pack URL), a mobile menu whose hamburger lives left and whose panel breaks under the header's `backdrop-blur-md` containing block, a landing with four consecutive gray sections reading as monotonous, and a schema engine still flagging 4 `missing_recommended` Organization properties. Fix all four with real data and minimal diff — no engine, no scoring changes.

## Scope

### In Scope
- PDF: arch-derived chromium pack URL resolver + pinned unit test (kills prod 500 `render_failed`)
- Navbar: `MobileMenu` island — toggle on the right, right-side drawer portaled to `document.body`, a11y contract (Escape / overlay-close / focus-return); `NavLinks` becomes desktop-only
- Landing: alternating gray/white bands + targeted `rounded-2xl` recuadros; eyebrows on gray bands bumped `#64748b` → `#475569`
- JSON-LD: add `areaServed`, `industry`, `numberOfEmployees` (real values only); `award` omitted — no real award exists

### Out of Scope
- Engine scoring / rúbricas (`schema-engine`, `scoring` untouched)
- Monetization/Stripe; external brand presence (Wikipedia/Wikidata → sprint-18)
- Desktop navbar redesign; existing landing headings; modal drawer (focus trap, page inert)

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `pdf-export` (PDF-4 delta): production pack URL MUST resolve by `process.arch` — x64 → `chromium-v149.0.0-pack.x64.tar`, arm64 → `...-pack.arm64.tar`; unknown arch MUST throw typed error
- `app-shell` (SHL-10 delta): toggle MUST render in the navbar's right container below `md`; drawer + overlay MUST portal to `document.body`; drawer MUST close on Escape/overlay click and return focus to the toggle; closed drawer MUST be `aria-hidden` + `inert`
- `landing-page` (LND-9 delta + ADDED LND-18): Organization JSON-LD MUST add `areaServed`/`industry`/`numberOfEmployees` with real values and MUST NOT invent `award`; LND-18: no two adjacent sections MAY share a background; platforms grid MUST keep exactly 6 `div.rounded-xl` (new recuadros `rounded-2xl`); comparison table parent MUST stay `overflow-x-auto`

## Approach

- **PDF**: replace `CHROMIUM_PACK_URL` with exported `resolveChromiumPackUrl(arch = process.arch)`; pin both branches in `render.test.ts` (existing tests inject `deps.launch` — zero breakage).
- **Hamburger**: `MobileMenu` client island owns `open`; Navbar renders toggle (`md:hidden`) in the right container. `createPortal` drawer+overlay to body (header `backdrop-blur-md` is a containing block for `fixed`). Drawer `fixed right-0 top-0 h-dvh w-80 max-w-[85vw]`, `translate-x-full ↔ 0` + opacity (~250ms), always mounted with `inert` closed; `prefers-reduced-motion` → instant. Migrate 5 mobile tests → `mobile-menu.test.tsx` using `screen`/`document.body` (portal breaks `container.querySelector`).
- **Landing rhythm** (breaks S5→S5b→S6→S7 gray run): S3 gray (keep) · S4 → gray band + white `rounded-2xl` recuadro around the grid (cards keep `bg-[#f8fafc] rounded-xl` ×6) · S5 → `border-y bg-white` band (user's "¿Por qué Relevy…?" gets otro fondo) · S5b → gray + white `rounded-2xl` recuadro · S6 → `border-y bg-white` · S7 gray (CTA recuadro exists). Table wrapper untouched; eyebrows on gray → `#475569` (white bands keep `#64748b`, 4.76:1).
- **JSON-LD**: constants in `brand.ts` (`ORG_AREA_SERVED: "AR"` — matches `BRAND_ADDRESS`; `ORG_INDUSTRY: "Software"`; `ORG_EMPLOYEES: 1`), referenced from `OrganizationJsonLd`. `award` omitted — engine keeps the warning; inventing one violates LND-7.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pdf/render.ts` | Modified | Constant → `resolveChromiumPackUrl(arch)` |
| `src/pdf/__tests__/render.test.ts` | Modified | +2 tests pinning arch branches |
| `src/ui/mobile-menu.tsx` | New | Toggle + portaled drawer island |
| `src/ui/navbar.tsx` | Modified | Toggle in right container |
| `src/ui/nav-links.tsx` | Modified | Desktop-only; drops `open`/panel |
| `src/ui/__tests__/{nav-links,mobile-menu}.test.tsx` | Modified/New | 5 mobile tests migrate |
| `src/app/page.tsx` | Modified | Section backgrounds + JSON-LD |
| `src/lib/brand.ts` | Modified | +3 org constants |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Portal drawer breaks RTL container queries | Med | Migrate tests to `screen`/`document.body`; closed state `aria-hidden`+`inert` keeps a11y green |
| Unknown arch on Vercel | Low | Typed error; only x64/arm64 exist at v149 |
| Platforms `rounded-xl` count (test-pinned) | Med | Recuadros `rounded-2xl` only; card grid untouched |
| JSON-LD values misstate reality | Med | Values confirmed in Open Questions before spec; `award` omitted |

## Rollback Plan

Per-item git revert of the change's commits (CSS classes, constants, components only — no DB, no migrations, no engine). PDF alone: restore the previous constant (one line).

## Dependencies

None — `createPortal` is `react-dom`; no new packages.

## Success Criteria

- [ ] PDF: resolver returns arch-correct URL; pinned tests green; prod export no longer 500s (Vercel preview smoke)
- [ ] Mobile: toggle right below `md`; drawer slides from right; Escape/overlay close; focus returns; 5 migrated + 8 navbar tests green
- [ ] Landing: no adjacent same-bg sections; `page.test.tsx` LND-2 + platforms/table constraints green; eyebrow ≥ AA on gray
- [ ] JSON-LD: 3 real props present, no invented `award`; `missing_recommended` drops 4 → 1

## Open Questions

1. `ORG_INDUSTRY` exact string: "Software" vs "Internet Software"?
2. `ORG_EMPLOYEES: 1` assumes solo founder, no contractors — confirm?
3. `areaServed: "AR"` country-level — confirm (vs "AR-C" province)?
4. Accepted tradeoff: `missing_recommended` warning for `award` persists (honesty > score) — confirm before spec.