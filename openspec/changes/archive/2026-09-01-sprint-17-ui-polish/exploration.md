# Exploration — sprint-17-ui-polish

Scope locked by the user (3 items). READ-ONLY exploration of the current state.
Branch: develop @ cc4a6a7 (identical tree to main @ 3c96bad). All paths verified on disk.

---

## 1. Fix PDF export in production

### Current State

- `src/pdf/render.ts:61-62` — `CHROMIUM_PACK_URL` points to:
  `https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.tar`
  (bare pack, no arch suffix).
- Verified with `curl` + GitHub API: release `v149.0.0` has EXACTLY 4 assets —
  `chromium-v149.0.0-pack.x64.tar` (69,642,240 B), `chromium-v149.0.0-pack.arm64.tar`
  (68,239,360 B), plus `chromium-v149.0.0-layer.{x64,arm64}.zip`. The bare
  `...-pack.tar` returns **HTTP 404** — the assets were renamed with an arch suffix.
- The constant is used only at `src/pdf/render.ts:81`:
  `executablePath: await chromium.executablePath(CHROMIUM_PACK_URL)` (production branch of
  `resolveLaunchConfig`; `NODE_ENV !== "production"` uses the bundled `puppeteer` dev dep).
- `chromium.executablePath(input)` (`node_modules/@sparticuz/chromium-min/build/index.js:99-140`):
  - `/tmp/chromium` exists → cached path (per warm instance).
  - input is a valid URL → `downloadAndExtract(url)` (`build/helper.js:101-126`): `fetch(url, { redirect: "follow", signal: AbortSignal.timeout(300_000) })` → tar-extract to `/tmp/chromium-pack` → recursive `executablePath` → inflates `chromium.br`, `fonts.tar.br`, `swiftshader.tar.br` (+ `al2023.tar.br` on AL2023) → returns the binary path.
  - **The URL is used verbatim — the package does NOT append an arch suffix.** A 404 throws
    `Unexpected status code: 404.`, caught by `renderPdf` → `PdfRenderError` → route 500
    `{"error":"render_failed"}`. This matches the reported production failure exactly.
  - `isRunningInAmazonLinux2023` (`helper.js:79-100`) returns true when `VERCEL && nodeMajorVersion >= 20`
    → `setupLambdaEnvironment` sets `LD_LIBRARY_PATH=/tmp/al2023/lib`, `FONTCONFIG_PATH=/tmp/fonts`.
    Both x64 and arm64 packs ship `al2023.tar.br`, so this is not an issue once the URL is correct.
- Vercel architecture: no `vercel.json` and no `functions` config in `next.config.ts`
  → default x86_64 today. A hardcoded `.x64.tar` would work now but breaks silently if the
  project ever enables arm64. Deriving from `process.arch` is the robust fix.

### Test / Engine Impact

- `src/pdf/__tests__/render.test.ts` injects `deps.launch` mocks — it NEVER touches
  `CHROMIUM_PACK_URL`. No test pins the URL. `src/app/api/report/[id]/pdf/__tests__/route.test.ts`
  mocks `@/pdf/render` entirely. **Zero existing tests break by changing the constant.**
- The constant currently has 0% coverage — a unit test pinning the arch→URL mapping is
  recommended (cheap, prevents regression of this exact bug).

### Approaches

1. **Arch-derived URL (recommended)** — replace the constant with a resolver:
   `resolveChromiumPackUrl(arch = process.arch)` returning
   `.../chromium-v149.0.0-pack.x64.tar` for `x64` and `.../chromium-v149.0.0-pack.arm64.tar`
   for `arm64`. Export it and pin both branches in a unit test.
   - Pros: correct today (Vercel x86_64 default) AND future-proof (arm64 functions); testable; minimal diff.
   - Cons: slightly more code than a hardcoded string.
   - Effort: Low.
2. **Hardcode `.x64.tar`** — one-line change.
   - Pros: smallest possible diff.
   - Cons: silently breaks if Vercel architecture changes; untestable (constant only).
   - Effort: Trivial.

### Recommendation

Approach 1 (arch-derived). Keep `CHROMIUM_PACK_URL` export name (or rename to a resolver)
with the exact release assets above. Add a focused unit test asserting both arch branches.

---

## 2. Hamburger to the right + right-side drawer (slide from right)

### Current State

- `src/ui/navbar.tsx:29-126` — sync server component. Header: `sticky top-0 z-40 border-b bg-white/95 backdrop-blur-md`.
  Row `h-16`:
  - LEFT container (`flex items-center gap-6`): brand `Link` (aria-label="Relevy") + `<NavLinks>`.
  - RIGHT container (`hidden items-center gap-3 md:flex`): plan pill + user chip + `LogoutButton`,
    or login/signup (desktop only, `md:hidden` on mobile).
