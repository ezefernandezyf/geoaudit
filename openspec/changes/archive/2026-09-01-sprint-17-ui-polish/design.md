# Design: Sprint 17 — UI Polish

## Technical Approach

Four isolated fixes, zero engine/scoring change. PDF (PDF-4): replace the bare-pack constant with a pure arch→URL resolver. App shell (SHL-10): extract a `MobileMenu` client island; portal drawer+overlay to `document.body` to escape the header's `backdrop-blur-md` containing block. Landing (LND-9/18): three real JSON-LD constants + an interleaved gray/white rhythm breaking the S5→S7 gray run. No routing/shell/new-subprocess boundary → threat matrix N/A.

## Architecture Decisions

| # | Decision | Options | Choice | Rationale |
|---|---|---|---|---|
| D1 | `resolveChromiumPackUrl(arch = process.arch)` | (a) arch-derived resolver (default param); (b) hardcoded `.x64.tar` | **(a)** | Correct today (Vercel x86_64) AND future-proof (arm64). Default param keeps the prod call site 1-arg; passing `arch` as arg makes both branches + the error path unit-testable without monkeypatching `process.arch`. Throws the EXISTING `PdfRenderError` (spec PDF-4 names it; it's already the route's 5xx mapper). Removes `CHROMIUM_PACK_URL`. |
| D2 | `MobileMenu` island + shared `nav-config.ts` | (a) extract island, `LINKS`/`MULTI_PAGE_LINK` in shared `src/ui/nav-config.ts`; (b) slot-portal toggle | **(a)** | Matches repo island pattern (sync Navbar + client islands). Shared link source avoids duplication. `NavLinks` shrinks to desktop-only `{ showMultiPage? }`; `MobileMenu` takes `{ showMultiPage?, isAuthenticated?, displayName?, initials?, plan? }`. |
| D3 | Portal + non-modal focus | (a) `createPortal` to `document.body`, always-mounted, `aria-hidden`+`inert`+`pointer-events-none` closed; (b) native `<dialog>` | **(a)** | Portal escapes the `backdrop-blur-md` containing block (CSS Filter Effects L2). Always-mounted preserves transitions + valid `aria-controls` + existing role-query null assertions (RTL excludes `aria-hidden` subtrees). Non-modal (Escape + overlay + focus-return, NO trap/page-inert) matches locked scope. |
| D4 | Test migration split | 5 mobile → `mobile-menu.test.tsx` (query root `container.querySelector` → `document.body`/`screen`); desktop stays in `nav-links.test.tsx` | **migrate + add 4** | Portal breaks `container` queries; `screen`/`document.body` are portal-safe. +4 new: portal-to-body, closed `aria-hidden`+`inert`, Escape+focus-return, overlay-click+focus-return. |
| D5 | Landing rhythm (map below) + absorb S5c | (a) absorb Changelog into S6 white band via split borders; (b) accept white-white seam | **(a)** | Two adjacent `border-y` white sections render a double border line + a white-white adjacency violating LND-18's spirit. `border-t` on S5c + `border-b` on S6 merges them into ONE continuous white band with clean gray↔white boundaries both sides. |
| D6 | JSON-LD constants | `ORG_AREA_SERVED="AR"`, `ORG_INDUSTRY="Software"`, `ORG_EMPLOYEES=1` in `brand.ts`; `award` omitted | **3 constants, no award** | Real values (AR matches `BRAND_ADDRESS`; solo founder). `award` omitted (LND-7 honesty) → `missing_recommended` 4 → 1. |

### D5 final section map (exact classes)

| # | Section | Fondo base | Tratamiento |
|---|---|---|---|
| S1 | Hero | `#f8fafc` | unchanged |
| S2 | Cómo funciona | `border-y bg-white` | unchanged |
| S3 | Scorecard | `#f8fafc` | unchanged; **eyebrow → `#475569`** |
| S4 | Plataformas | `#f8fafc` | drop `border-y bg-white`; white `rounded-2xl border bg-white p-6` recuadro around the grid; **eyebrow → `#475569`** |
| S5 | Comparativa | `border-y bg-white` | add band + inner `max-w-5xl` wrapper; table wrapper `overflow-x-auto` intact; eyebrow stays `#64748b` |
| S5b | Case Study | `#f8fafc` | white `rounded-2xl border bg-white p-6 sm:p-8` recuadro |
| S5c | Changelog | `border-t bg-white` | drop `border-y` → `border-t` (absorbed into S6) |
| S6 | FAQ | `border-b bg-white` | add band (was gray) + inner `max-w-3xl` wrapper; eyebrow stays `#64748b` |
| S7 | CTA | `#f8fafc` | unchanged (existing recuadro) |

S3↔S4 are both gray (accepted tradeoff): S3 ends with white tables and S4 opens with a white recuadro, so the seam is a thin gray band between two white surfaces, not a monotonous run — and it's outside the spec's "run" (S5→S7).

