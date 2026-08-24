# Multi-Page Audit Specification (Delta)

> **Change**: `sprint-6-ui-redesign` · **Type**: Delta (MODIFIED)

## Purpose

Adapt the multi-page report view to the new visual direction. Orchestration, persistence, caps and gating are unchanged.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| MPA-10 | Multi-page report restyle | New | MUST | Per-page rows use ScoreBar + SeverityBadge consistently |

### Requirement: Multi-page Report Restyle (MPA-10)

When a multi-page report renders, then each page row MUST use the shared severity badge and score bar styling consistent with the single-page report.

#### Scenario: Page rows use the new primitives

- GIVEN a persisted `MultiPageResult`
- WHEN `MultiPageReport` renders
- THEN the aggregate hero and each page row use the same `ScoreHero`/`SeverityBadge` primitives as the single-page report
