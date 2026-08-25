# Design Foundation Specification

> **Change**: `sprint-2-free-audit-flow` + `sprint-7-ui-fidelity` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

Establish the project's visual identity system before any UI implementation: `STYLE-BRIEF.md` documenting design direction, Tailwind CSS 4 `@theme` tokens for colors/fonts/spacing, font loading via `next/font/google`, and a set of primitive UI components (`src/ui/`) that form the design system's building blocks. Animation rule: functional only (skeleton pulse, micro-interactions); no decorative animation. Since Sprint 7, the primitives are re-copied verbatim from Gemini using direct hex values instead of semantic `@theme` color tokens, a `font-serif` alias and `pulse` keyframes are added, and a new logo + favicon exist.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| DNF-1 | STYLE-BRIEF.md | MUST | Document color palette (navy/emerald/amber/red + semantics), typography, spacing, animation rules, anti-patterns |
| DNF-2 | Tailwind 4 @theme tokens | MUST | `@theme` block in `globals.css`: colors (`--color-*`), fonts (`--font-*`), spacing; class names like `bg-navy` usable |
| DNF-3 | Font loading strategy | MUST | Load Instrument Serif (headings), Work Sans (body), JetBrains Mono (code) via `next/font/google` in root layout |
| DNF-4 | Skeleton component | MUST | Pulse animation, accessible (`role="status"`, `aria-label`), respects `prefers-reduced-motion` |
| DNF-5 | SeverityBadge (Gemini) | MUST | Badge re-copied from Gemini (score/dot/size props, lowercase labels); normalization lives in the adapter |
| DNF-6 | Card component | MUST | Container: padding, border, rounded corners, optional header/footer slots |
| DNF-7 | Button (Gemini) | MUST | Button re-copied from Gemini verbatim (Loader2 loading, variants/sizes) |
| DNF-8 | TextField component | MUST | Wraps `<input type="url">` + `<label>` + error text with `role="alert"` |
| DNF-9 | Direct hex values | MUST | Primitives use Gemini hex directos (e.g. `bg-[#0f172a]`) instead of `@theme` tokens |
| DNF-10 | font-serif alias | MUST | `globals.css` aliases `--font-serif` to the serif font |
| DNF-11 | Pulse keyframes | MUST | `globals.css` defines the `pulse` keyframes used by skeletons |
| DNF-12 | Logo + favicon | MUST | New SVG "G" serif + emerald wave + globe mark, wordmark "GeoAudit", plus favicon |

### DNF-1: STYLE-BRIEF.md

**Rationale**: AGENTS.md requires `STYLE-BRIEF.md` before the first UI sprint. The brief formalizes the design decisions scattered across AGENTS.md §Design and prevents visual drift during implementation.

#### Scenario: Brief exists with all required sections

- GIVEN the project root
- WHEN the design foundation is established
- THEN `STYLE-BRIEF.md` exists and documents: color palette (navy `#0f172a` / emerald `#10b981` / amber `#f59e0b` / red `#ef4444`), semantic tokens (surface, text-primary, border), typography scale (Instrument Serif headings, Work Sans body, JetBrains Mono code), spacing grid, animation rules (functional only, pulse skeleton, no decoration), and anti-patterns (no generic dashboards, illegible tables, context-free scores)

### DNF-2: Tailwind 4 @theme tokens

**Rationale**: Tailwind 4 `@theme` is the canonical way to define design tokens as CSS custom properties, enabling compile-time class generation and runtime variable access.

#### Scenario: Theme tokens are functional

- GIVEN `src/app/globals.css` with an `@theme` block
- WHEN a component uses `className="bg-navy text-emerald"`
- THEN the navy background and emerald text are applied at build time
- AND tokens resolve to the CSS custom properties defined in the `@theme` block

### DNF-4: Skeleton component (a11y)

**Rationale**: The skeleton is the only animation the app requires; it must be accessible and motion-safe.

