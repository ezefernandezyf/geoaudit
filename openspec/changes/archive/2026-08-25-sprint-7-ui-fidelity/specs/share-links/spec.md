# Delta: Share Links

> **Change**: `sprint-7-ui-fidelity` · **Type**: Delta (MODIFIED)

## Purpose

Restyle the public share page (`/share/[token]`) to Gemini's composition while preserving the revocable-token contract (SHR-1..SHR-6). This delta adds a "Verificado" pill, displays the share token ID, and adds a footer CTA (e.g. "Run your own audit").

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| SHR-7 | Verificado pill | New | MUST | The public page MUST show a "Verificado" badge/pill |
| SHR-8 | Token ID display | New | MUST | The share token ID MUST be displayed (or its short form) |
| SHR-9 | Footer CTA | New | MUST | A footer CTA MUST invite the visitor to run their own audit |

### Requirement: Verificado Pill (SHR-7)

When the public share page renders, then it MUST show a "Verificado" pill indicating the report is a verified share.

#### Scenario: Pill visible

- GIVEN a valid `/share/[token]`
- WHEN it renders
- THEN a "Verificado" pill is shown

### Requirement: Token ID Display (SHR-8)

When the public share page renders, then it MUST display the share token ID (or a truncated form) so the link is identifiable.

#### Scenario: Token shown

- GIVEN a valid token
- WHEN the page renders
- THEN the token ID is visible

### Requirement: Footer CTA (SHR-9)

When the public share page renders, then it MUST include a footer CTA inviting the visitor to run their own audit (linking to the landing page).

#### Scenario: CTA present

- GIVEN a shared report
- WHEN the footer renders
- THEN a CTA links to the landing/audit entry point

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| SHR-7 | Pill visible | Covered |
| SHR-8 | Token shown | Covered |
| SHR-9 | CTA present | Covered |
