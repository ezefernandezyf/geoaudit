# STYLE-BRIEF — GeoAudit

> Root reference for all visual decisions in the codebase. Required by `AGENTS.md` before the first UI sprint. The design foundation is defined in change `sprint-2-free-audit-flow` (spec `design-foundation`, DNF-1).

## 1. Design Direction

GeoAudit is a data-first SaaS for GEO/SEO audits: URL in → GEO Score 0-100 → full AI visibility report. The interface earns trust through clarity — a dark ink base, a single emerald positive accent, and motion used **only** to communicate state.

- **Design read**: data-heavy product UI for technical marketers; trust-first, low variance, functional motion only.
- **Language**: product copy in Spanish (audit flow, status labels); code identifiers, docs and comments in English.
- **Principle**: "Clear over clever." Every visual choice must make the data legible; decoration is a bug.

## 2. Color Palette

Brand colors — tokens `--color-*` in `src/app/globals.css` (`@theme`):

| Token | Hex | Usage |
|-------|-----|-------|
| `navy` | `#0f172a` | Primary ink; primary buttons; headings on light surfaces |
| `emerald` | `#10b981` | Positive / success; GEO score accents |
| `amber` | `#f59e0b` | Warning / "Fair" bands |
| `red` | `#ef4444` | Critical / errors |

Semantic tokens:

| Token | Hex | Usage |
|-------|-----|-------|
| `surface` | `#ffffff` | Page / card background |
| `surface-muted` | `#f8fafc` | Hover states, subtle section backgrounds |
| `text-primary` | `#0f172a` | Primary text |
| `text-secondary` | `#475569` | Secondary / supporting text |
| `border` | `#e2e8f0` | Hairlines, card borders |
| `border-strong` | `#cbd5e1` | Emphasized borders |

Rules:

- Never pure `#000` / `#fff` in components — use `navy` / `surface`.
- **One accent per context.** Emerald is the only positive accent; a warm-grey page never gets a blue CTA or a teal status badge mid-section.
- Severity chips use tinted backgrounds (50-level) with 700-level text — **WCAG AA contrast** (≥ 4.5:1) for all text.
- Light theme only for now. Dark-mode tokens are a follow-up decision; do not mix half-dark sections into light pages.

## 3. Typography

| Role | Family | Notes |
|------|--------|-------|
| Display / headings | **Instrument Serif** | Brand-mandated serif. Single weight (400) + italic; hierarchy via size and color, not weight |
| Body / UI | **Work Sans** | Body copy, buttons, inputs, labels (400 / 500 / 600) |
| Code / JSON-LD | **JetBrains Mono** | Code blocks, JSON-LD previews, technical metadata |

Loaded via `next/font/google` in the root layout (`--font-display`, `--font-sans`, `--font-mono`); body font is Work Sans. Headings: tight leading, `tracking-tight` on display sizes. Body text max ~65ch.

## 4. Spacing & Shape

- **4px base grid** (Tailwind default `--spacing` scale): 4 / 8 / 12 / 16 / 24 / 32 / 48.
- Cards `p-6`; section gaps 24–32px; forms `gap-2` between label / input / error slot.
- **Radii (one scale, applied everywhere)**: cards `rounded-xl`, buttons and inputs `rounded-md`, severity chips `rounded-full`.
- Contain page layouts (`max-w-*`); never `h-screen` — use `min-h-dvh`.

## 5. Animation

**Functional only. Decorative animation is banned.**

- The skeleton pulse is the only required animation (audit runs 10–60s); it must respect `prefers-reduced-motion` (`motion-reduce:animate-none`).
- Micro-interactions at a minimum: 150ms color/opacity transitions on hover, `scale-[0.98]` on `:active` for interactive elements.
- Every async process ships the four states: **Loading / Success / Error / Empty** (skeleton pulse for loading; inline `role="alert"` errors; empty states that explain how to proceed).
- No infinite loops, no scroll-jacked motion, no entrance choreography.

## 6. Anti-Patterns (banned)

- **Generic dashboards** — metric soup without hierarchy or a single focused message.
- **Illegible tables** — dense zebra rows, full-bleed `border-b` on every row; group data, use sparse dividers.
- **Context-free scores** — a number without its band, label and explanation is broken UI (score → band chip → why).
- **Placeholder-as-label** — inputs always have a real `<label>`.
- **AI-default slop** — purple gradients, glassmorphism everywhere, Inter + slate-900 stacks, decorative infinite animations.
- **Component libraries** (DaisyUI, shadcn, etc.) — GeoAudit builds its own primitives in `src/ui/` on the token system.

## 7. Primitives (`src/ui/`)

Pure, typed, token-based building blocks (no business logic):

| Component | Contract |
|-----------|----------|
| `skeleton` | Pulse placeholder; `role="status"`, `aria-label="Cargando…"`, `motion-reduce:animate-none` |
| `severity-badge` | 5 bands (`Excellent/Good/Fair/Poor/Critical`) → tinted chip + ES label (Excelente / Bueno / Regular / Deficiente / Crítico) |
| `button` | `primary` / `secondary` / `ghost`, `sm` / `md`, loading state (`aria-busy`, spinner, disabled) |
| `text-field` | `<label>` + `<input type="url">` + reserved error slot with `role="alert"` |
| `card` | Surface container: padding, border, rounded, optional header / footer slots |