- `src/ui/nav-links.tsx:51-210` — client island (`usePathname`, `useState(open)`). Renders, in order:
  1. Desktop `<nav aria-label="Navegación principal" className="hidden items-center gap-1.5 ... md:flex">` (lines 65-92).
  2. Hamburger toggle (lines 98-111): plain `<button>`, `md:hidden`, `aria-expanded={open}`,
     `aria-controls="mobile-nav-panel"`, label `Abrir menú`/`Cerrar menú`, lucide Menu/X.
  3. Panel (lines 115-207): `id="mobile-nav-panel"`, `hidden={!open}`,
     `absolute inset-x-0 top-16 z-50 border-b bg-white ... md:hidden`, content conditionally rendered
     (`{open ? <>…</> : null}`): mobile nav (links) + session actions (plan pill / user chip / logout,
     or login/signup).
- **The hamburger lives in the LEFT container** (inside NavLinks), and the panel drops from the
  top, full-width (`inset-x-0 top-16`). The user wants: toggle on the far right on mobile; panel
  becomes a right-side drawer.
- The current panel has **no focus trap, no Escape handling, no click-outside-to-close**.

### Test / Engine Impact

- `src/ui/__tests__/navbar.test.tsx` (8 tests): none reference the toggle/panel → unaffected by
  moving the toggle.
- `src/ui/__tests__/nav-links.test.tsx` (5 mobile tests): rely on `#mobile-nav-panel`,
  `aria-expanded`/`aria-controls`, roles `Abrir menú`/`Cerrar menú`, `Navegación móvil`. They also use
  `container.querySelector("#mobile-nav-panel")` via the `mobilePanel()` helper — **`container`
  queries BREAK if the drawer is portaled to `document.body`** (RTL's `container` is the render
  wrapper; portals land on `document.body`). Tests must switch to `screen`/`document.body` queries.
- `src/app/__tests__/a11y.test.tsx` (jest-axe + focus order): `focusableElements` uses
  `querySelectorAll("a[href], button:not([disabled]), …")` — jsdom ignores CSS `display` and the
  helper ignores `inert`, so an always-mounted closed drawer adds panel links to the matched list,
  but assertions only check first (brand) / last (footer Contacto) / no positive `tabindex`
  → stays green as long as panel elements carry no positive tabindex and sit mid-DOM.
- `layout.test.tsx`: renders the shell and asserts nav links — unaffected by toggle placement.

### Design considerations

- **State ownership**: NavLinks owns `open`. To place the toggle on the right, two options:
  - **A (recommended): extract a client island `MobileMenu`** (toggle + drawer + `useState`),
    rendered by Navbar in the RIGHT container (`md:hidden` toggle before/after the desktop actions);
    NavLinks shrinks to the desktop-only nav. Matches the repo island pattern (sync server Navbar +
    client islands), keeps Navbar a sync server component.
  - **B: keep state in NavLinks and portal the toggle into a slot div** the Navbar renders on the
    right. Minimal diff, but portal-to-slot is a code smell ("clear over clever").
