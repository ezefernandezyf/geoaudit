# Share Links Specification (Delta)

> **Change**: `sprint-6-ui-redesign` · **Type**: Delta (MODIFIED)

## Purpose

Replace the inline share panel with a PRO-gated share modal (create, copy, revoke). Token semantics, public route, data isolation and 404 behavior are unchanged.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| SHR-3 | Create link | Partial | MUST | Create/present the link via the share modal |
| SHR-7 | Share modal | New | MUST | Modal with copy + revoke actions, PRO-gated entry |

### Requirement: Create Link (SHR-3)

When a PRO/Enterprise user shares an audit, then the system MUST create the `shareToken` and present the public link inside the share modal.

#### Scenario: Paid user creates the link in the modal

- GIVEN a PRO user with an audit
- WHEN they activate "Compartir"
- THEN a `shareToken` is generated and the `/share/[token]` link is shown in the modal

#### Scenario: FREE user blocked

- GIVEN a FREE user
- WHEN they attempt to share
- THEN the action is denied with an upgrade CTA

### Requirement: Share Modal (SHR-7)

When the share modal renders, then it MUST expose "Copiar enlace" and "Revocar" actions that copy and revoke the token respectively.

#### Scenario: Copy and revoke

- GIVEN an active share link
- WHEN the owner copies it
- THEN the link is copied to the clipboard
- AND when they revoke it, `shareToken` is nulled and the public route 404s