#### Scenario: Skeleton with pulse and accessibility

- GIVEN `<Skeleton />` renders during an audit
- WHEN inspected in the DOM
- THEN it has `role="status"` and `aria-label="Cargando…"`
- AND a CSS `animate-pulse` class produces the pulse effect
- AND when `prefers-reduced-motion: reduce` matches, the pulse animation is disabled (`motion-reduce:animate-none`)

### DNF-5: SeverityBadge (Gemini)

**Rationale**: `SeverityBand` is a shared contract used by the GEO Score and every engine. The badge is the UI primitive for displaying severity across the entire app. Since Sprint 7 it is re-copied verbatim from Gemini: it accepts `score`/`dot`/`size` props and renders lowercase labels; the Capitalized→lowercase normalization is the adapter's responsibility, not the badge's.

#### Scenario: Badge renders lowercase label

- GIVEN a view-model band `"critical"`
- WHEN the badge renders
- THEN it shows the lowercase Gemini-style label directly

### DNF-7: Button (Gemini)

**Rationale**: Buttons are the primary interactive primitive. Loading state prevents double-submit and communicates progress. Since Sprint 7 the button is re-copied from Gemini verbatim, including the `Loader2` spinner loading state and the Gemini variant/size set.

#### Scenario: Loader2 loading state

- GIVEN `<Button loading>`
- WHEN it renders
- THEN the `Loader2` spinner shows and the button is disabled

### Requirement: Direct Hex Values (DNF-9)

When a primitive (`button`, `card`, `text-field`, `severity-badge`, `score-bar`, `skeleton`) renders, then it MUST use Gemini's exact hex values (e.g. `bg-[#0f172a]`, `text-[#475569]`) directly in class names rather than the `@theme` color tokens.

#### Scenario: Hex, not tokens

- GIVEN the `Button` component
- WHEN it renders
- THEN its classes use Gemini hex values, not `bg-navy`/`bg-surface`

### Requirement: font-serif Alias (DNF-10)

When `globals.css` is authored, then it MUST alias `--font-serif` to the heading serif font so the `font-serif` class resolves.

#### Scenario: font-serif resolves

- GIVEN `globals.css` with the alias
- WHEN a component uses `font-serif`
- THEN the serif heading font is applied

### Requirement: Pulse Keyframes (DNF-11)

When `globals.css` is authored, then it MUST define the `pulse` keyframes used by the skeleton loading animation.

#### Scenario: Pulse animation available

- GIVEN the skeleton renders
- WHEN it animates
- THEN the `pulse` keyframes produce the loading effect (and `prefers-reduced-motion` still disables it)

### Requirement: Logo + Favicon (DNF-12)

When the app shell renders, then a new SVG logo MUST be shown — a serif "G" mark with an emerald wave and a globe, accompanied by the wordmark "GeoAudit" — and a matching favicon MUST replace the current one.

#### Scenario: Logo renders in shell

- GIVEN the navbar
- WHEN it renders
- THEN the new "G" serif + wave + globe logo and "GeoAudit" wordmark appear

#### Scenario: Favicon present

- GIVEN the root layout
- WHEN it loads
- THEN the new favicon is served

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| DNF-1 | Brief exists with all sections | Covered |
| DNF-2 | Theme tokens are functional | Covered |
| DNF-3 | (via DNF-1 font families + DNF-2 font tokens) | Implicit |
| DNF-4 | Skeleton with pulse + a11y | Covered |
| DNF-5 | Badge renders lowercase label | Covered |
| DNF-6 | (render test: padding/border/rounded slots) | Implicit |
| DNF-7 | Loader2 loading state | Covered |
| DNF-8 | (via ADF-1 label + ADF-7 error role=alert) | Implicit |
| DNF-9 | Hex, not tokens | Covered |
| DNF-10 | font-serif resolves | Covered |
| DNF-11 | Pulse animation available | Covered |
| DNF-12 | Logo renders in shell, Favicon present | Covered |
