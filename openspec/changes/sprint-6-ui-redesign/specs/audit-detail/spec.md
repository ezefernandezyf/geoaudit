# Audit Detail Page Specification (Delta)

> **Change**: `sprint-6-ui-redesign` · **Type**: Delta (MODIFIED)

## Purpose

Extend the detail page's shared `AuditReport` with the platform matrix and code-formatted findings, and surface a PRO-gated share modal. Ownership, no-rerun, and single-source-of-truth behavior are unchanged.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| ADP-4 | Shared AuditReport | Partial | MUST | Shared report now includes the platform matrix + code findings |
| ADP-6 | Platform matrix | New | MUST | Matrix derived from `platform.perPlatform` + `crawlers.perBot` |
| ADP-7 | Findings with code | New | MUST | Findings render technical content in monospace |
| ADP-8 | Share modal entry | New | MUST | Detail page surfaces the PRO-gated share modal |

### Requirement: Shared AuditReport (ADP-4)

When the report UI renders, then the shared `<AuditReport result>` MUST include the platform matrix and code-formatted findings, so `/report` and the detail page show identical content.

#### Scenario: Matrix and code findings in the shared component

- GIVEN a persisted result
- WHEN `AuditReport` renders
- THEN the platform matrix and code findings are part of the shared component, not duplicated per page

### Requirement: Platform Matrix (ADP-6)

When the detail page renders, then the platform matrix MUST derive its rows from `platform.perPlatform` and `crawlers.perBot`, never from a mock shape.

#### Scenario: Six-platform matrix

- GIVEN a result with per-platform data
- WHEN the matrix renders
- THEN it shows the six platforms with their real readiness/access state

### Requirement: Findings with Code (ADP-7)

When findings render, then technical content (bot names, schema warnings, JSON-LD/suggestion keys) MUST use the JetBrains Mono code styling.

#### Scenario: Monospace findings

- GIVEN findings with schema issues and suggestion keys
- WHEN rendered
- THEN keys, bot identifiers and JSON-LD render in `font-mono`

### Requirement: Share Modal Entry (ADP-8)

When the detail page renders for an owner, then a share action MUST open the share modal (PRO-gated) instead of an inline panel.

#### Scenario: Share opens modal

- GIVEN the detail page for an owned audit
- WHEN the user activates "Compartir"
- THEN the share modal opens with copy/revoke actions
