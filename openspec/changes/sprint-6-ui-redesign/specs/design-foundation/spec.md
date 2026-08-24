# Design Foundation Specification (Delta)

> **Change**: `sprint-6-ui-redesign` · **Type**: Delta (MODIFIED)

## Purpose

Extend the design system for the redesign: add the `ScoreBar` primitive, adopt lucide-react for icons, and restyle Button/Card/TextField to the new visual direction. Tokens, fonts, Skeleton, SeverityBadge and STYLE-BRIEF stay intact.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| DNF-6 | Card component | Partial | MUST | Restyled; header/footer slots and padding contract unchanged |
| DNF-7 | Button component | Partial | MUST | Restyled; optional `icon` slot via lucide-react |
| DNF-8 | TextField component | Partial | MUST | Restyled input tokens; same label/error contract |
| DNF-9 | ScoreBar component | New | MUST | Reusable 0-100 band-colored bar derived from a numeric score |
| DNF-10 | lucide-react icons | New | MUST | lucide-react adopted as the icon source (no inline SVGs) |

### Requirement: Card Component (DNF-6)

When `Card` renders, then it MUST keep its header/footer slots and padding contract, restyled to the rounded-xl / border tokens of the new direction.

#### Scenario: Card keeps slots

- GIVEN `<Card header={...}>`
- WHEN rendered
- THEN header and footer slots still render
- AND radii/spacing follow STYLE-BRIEF §4 (rounded-xl, p-6)

### Requirement: Button Component (DNF-7)

When `Button` renders, then it MUST keep variants (primary/secondary/ghost), sizes, loading and disabled states, and MAY accept an `icon` slot rendered from lucide-react.

#### Scenario: Button with icon

- GIVEN `<Button icon={<ShareIcon />}>`
- WHEN rendered
- THEN the icon renders beside the label, and loading still shows the spinner

### Requirement: TextField Component (DNF-8)

When `TextField` renders, then it MUST keep `<label>` + `<input type="url">` + `role="alert"` error slot, restyled to the shared input tokens.

#### Scenario: TextField contract preserved

- GIVEN a TextField with an error
- WHEN rendered
- THEN the label is associated and the error uses `role="alert"`

### Requirement: ScoreBar Component (DNF-9)

When a domain score renders, then the `ScoreBar` primitive MUST draw a 0-100 bar whose width equals the score and whose fill color maps to the severity band, derived from the numeric score only.

#### Scenario: ScoreBar width and color

- GIVEN `<ScoreBar score={72} />`
- WHEN rendered
- THEN the fill width is 72% and the color matches the `Fair` band family

### Requirement: lucide-react Icons (DNF-10)

When any component needs an icon, then it MUST use a lucide-react icon rather than inline SVG or emoji.

#### Scenario: Icons from lucide-react

- GIVEN the Navbar, share modal and buttons
- WHEN rendered
- THEN icons (logo, share, copy, menu, logout) come from lucide-react
