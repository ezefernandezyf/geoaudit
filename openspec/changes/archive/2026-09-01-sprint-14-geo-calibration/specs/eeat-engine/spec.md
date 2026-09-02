# Delta for E-E-A-T Engine

> **Change**: `2026-09-01-sprint-14-geo-calibration` · **Type**: Delta (MODIFIED)

## Racional

El benchmark real dio experience 0/25 en 6 de 9 sitios: las señales de first-person/case-study no existen en la mayoría de los sitios product. v3.1 agrega un proxy de experiencia honesto: la presencia de changelog/release-notes/what's-new demuestra operación hands-on del producto (decisión del usuario: proxy, no 0 automático).

| # | Change | Summary |
|---|--------|---------|
| REE-1 | MODIFIED | Experience detecta changelog/release-notes/what's-new como proxy |

## MODIFIED Requirements

### Requirement: Experience Score (REE-1)

The system MUST detect first-person language, case-study patterns, and changelog/release-notes/what's-new signals as proxies for first-hand experience. A page publishing release notes or a changelog MUST earn experience credit even without first-person or case-study phrasing; the finding key MUST be "changelog_proxy".
(Previously: first-person + case-study only — the benchmark scored 0/25 in 6 of 9 sites.)

#### Scenario: Rich first-person case-study content

- GIVEN a page containing "We deployed this solution across 50 stores…" and "Our team found that…" and "Case Study:"
- WHEN the Experience dimension is scored
- THEN the score is ≥ 15 (first-person + case-study indicators)
- AND the detected patterns are enumerated in the dimension breakdown

#### Scenario: Changelog proxy earns experience credit

- GIVEN a page with a "Release notes" heading and version entries ("v18.2.0", "v18.3.0") but no first-person text and no case-study phrasing
- WHEN the Experience dimension is scored
- THEN the score is ≥ 10 (changelog proxy)
- AND a finding with key "changelog_proxy" is present

#### Scenario: Impersonal third-party content

- GIVEN a page with exclusively third-person voice ("The company reported…", "Users can…"), no case-study patterns, and no changelog/release-notes/what's-new signals
- WHEN the Experience dimension is scored
- THEN the score is ≤ 5

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| REE-1 | Rich first-person case-study, Changelog proxy earns experience credit, Impersonal third-party content | Covered |