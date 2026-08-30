# E2E Testing Delta

> **Change**: `sprint-10-free-mode` · **Type**: Delta (MODIFIED)

## Purpose

Drop the Stripe test-checkout flow and update the PDF flow expectation (PDF is now available to every authenticated user). Free audit, signup, mobile viewports, and CI are unchanged.

## REMOVED Requirements

### Requirement: Stripe Test Checkout (E2E-4)

(Reason: Stripe checkout and paid tiers are removed; no checkout flow exists to test.)
(Migration: None — delete `e2e/stripe-checkout.spec.ts`.)

## MODIFIED Requirements

### Requirement: PDF Download Flow (E2E-5)

When a report PDF is requested, then the E2E flow MUST trigger generation and assert the download for an authenticated user (no tier gate).

(Previously: the PDF flow was exercised as a paid/PRO flow.)

#### Scenario: PDF downloads

- GIVEN a completed audit owned by an authenticated user
- WHEN the user requests the PDF
- THEN the PDF file downloads successfully
