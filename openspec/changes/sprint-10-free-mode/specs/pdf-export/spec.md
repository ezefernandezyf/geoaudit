# PDF Export Delta

> **Change**: `sprint-10-free-mode` · **Type**: Delta (MODIFIED)

## Purpose

Lift the PRO gate on PDF export. Every authenticated audit owner can export the PDF; the ownership gate, render pipeline (Puppeteer), self-hosted fonts, and response contract are unchanged.

## REMOVED Requirements

### Requirement: Tier Gate (PDF-3)

(Reason: PDF export is now FREE; the `isPaidTier`/`requirePaidTier` gate and upgrade CTA are removed.)
(Migration: Ownership gate (PDF-2) remains the sole access check.)

## MODIFIED Requirements

### Requirement: Error States (PDF-9)

When the PDF route encounters a failure, then it MUST return typed errors rather than throwing uncaught exceptions. Error cases are: missing audit, non-owner, and render failure.

(Previously: error cases included FREE/non-paid tier, which no longer exists.)

#### Scenario: Missing audit 404

- GIVEN audit id `999` does not exist
- WHEN its PDF is requested
- THEN the route returns 404

#### Scenario: Non-owner blocked

- GIVEN audit `123` owned by user A
- WHEN user B requests its PDF
- THEN the route returns 404 and no PDF is produced

#### Scenario: Render failure

- GIVEN Chromium fails to render
- WHEN the PDF route runs
- THEN the route returns a 5xx error and never throws an uncaught exception
