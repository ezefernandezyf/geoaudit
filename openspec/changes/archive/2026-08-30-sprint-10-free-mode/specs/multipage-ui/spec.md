# Multi-Page UI Delta

> **Change**: `sprint-10-free-mode` · **Type**: Delta (MODIFIED)

## Purpose

Lift the PRO gate in the multi-page trigger UI and drop the `upgrade` error code. Every authenticated user can run a multi-page audit; presentation and drill-down are unchanged.

## REMOVED Requirements

### Requirement: PRO Gate in UI (MPU-2)

(Reason: Multi-page audit is now FREE; the `requirePaidTier` upgrade CTA is removed.)
(Migration: The trigger form is enabled for every authenticated user.)

## MODIFIED Requirements

### Requirement: Error Code Copy (MPU-3)

When `multiPageAuditAction` returns an error code, then the UI MUST render neutral Spanish copy for each of `rate-limited`, `invalid`, `auth`, `limit`, and `failed`.

(Previously: also mapped an `upgrade` code, which no longer exists.)

#### Scenario: Invalid URL copy

- GIVEN the action returns `{ error: "invalid" }`
- WHEN the form re-renders
- THEN a neutral Spanish validation message is shown

### Requirement: Navbar Entry (MPU-6)

When the authenticated shell renders, then a navbar link MUST expose the multi-page trigger for every authenticated user.

(Previously: the link was exposed only for eligible paid users.)

#### Scenario: Navbar link

- GIVEN an authenticated user
- WHEN the navbar renders
- THEN a multi-page link is present