## Data Flow

```
brand.ts constants (ORG_*) ──► page.tsx OrganizationJsonLd ──► SSR <script ld+json>
nav-config.ts LINKS ──► NavLinks (desktop) + MobileMenu (toggle→portal drawer) ──► document.body
render.ts resolveChromiumPackUrl(arch) ──► chromium.executablePath ──► puppeteer.launch
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/pdf/render.ts` | Modify | `CHROMIUM_PACK_URL` const → exported `resolveChromiumPackUrl(arch = process.arch)`; call at line 81 |
| `src/pdf/__tests__/render.test.ts` | Modify | +3 tests: x64, arm64, unknown arch → `PdfRenderError` |
| `src/ui/nav-config.ts` | Create | `LINKS`, `MULTI_PAGE_LINK`, `buildLinks(showMultiPage)` |
| `src/ui/mobile-menu.tsx` | Create | `MobileMenu` island: toggle + portal drawer/overlay + `useState(open)` + Escape/overlay/focus |
| `src/ui/nav-links.tsx` | Modify | desktop-only; drop `open`/toggle/panel/session-actions |
| `src/ui/navbar.tsx` | Modify | render `<MobileMenu>` in right container (`md:hidden` toggle); NavLinks desktop-only |
| `src/ui/__tests__/mobile-menu.test.tsx` | Create | 5 migrated (query root changed) + 4 new a11y tests |
| `src/ui/__tests__/nav-links.test.tsx` | Modify | keep desktop-nav assertions; drop 5 mobile |
| `src/lib/brand.ts` | Modify | +`ORG_AREA_SERVED`, `ORG_INDUSTRY`, `ORG_EMPLOYEES` |
| `src/lib/brand.test.ts` | Modify | +assertions for the 3 constants |
| `src/app/page.tsx` | Modify | section backgrounds/recuadros/eyebrow bumps (D5) + JSON-LD 3 props |
| `src/app/__tests__/page.test.tsx` | Modify | JSON-LD `areaServed`/`industry`/`numberOfEmployees` + no `award` |

## Interfaces / Contracts

```ts
// src/pdf/render.ts
export function resolveChromiumPackUrl(arch: string = process.arch): string {
  const base = "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack";
  if (arch === "x64") return `${base}.x64.tar`;
  if (arch === "arm64") return `${base}.arm64.tar`;
  throw new PdfRenderError(`Unsupported architecture: ${arch}`);
}

// src/lib/brand.ts
export const ORG_AREA_SERVED = "AR";
export const ORG_INDUSTRY = "Software";
export const ORG_EMPLOYEES = 1;

// src/ui/nav-config.ts
export const LINKS = [{ href: "/", label: "Producto", match: (p: string) => p === "/" }] as const;
export const MULTI_PAGE_LINK = { href: "/multipage", label: "Multi-página", match: (p: string) => p.startsWith("/multipage") } as const;
export const buildLinks = (showMultiPage: boolean) => (showMultiPage ? [...LINKS, MULTI_PAGE_LINK] : LINKS);
```

`MobileMenu` drawer: `fixed inset-y-0 right-0 top-0 z-50 h-dvh w-80 max-w-[85vw]`, `translate-x-full ↔ translate-x-0` + `transition-transform duration-250 ease-out`, `motion-reduce:transition-none`. Overlay: `fixed inset-0 z-50 bg-[#0f172a]/40`, `opacity-0 pointer-events-none ↔ opacity-100`.

## Testing Strategy

| Layer | What | Where |
|-------|------|-------|
| Unit | resolver x64/arm64 URL + unknown-arch `PdfRenderError` | `render.test.ts` |
| Unit | `ORG_*` constants equal real values | `brand.test.ts` |
| Unit (RTL) | JSON-LD `areaServed`/`industry`/`numberOfEmployees` present, no `award` | `page.test.tsx` |
| Unit (RTL) | toggle open/close, anon+auth actions, desktop-unchanged, portal-to-body, `aria-hidden`+`inert`, Escape/overlay + focus-return | `mobile-menu.test.tsx` |
| Unit (RTL) | LND-2/4/14 constraints stay green (6 `rounded-xl`, `overflow-x-auto`, `min-w-[640px]`) | `page.test.tsx` |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. The resolver is a pure arch→URL string map with zero I/O; the pre-existing Chromium subprocess launch is unchanged and already threat-modeled (typed `PdfRenderError`, always-close `finally`, injected `deps.launch`).

## Migration / Rollout

No migration. Per-item atomic commits (PDF, navbar, landing, JSON-LD) — copy+test travel together.

## Open Questions

None — D1–D6 resolved. Risk only: S3↔S4 gray seam is accepted (scope-locked, visually separated by white surfaces).
