# STYLE-BRIEF — GeoAudit

> Root reference for all visual decisions in the codebase. Required by `AGENTS.md` before the first UI sprint. The design foundation is defined in change `sprint-2-free-audit-flow` (spec `design-foundation`, DNF-1).

## 1. Design Direction

GeoAudit is a data-first SaaS for GEO/SEO audits: URL in → GEO Score 0-100 → full AI visibility report. The interface earns trust through clarity — a dark ink base, a single emerald positive accent, and motion used **only** to communicate state.

- **Design read**: data-heavy product UI for technical marketers; trust-first, low variance, functional motion only.
- **Language**: product copy in Spanish (audit flow, status labels); code identifiers, docs and comments in English.
- **Principle**: "Clear over clever." Every visual choice must make the data legible; decoration is a bug.

## 2. Color Palette

> **Sprint 7 (UI Fidelity)**: the shared primitives (`src/ui/*`, navbar, footer)
> now use **Gemini hex directos** (e.g. `bg-[#0f172a]`, `text-[#475569]`,
> `border-[#e2e8f0]`) per spec DNF-9, NOT the `@theme` tokens. The tokens below
> remain declared in `globals.css` (nothing deleted) for legacy consumers until
> their units migrate; new/rewritten UI copies Gemini's exact hex values.

Brand colors — tokens `--color-*` in `src/app/globals.css` (`@theme`):

| Token | Hex | Gemini directo |
|-------|-----|----------------|
| `navy` | `#0f172a` | `bg-[#0f172a]` / `text-[#0f172a]` |
| `emerald` | `#10b981` | `bg-[#10b981]` |
| `amber` | `#f59e0b` | `bg-[#f59e0b]` |
| `red` | `#ef4444` | `bg-[#ef4444]` |

Semantic tokens (legacy; primitives use the hex column):

| Token | Hex | Gemini directo |
|-------|-----|----------------|
| `surface` | `#ffffff` | `bg-white` |
| `surface-muted` | `#f8fafc` | `bg-[#f8fafc]` |
| `text-primary` | `#0f172a` | `text-[#0f172a]` |
| `text-secondary` | `#475569` | `text-[#475569]` |
| `border` | `#e2e8f0` | `border-[#e2e8f0]` |
| `border-strong` | `#cbd5e1` | `border-[#cbd5e1]` |

Rules:

- **Primitives and the shell are Gemini verbatim**: direct hex in class names,
  same compositions, radii (`rounded-md` buttons/inputs, `rounded-xl` cards,
  `rounded-full` chips), shadows (`shadow-xs`), gaps and sizes.
- Never pure `#000` / `#fff` in components — use the navy/surface hex above.
- **One accent per context.** Emerald is the only positive accent; a warm-grey page never gets a blue CTA or a teal status badge mid-section.
- Severity chips use tinted backgrounds (`bg-[#10b981]/10`, etc.) with
  high-contrast text (`text-[#10b981]`, `text-[#dc2626]`) — **WCAG AA**.
- Light theme only for now. Dark-mode tokens are a follow-up decision; do not mix half-dark sections into light pages.

## 3. Typography

| Role | Family | Notes |
|------|--------|-------|
| Display / headings | **Instrument Serif** | Brand-mandated serif. Single weight (400) + italic; hierarchy via size and color, not weight |
| Body / UI | **Work Sans** | Body copy, buttons, inputs, labels (400 / 500 / 600) |
| Code / JSON-LD | **JetBrains Mono** | Code blocks, JSON-LD previews, technical metadata |

Loaded via `next/font/google` in the root layout (`--font-display`, `--font-sans`, `--font-mono`); body font is Work Sans. Headings: tight leading, `tracking-tight` on display sizes. Body text max ~65ch.

**Sprint 7**: `globals.css` also aliases `--font-serif` to the display serif
(DNF-10), so the `font-serif` utility resolves to Instrument Serif (the Gemini
wordmark uses `font-serif`).

## 4. Spacing & Shape

- **4px base grid** (Tailwind default `--spacing` scale): 4 / 8 / 12 / 16 / 24 / 32 / 48.
- Cards `p-6`; section gaps 24–32px; forms `gap-2` between label / input / error slot.
- **Radii (one scale, applied everywhere)**: cards `rounded-xl`, buttons and inputs `rounded-md`, severity chips `rounded-full`.
- Contain page layouts (`max-w-*`); never `h-screen` — use `min-h-dvh`.

## 5. Animation

**Functional only. Decorative animation is banned.**

- The skeleton pulse is the only required animation (audit runs 10–60s). Sprint 7: `globals.css` defines the `pulse` keyframes + `.animate-pulse-subtle` (Gemini verbatim, DNF-11); it must respect `prefers-reduced-motion`.
- Micro-interactions at a minimum: 150ms color/opacity transitions on hover, `scale-[0.98]` on `:active` for interactive elements.
- Every async process ships the four states: **Loading / Success / Error / Empty** (skeleton pulse for loading; inline `role="alert"` errors; empty states that explain how to proceed).
- No infinite loops, no scroll-jacked motion, no entrance choreography.

## 6. Anti-Patterns (banned)

- **Generic dashboards** — metric soup without hierarchy or a single focused message.
- **Illegible tables** — dense zebra rows, full-bleed `border-b` on every row; group data, use sparse dividers.
- **Context-free scores** — a number without its band, label and explanation is broken UI (score → band chip → why).
- **Placeholder-as-label** — inputs always have a real `<label>`.
- **AI-default slop** — purple gradients, glassmorphism everywhere, Inter + slate-900 stacks, decorative infinite animations.
- **Component libraries** (DaisyUI, shadcn, etc.) — GeoAudit builds its own primitives in `src/ui/`.

## 7. Primitives (`src/ui/`)

Pure, typed, Gemini-verbatim building blocks (hex directos, no business logic):

| Component | Contract |
|-----------|----------|
| `skeleton` | `Skeleton` (variants rectangular/circular/text, width/height/label, `bg-[#e2e8f0]` + `animate-pulse-subtle`) + `AuditReportSkeleton` |
| `severity-badge` | Lowercase Gemini bands (`excellent/good/fair/poor/critical`) → tinted hex chip + ES label; props `score`/`showDot`/`size`/`labelOverride` |
| `button` | 5 variants (`primary/secondary/ghost/emerald/danger`) + 3 sizes (`sm/md/lg`), `isLoading` → Loader2 + disabled + `aria-busy`, `leftIcon`/`rightIcon` |
| `text-field` | Gemini verbatim: uppercase `tracking-wider` label, `useId`, error/helper slot `min-h-[18px]`, `leftIcon`/`rightElement`/`hideLabelVisually` |
| `card` | Gemini verbatim: `default/muted/highlight`, `noPadding`, NO header/footer slots |
| `score-bar` | Receives `category` (`name`, `score`, `maxScore`, `status`, …); fill color derives from `category.status` (real bands 90/75/60/40) |
| `logo` | SVG mark (serif G + emerald wave + globe) + wordmark; `app/icon.svg` favicon |

> The Capitalized `SeverityBand` contract stays in `src/lib/contracts/`; the
> Capitalized→lowercase normalization belongs to the report adapter (U5).