- **CRITICAL positioning gotcha**: the header has `backdrop-blur-md`. `backdrop-filter` creates a
  **containing block for `fixed`/`absolute` descendants** (CSS Filter Effects L2) — a `fixed
  inset-0` overlay or `fixed` drawer INSIDE the header would anchor to the 64px header, not the
  viewport; an `absolute` full-height drawer can't anchor to a 64px header either.
  - **Fix: `createPortal` the drawer + overlay to `document.body`** (or native `<dialog>`).
    Native `<dialog>` gives focus trap + Escape + `::backdrop` for free but changes semantics
    (`role="dialog"` vs the current `navigation` landmark) and jsdom/RTL `showModal` support is
    finicky. **Recommend portal** — keeps the nav landmark and existing role queries intact.
    (Matches impeccable guidance: "Use the native dialog/popover API, position: fixed, or a portal
    to escape the stacking context.")
- **Animation** (functional, not decorative — AGENTS.md): `transition-transform` on the drawer
  (`translate-x-full` ↔ `translate-x-0`, ~250-300ms, ease-out) + `transition-opacity` on the
  overlay. Animate transform/opacity only. `prefers-reduced-motion: reduce` → instant
  (globals.css already ships a reduced-motion block; tokens.test.ts pins `prefers-reduced-motion`).
- **Visibility vs animation**: the `hidden` attribute kills CSS transitions. Keep the drawer always
  mounted; closed state = `aria-hidden` + `inert` (React 19 supports the `inert` prop) +
  `pointer-events-none`. RTL's `getByRole`/`queryByRole` exclude `aria-hidden` subtrees by default
  → existing `queryByRole("navigation", { name: "Navegación móvil" })` null-assertions stay green.
- **a11y contract to add** (currently absent): Escape closes, overlay click closes, focus moves into
  the panel on open, focus returns to the toggle on close. Decision point: modal (inert page
  content + focus trap) vs non-modal (Escape + focus management only). Full modal means the shell
  must know the open state — recommend **non-modal with Escape + focus return** for this sprint.

### Approaches

1. **MobileMenu island + portal drawer/overlay to body** (recommended).
   - Pros: correct positioning (escapes backdrop-blur containing block); clean island boundary;
     toggle truly on the right; animation-friendly; a11y hooks (Escape/overlay/focus) land in one place.
   - Cons: nav-links.test.tsx mobile tests migrate to mobile-menu.test.tsx (mostly verbatim);
     `container.querySelector` must become `document.body`/`screen` queries.
   - Effort: Medium.
2. **Native `<dialog>` drawer**.
   - Pros: free focus trap/Escape/backdrop.
   - Cons: role semantics change (`dialog`), testing-library/jsdom support risk, bigger conceptual
     shift from the current panel; Next.js SSR hydration caveats with `showModal` on mount.
   - Effort: Medium-High.
3. **Keep panel in NavLinks, portal only the panel to body, toggle portaled to a right slot**.
   - Pros: zero test-file migration.
   - Cons: portal-to-slot hack; two portals for one feature; harder to reason about.
   - Effort: Medium.

### Recommendation

Approach 1. Keep `id="mobile-nav-panel"`, the aria contract, and the lucide Menu/X icons in the
new island so tests migrate verbatim (only the query root changes). Add Escape + overlay-close +
focus-return. Desktop nav untouched.

---

## 3. Interleaved section backgrounds on the landing

### Current State

`src/app/page.tsx` — base is `<main className="w-full bg-[#f8fafc]">` (line 215); full section map:

| # | Section (line) | Own background | Notable inner surfaces |
|---|---|---|---|
| 1 | Hero (220) | none → `#f8fafc` | badge `bg-white` |
| 2 | Cómo funciona / Metodología (253) | `border-y bg-white` | 5 light cards `bg-[#f8fafc]`, card 03 `bg-[#0f172a]`, refs box `bg-white` |
| 3 | Scorecard (431) | none → `#f8fafc` | 2 white tables (`rounded-xl border bg-white`, header rows `bg-[#f8fafc]`) |
| 4 | Plataformas (524) | `border-y bg-white` | 6 cards `bg-[#f8fafc]` |
| 5 | Comparativa (574) | none → `#f8fafc` | white table box (`overflow-x-auto rounded-xl border bg-white`) |
| 5b | Case Study (634) | none → `#f8fafc` | plain paragraphs |
| 5c | Changelog (650) | `border-y bg-white` | plain `<ul>` |
| 6 | FAQ (667) | none → `#f8fafc` | white details box (`rounded-xl border bg-white`) |
| 7 | CTA (706) | none → `#f8fafc` | CTA box `rounded-2xl border bg-white p-8 shadow-sm` |

Footer shell (`src/ui/footer.tsx:20`): `border-t bg-[#f8fafc]`.

Reality check: the page ALREADY alternates white bands (S2, S4, S5c) with the `#f8fafc` base, but
S5 → S5b → S6 → S7 are four consecutive gray sections (S5b has no container at all) — that is the
monotony the user perceives. Their examples map to S4 ("6 plataformas…" → fondo/recuadro) and S5
("¿Por qué Relevy en lugar de una auditoría manual?" → otro fondo).

Patterns already in use (design system): full-bleed bands `border-y border-[#e2e8f0] bg-white py-16`;
boxes `rounded-xl border border-[#e2e8f0] bg-white`; CTA box `rounded-2xl border bg-white`;
hex directos ONLY on the landing (LND-2 test pins `div[class*='#f8fafc']` and asserts
`.bg-surface-muted` is absent — semantic tokens exist in globals.css but the landing deliberately
does not use them). The interleaving must stay in hex-directo style.

### Engine / citability impact

NONE. `src/citability/extract.ts` `extractMainContent` selects `article, main, [role="main"], .content`
first → the landing `<main>`; segmentation reads text via Cheerio `.text()` (class-agnostic);
excluded regions are only `nav, footer, aside, .sidebar, .ads`. Backgrounds and wrapper divs do not
change extracted text. `largestTextDiv` fallback applies only to div-only pages — irrelevant here.

### Test constraints (what will break if ignored)

- `page.test.tsx` LND-2 (lines 70-109): `getByText("Metodología de análisis").closest("section")`
  must still wrap all 6 domains; `section.querySelectorAll("div[class*='#f8fafc']").length >= 4`
  (5 light cards keep `bg-[#f8fafc]`); `.bg-surface-muted` stays null.
- LND-2 card 03 (111-118): card remains `div[class*='#0f172a']` with `bg-emerald-500` number.
- Platforms (252-280, 288-321): **`section.querySelectorAll("div.rounded-xl")` must be EXACTLY 6** —
  any new recuadro inside that section must use `rounded-2xl` (not `rounded-xl`) or live outside the grid.
- Comparison table (533-542): `table.parentElement` keeps `overflow-x-auto` and NOT `overflow-hidden`;
  `table.className` keeps `min-w-[640px]` — recuadro goes OUTSIDE the overflow wrapper.
- Bands table (120-152): `closest("div.overflow-hidden")` — nearest-ancestor query, unaffected by outer wrappers.
- `a11y-contrast.test.ts` (env-gated, `@axe-core/playwright`, `color-contrast` on landing):
  body `#475569` on `#f8fafc` ≈ 7.1:1 OK; **eyebrow `#64748b` on `#f8fafc` sits at the 4.5:1 AA
  boundary (≈4.5) — pre-existing marginal case on S3**; new gray bands with small text must use
  `#475569` or darker, and eyebrows on gray should be bumped to `#475569` to be safe. CI SKIPS this
  test (no server) — the local `pnpm dev` smoke gate is where it runs.
- `a11y.test.tsx` (jest-axe): jsdom can't compute color; landmarks/focus order unaffected by bg classes.
- No test asserts section-level background colors → interleaving is safe within the constraints above.

### Approaches

1. **Alternating bands + targeted recuadros (recommended)** — normalize the rhythm to strict
   gray/white alternation: e.g. S3 Scorecard → `bg-white border-y` band (it already contains white
   boxes — a white band with `#f8fafc`-header tables needs a border to separate); S5 Comparativa →
   `bg-white border-y`; S5b Case Study → stays `#f8fafc` but wrapped in a `rounded-2xl border bg-white`
   recuadro (user's "recuadro" example); S6 FAQ → `bg-white border-y`; CTA keeps gray base with its
   white recuadro. S4 Plataformas: keep the white band but flip the cards to `bg-white` with a
   `#f8fafc` section band, OR add a `rounded-2xl` recuadro — pick ONE per the proposal.
   - Pros: kills the monotony (no two adjacent same-bg sections); reuses existing patterns;
     recuadros keep white surfaces for the citable passages.
   - Cons: several sections touched → careful with the `div.rounded-xl` (platforms) and table-parent constraints.
   - Effort: Low-Medium.
2. **Recuadro-only (no band changes)** — wrap S4 and S5b content in `rounded-2xl border bg-white`
   boxes on the existing gray base.
   - Pros: smallest diff; no border-y juggling.
   - Cons: S5→S5b→S6→S7 still four gray sections; less rhythm change than the user asked for.
   - Effort: Low.

### Recommendation

Approach 1, but confirm the exact S4 treatment and the S3 band (white band + border vs recuadro) in
the proposal — those are the two real design forks. Keep hex directos, keep the platforms grid's
`div.rounded-xl` count at 6, keep the comparison table's parent chain, bump `#64748b` → `#475569`
on any eyebrow that lands on `#f8fafc`.

---

## Cross-cutting

- **Citability/SEO**: no engine impact (backgrounds/recuadros don't change extracted text).
- **PDF**: no test impact; add coverage for the URL resolver.
- **Navbar**: test migration required (nav-links.test.tsx → mobile-menu.test.tsx); `container`
  queries must switch to `screen`/`document.body` when portaling.
- **Review budget**: combined diff stays well under 400 lines (render.ts constant + test ≈ 30;
  MobileMenu island + nav-links/navbar edits + test migration ≈ 250; page.tsx bg classes ≈ 40).

## Open decision points for proposal

1. PDF: arch-derived resolver vs hardcoded x64 (recommend arch-derived).
2. Navbar: MobileMenu island (recommend) vs slot-portal; modal vs non-modal drawer a11y.
3. Landing: S4 treatment (band + white cards vs recuadro) and S3 treatment (white band vs recuadro);
   eyebrow color bump on gray bands.