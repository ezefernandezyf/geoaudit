# Delta for Legal Pages

> **Change**: `sprint-11-rebrand-polish` · **Type**: New requirement (ADDED)

## ADDED Requirements

### Requirement: Free-Model Legal Copy (LGL-6)

The legal copy (`LEGAL_COPY`) MUST describe a single free model. It MUST NOT contain paid plans, billing, subscription, or payment-processing references. The "Planes y facturación" terms section MUST be rewritten or removed, and the privacy policy MUST NOT mention processing payments.

#### Scenario: Terms has no paid plans

- GIVEN the `/terms` content
- WHEN it is inspected
- THEN no paid plans, billing, or pricing section appears

#### Scenario: Privacy has no payments

- GIVEN the `/privacy` content
- WHEN it is inspected
- THEN no payment-processing reference appears
