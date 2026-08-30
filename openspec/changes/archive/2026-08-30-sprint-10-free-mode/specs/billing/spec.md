# Billing Delta

> **Change**: `sprint-10-free-mode` · **Type**: Delta (REMOVED — capability deleted)

## Purpose

Remove the Stripe billing capability in its entirety. `src/billing/`, `/api/webhooks/stripe`, checkout/portal Server Actions, the `Subscription`/`StripeWebhookEvent` models, and the `Tier`/`SubscriptionStatus` enums are deleted. No billing capability remains; the audit limit is re-expressed in `tier-limits`.

## REMOVED Requirements

The whole `billing` capability is removed. On archive, delete `openspec/specs/billing/`. Every requirement below is removed in full.

| # | Requirement | Reason | Migration |
|---|-------------|--------|-----------|
| BLG-1 | Unified tier enum | `Tier` enum deleted; no tiers remain | None — limits re-expressed in `tier-limits` |
| BLG-2 | Subscription model | `Subscription` model dropped by down-migration | None — no paid counters |
| BLG-3 | Subscription status enum | `SubscriptionStatus` enum dropped | None |
| BLG-4 | Stripe client singleton | `stripe` dependency removed | None |
| BLG-5 | Checkout action | No checkout without Stripe | None |
| BLG-6 | Portal action | No Customer Portal | None |
| BLG-7 | Webhook signature verification | No webhook route | None |
| BLG-8 | Webhook idempotency | No webhook | None |
| BLG-9 | Tier sync | No tier to sync | None |
| BLG-10 | Handled events | No webhook | None |
