# Delta: Design Foundation

> **Change**: `sprint-7-ui-fidelity` · **Type**: Delta (MODIFIED)

## Purpose

Replace the token-based design system with Gemini's direct hex values, add a `font-serif` alias and pulse keyframes, and introduce the new logo. This delta modifies the existing `design-foundation` capability (DNF-1..DNF-8) rather than re-specifying it: hex directos replace the `@theme` token approach, the SeverityBadge and Button primitives are re-copied verbatim from Gemini, and a logo + favicon are added.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| DNF-9 | Direct hex values | New | MUST | Primitives use Gemini hex directos (e.g. `bg-[#0f172a]`) instead of `@theme` tokens |
| DNF-10 | font-serif alias | New | MUST | `globals.css` aliases `--font-serif` to the serif font |
| DNF-11 | Pulse keyframes | New | MUST | `globals.css` defines the `pulse` keyframes used by skeletons |
| DNF-12 | Logo + favicon | New | MUST | New SVG "G" serif + emerald wave + globe mark, wordmark "GeoAudit", plus favicon |
| DNF-5 | SeverityBadge (Gemini) | Partial | MUST | Badge re-copied from Gemini (score/dot/size props, lowercase labels); normalization lives in the adapter |
| DNF-7 | Button (Gemini) | Partial | MUST | Button re-copied from Gemini verbatim (Loader2 loading, variants/sizes) |

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

### Requirement: SeverityBadge (Gemini) — DNF-5 delta

When the badge renders, then it MUST be re-copied from Gemini (accepting `score`/`dot`/`size` props and rendering lowercase labels); the Capitalized→lowercase normalization is the adapter's responsibility, not the badge's.

#### Scenario: Badge renders lowercase label

- GIVEN a view-model band `"critical"`
- WHEN the badge renders
- THEN it shows the lowercase Gemini-style label directly

### Requirement: Button (Gemini) — DNF-7 delta

When the button renders, then it MUST be re-copied from Gemini verbatim, including the `Loader2` spinner loading state and the Gemini variant/size set.

#### Scenario: Loader2 loading state

- GIVEN `<Button loading>`
- WHEN it renders
- THEN the `Loader2` spinner shows and the button is disabled

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| DNF-9 | Hex, not tokens | Covered |
| DNF-10 | font-serif resolves | Covered |
| DNF-11 | Pulse animation available | Covered |
| DNF-12 | Logo renders in shell, Favicon present | Covered |
| DNF-5 | Badge renders lowercase label | Covered |
| DNF-7 | Loader2 loading state | Covered |
