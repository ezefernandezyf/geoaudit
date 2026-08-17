# Design Foundation Specification

> **Change**: `sprint-2-free-audit-flow` · **Type**: New capability (ADDED)

## Purpose

Establish the project's visual identity system before any UI implementation: `STYLE-BRIEF.md` documenting design direction, Tailwind CSS 4 `@theme` tokens for colors/fonts/spacing, font loading via `next/font/google`, and a set of primitive UI components (`src/ui/`) that form the design system's building blocks. Animation rule: functional only (skeleton pulse, micro-interactions); no decorative animation.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| DNF-1 | STYLE-BRIEF.md | MUST | Document color palette (navy/emerald/amber/red + semantics), typography, spacing, animation rules, anti-patterns |
| DNF-2 | Tailwind 4 @theme tokens | MUST | `@theme` block in `globals.css`: colors (`--color-*`), fonts (`--font-*`), spacing; class names like `bg-navy` usable |
| DNF-3 | Font loading strategy | MUST | Load Instrument Serif (headings), Work Sans (body), JetBrains Mono (code) via `next/font/google` in root layout |
| DNF-4 | Skeleton component | MUST | Pulse animation, accessible (`role="status"`, `aria-label`), respects `prefers-reduced-motion` |
| DNF-5 | SeverityBadge component | MUST | 5 bands (Excellent/Good/Fair/Poor/Critical), color-mapped, receives `severityBand` prop |
| DNF-6 | Card component | MUST | Container: padding, border, rounded corners, optional header/footer slots |
| DNF-7 | Button component | MUST | Variants: primary/secondary/ghost; sizes: sm/md; loading state with spinner + disabled |
| DNF-8 | TextField component | MUST | Wraps `<input type="url">` + `<label>` + error text with `role="alert"` |

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

### DNF-5: SeverityBadge component

**Rationale**: `SeverityBand` is a shared contract used by the GEO Score and every engine. The badge is the UI primitive for displaying severity across the entire app.

#### Scenario: Each band maps to correct color

- GIVEN `<SeverityBadge band="Critical" />`
- WHEN rendered
- THEN badge shows red background with "Crítico" label
- AND `Excellent` → green + "Excelente"
- AND `Good` → emerald + "Bueno"
- AND `Fair` → amber + "Regular"
- AND `Poor` → orange + "Deficiente"

### DNF-7: Button component

**Rationale**: Buttons are the primary interactive primitive. Loading state prevents double-submit and communicates progress.

#### Scenario: Primary button with loading

- GIVEN `<Button variant="primary" loading={true}>Analizar</Button>`
- WHEN rendered
- THEN button is disabled and `aria-busy="true"` is set
- AND a spinner icon is visible; text changes to "Analizando…"
- AND disabled styles (reduced opacity, `cursor-not-allowed`) are applied

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| DNF-1 | Brief exists with all sections | Covered |
| DNF-2 | Theme tokens are functional | Covered |
| DNF-3 | (via DNF-1 font families + DNF-2 font tokens) | Implicit |
| DNF-4 | Skeleton with pulse + a11y | Covered |
| DNF-5 | Band → color mapping | Covered |
| DNF-6 | (render test: padding/border/rounded slots) | Implicit |
| DNF-7 | Primary button with loading | Covered |
| DNF-8 | (via ADF-1 label + ADF-7 error role=alert) | Implicit |
