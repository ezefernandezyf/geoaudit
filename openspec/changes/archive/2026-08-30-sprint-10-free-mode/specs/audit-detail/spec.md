# Audit Detail Delta

> **Change**: `sprint-10-free-mode` · **Type**: Delta (MODIFIED)

## Purpose

Lift the PRO gate on the detail page's share modal and Export PDF button. Every audit owner can share and export. Ownership/404 and no-rerun contracts are unchanged.

## MODIFIED Requirements

### Requirement: Share Modal (Gemini) — ADP-7

When the share modal renders, then it MUST be restyled to Gemini (neutral copy, Gemini hex) while still invoking the real `createShareToken`/`revokeShareToken` actions. There is no tier gate.

(Previously: the modal enforced the PRO gate.)

#### Scenario: Modal uses real actions

- GIVEN an authenticated user opens the share modal
- WHEN they activate share
- THEN `createShareToken` runs and the public link is shown

### Requirement: Export PDF Button (ADP-8)

When the detail page renders, then it MUST show an "Export PDF" button that is available to every audit owner. There is no tier gate.

(Previously: the button was gated to PRO/Enterprise via `requirePaidTier`; FREE saw an upgrade CTA.)

#### Scenario: Owner can export

- GIVEN an authenticated audit owner on the detail page
- WHEN it renders
- THEN the "Export PDF" button is enabled

#### Scenario: Non-owner blocked

- GIVEN a user viewing another user's audit
- WHEN the detail page renders for that audit
- THEN the export is not available (ownership 404 applies)
