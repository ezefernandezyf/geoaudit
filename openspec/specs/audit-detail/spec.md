# Audit Detail Page Specification

> **Change**: `sprint-5-pro-features` + `sprint-7-ui-fidelity` · **Type**: New capability (ADDED) + Delta (MODIFIED)

## Purpose

First dynamic route in the app: `/dashboard/audits/[id]` renders a single persisted audit's report. It enforces ownership (non-owner or missing audit → 404), renders the persisted `Audit.result` without re-running, and reuses the report UI by extracting a shared `<AuditReport result>` component from `src/report/audit-runner.tsx` so the detail page and the `/report` page render from one source of truth. Since Sprint 7, the detail page is restyled to Gemini's composition: findings with code snippets (only from real sources), the Gemini-style share modal, and an Export PDF button gated to PRO. The ownership/404 and no-rerun contract (ADP-1..ADP-5) is unchanged.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| ADP-1 | Dynamic route | MUST | `/dashboard/audits/[id]` MUST render the audit for that id |
| ADP-2 | Ownership check | MUST | Non-owner or missing audit MUST return 404 |
| ADP-3 | Render persisted result | MUST | Render `Audit.result` with no re-run |
| ADP-4 | Shared AuditReport | MUST | Extract shared `<AuditReport result>` from `audit-runner.tsx` |
| ADP-5 | Single source of truth | MUST | Detail page and `/report` MUST render from the same `AuditReport` |
| ADP-6 | Findings with code | MUST | Findings MUST render code snippets only from real sources (e.g. generated JSON-LD) |
| ADP-7 | Share modal (Gemini) | MUST | The share modal MUST be restyled to Gemini and keep the real share actions |
| ADP-8 | Export PDF button | MUST | An "Export PDF" button MUST be shown, gated to PRO via `requirePaidTier` |

### Requirement: Dynamic Route (ADP-1)

When a user navigates to `/dashboard/audits/[id]`, then the system MUST render the audit identified by `[id]`.

#### Scenario: Detail page renders

- GIVEN an audit with id `123`
- WHEN the owner navigates to `/dashboard/audits/123`
- THEN the page renders that audit's report

### Requirement: Ownership Check (ADP-2)

When the detail page loads, then the system MUST verify the requester owns the audit and MUST return 404 for a non-owner or missing audit.

#### Scenario: Non-owner gets 404

- GIVEN audit `123` owned by user A
- WHEN user B opens `/dashboard/audits/123`
- THEN the page returns 404

#### Scenario: Missing audit gets 404

- GIVEN no audit with id `999`
- WHEN `/dashboard/audits/999` is requested
- THEN the page returns 404

### Requirement: Render Persisted Result (ADP-3)

When the detail page renders, then the system MUST read the persisted `Audit.result` JSON and MUST NOT re-run the audit.

#### Scenario: No re-run on detail

- GIVEN an audit whose result is already persisted
- WHEN the detail page renders
- THEN the persisted `result` is the sole source and no audit re-execution occurs

### Requirement: Shared AuditReport (ADP-4)

When the report UI is refactored, then a shared `<AuditReport result>` component MUST be extracted from `src/report/audit-runner.tsx` and accept the persisted result as its input.

#### Scenario: Component extracted

- GIVEN the current `audit-runner.tsx` report markup
- WHEN the extraction is performed
- THEN an `<AuditReport result={...}>` component renders the report from a result object

### Requirement: Single Source of Truth (ADP-5)

When the detail page and the `/report` page render a result, then they MUST both use the shared `<AuditReport>` component, with no duplicated report markup.

#### Scenario: Both pages share the component

- GIVEN a persisted result
- WHEN the detail page and `/report` page render it
- THEN both render via the same `<AuditReport>` component

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
| ADP-1 | Detail page renders | Covered |
| ADP-2 | Non-owner gets 404, Missing audit gets 404 | Covered |
| ADP-3 | No re-run on detail | Covered |
| ADP-4 | Component extracted | Covered |
| ADP-5 | Both pages share the component | Covered |
| ADP-6 | Code from real source, No fabricated code | Covered |
| ADP-7 | Modal uses real actions | Covered |
| ADP-8 | PRO can export, FREE sees CTA | Covered |
