# App Shell Specification (Delta)

> **Change**: `sprint-9-audit-calibration` · **Type**: Delta (ADDED)

## Purpose

Add app-wide security response headers (CSP + HSTS) so every route is hardened against injection and downgrade attacks. CSP is introduced report-only first, then enforced.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| SHL-7 | Security headers | New | MUST | Every response MUST send CSP + HSTS (CSP report-only first, then enforced) |

### Requirement: Security Headers (SHL-7)

Every app response MUST send a Content-Security-Policy and Strict-Transport-Security header. CSP MUST start in report-only mode (with reporting) and only move to enforcement after assets/inline/third-party resources are verified unbroken.

#### Scenario: CSP + HSTS emitted

- GIVEN any route response
- WHEN the response is inspected
- THEN `Content-Security-Policy` (or `Content-Security-Policy-Report-Only`) and `Strict-Transport-Security` headers are present

#### Scenario: CSP report-only before enforce

- GIVEN CSP is initially rolled out
- WHEN the landing/report routes render
- THEN CSP is report-only until no inline/third-party breakage is observed, then it is enforced

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| SHL-7 | CSP + HSTS emitted, CSP report-only before enforce | Covered |
