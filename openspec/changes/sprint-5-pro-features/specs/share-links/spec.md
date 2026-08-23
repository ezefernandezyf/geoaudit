# Share Links Specification

> **Change**: `sprint-5-pro-features` · **Type**: New capability (ADDED)

## Purpose

Let a PRO/Enterprise user share a read-only, public report via a revocable token. `Audit.shareToken` is a nullable unique `randomUUID()`; setting it creates a public `/share/[token]` link that renders the persisted result without re-running the audit; nulling it revokes the link. The public page exposes the report only — never `userId`, email, or tier.

## Requirements

| # | Requirement | Status | Strength | Summary |
|---|-------------|--------|----------|---------|
| SHR-1 | shareToken column | New | MUST | `Audit.shareToken` MUST be a nullable unique `String` (`randomUUID`) |
| SHR-2 | Public route | New | MUST | `/share/[token]` MUST render the persisted result without re-running |
| SHR-3 | Create link | New | MUST | PRO/Enterprise MUST be able to create a share link |
| SHR-4 | Revoke link | New | MUST | Nulling `shareToken` MUST revoke the link |
| SHR-5 | Data exposure isolation | New | MUST | Public page MUST expose report only, never private fields |
| SHR-6 | Missing token 404 | New | MUST | Missing/null/unknown token MUST render 404 |

### Requirement: shareToken Column (SHR-1)

When the schema is migrated, then `Audit` MUST carry a `shareToken` field typed `String? @unique`, populated with `randomUUID()` on creation and nulled on revocation.

#### Scenario: Token is nullable unique

- GIVEN the migrated `Audit` model
- WHEN a share link is created
- THEN `shareToken` is set to a random UUID, unique across audits
- AND nulling it is allowed (nullable)

### Requirement: Public Route (SHR-2)

When a request hits `/share/[token]` with a valid token, then the system MUST render the persisted audit result without re-running the audit.

#### Scenario: Zero re-run

- GIVEN a valid `shareToken`
- WHEN `/share/[token]` is requested
- THEN the persisted `Audit.result` is rendered directly
- AND no audit re-execution occurs

### Requirement: Create Link (SHR-3)

When a PRO or Enterprise user shares an audit, then the system MUST create a `shareToken` and present the public link.

#### Scenario: Paid user creates link

- GIVEN a PRO user with an audit
- WHEN they activate "share"
- THEN a `shareToken` is generated and the `/share/[token]` link is shown

#### Scenario: FREE user blocked

- GIVEN a FREE user
- WHEN they attempt to share an audit
- THEN the action is denied with an upgrade CTA

### Requirement: Revoke Link (SHR-4)

When a user revokes a share link, then the system MUST null `shareToken`, making the public route 404.

#### Scenario: Revoked token 404s

- GIVEN an audit with an active `shareToken`
- WHEN the owner revokes the link
- THEN `shareToken` is null and `/share/[token]` returns 404

### Requirement: Data Exposure Isolation (SHR-5)

When the public share page renders, then the system MUST expose the report content only and MUST NOT expose `userId`, email, tier, or billing data.

#### Scenario: No private fields leaked

- GIVEN a valid shared report
- WHEN the public page renders
- THEN the report renders but `userId`, email, and tier are absent from the payload

### Requirement: Missing Token 404 (SHR-6)

When `/share/[token]` is requested with a missing, null, or unknown token, then the system MUST return 404.

#### Scenario: Unknown token

- GIVEN a request to `/share/not-a-real-token`
- WHEN the page renders
- THEN it returns 404
