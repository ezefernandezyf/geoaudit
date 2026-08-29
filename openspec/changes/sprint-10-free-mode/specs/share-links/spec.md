# Share Links Delta

> **Change**: `sprint-10-free-mode` · **Type**: Delta (MODIFIED)

## Purpose

Lift the PRO gate on share-link creation. Any authenticated user can create and revoke a share link; the revocable-token contract, public route, and data-exposure isolation are unchanged.

## MODIFIED Requirements

### Requirement: Create Link (SHR-3)

When an authenticated user shares an audit, then the system MUST create a `shareToken` and present the public link. There is no tier gate.

(Previously: only PRO/Enterprise users could create a link; FREE users were denied with an upgrade CTA.)

#### Scenario: Authenticated user creates link

- GIVEN an authenticated user with an audit
- WHEN they activate "share"
- THEN a `shareToken` is generated and the `/share/[token]` link is shown

### Requirement: Data Exposure Isolation (SHR-5)

When the public share page renders, then the system MUST expose the report content only and MUST NOT expose `userId`, email, or any account data.

(Previously: the payload also guarded the `tier` field, which no longer exists.)

#### Scenario: No private fields leaked

- GIVEN a valid shared report
- WHEN the public page renders
- THEN the report renders but `userId` and email are absent from the payload
