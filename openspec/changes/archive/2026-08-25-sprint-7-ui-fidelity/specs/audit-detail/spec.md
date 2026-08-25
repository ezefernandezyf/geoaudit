# Delta: Audit Detail

> **Change**: `sprint-7-ui-fidelity` · **Type**: Delta (MODIFIED)

## Purpose

Restyle the audit detail page (`/dashboard/audits/[id]`) to Gemini's composition while keeping the ownership/404 and no-rerun contract (ADP-1..ADP-5). This delta adds findings with code snippets (only from real sources), the Gemini-style share modal, and an Export PDF button gated to PRO.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| ADP-6 | Findings with code | New | MUST | Findings MUST render code snippets only from real sources (e.g. generated JSON-LD) |
| ADP-7 | Share modal (Gemini) | Partial | MUST | The share modal MUST be restyled to Gemini and keep the real share actions |
| ADP-8 | Export PDF button | New | MUST | An "Export PDF" button MUST be shown, gated to PRO via `requirePaidTier` |

### Requirement: Findings with Code (ADP-6)

When the detail findings render, then they MUST include code snippets only where a real source exists (e.g. schema `generated` JSON-LD), never a fabricated snippet.

#### Scenario: Code from real source

- GIVEN a result with generated JSON-LD
- WHEN findings render
- THEN the code snippet is the real generated JSON-LD

#### Scenario: No fabricated code

- GIVEN a result with no code source
- WHEN findings render
- THEN no invented code snippet appears

### Requirement: Share Modal (Gemini) — ADP-7

When the share modal renders, then it MUST be restyled to Gemini (neutral copy, Gemini hex) while still invoking the real `createShareToken`/`revokeShareToken` actions and enforcing the PRO gate.

#### Scenario: Modal uses real actions

- GIVEN a PRO user opens the share modal
- WHEN they activate share
- THEN `createShareToken` runs and the public link is shown

### Requirement: Export PDF Button (ADP-8)

When the detail page renders, then it MUST show an "Export PDF" button that is gated to PRO/Enterprise via `requirePaidTier`; a FREE user sees the upgrade CTA.

#### Scenario: PRO can export

- GIVEN a PRO user on the detail page
- WHEN it renders
- THEN the "Export PDF" button is enabled

#### Scenario: FREE sees CTA

- GIVEN a FREE user on the detail page
- WHEN it renders
- THEN the export is gated with an upgrade CTA

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| ADP-6 | Code from real source, No fabricated code | Covered |
| ADP-7 | Modal uses real actions | Covered |
| ADP-8 | PRO can export, FREE sees CTA | Covered |
