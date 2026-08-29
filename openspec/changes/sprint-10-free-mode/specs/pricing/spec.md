# Pricing Delta

> **Change**: `sprint-10-free-mode` · **Type**: Delta (REMOVED — capability deleted)

## Purpose

Remove the `/pricing` page and its plan catalog. With Stripe and paid tiers gone, there is no pricing capability. The landing page pricing teaser and "Ver Planes" CTA are removed in the `landing-page` delta.

## REMOVED Requirements

The whole `pricing` capability is removed. On archive, delete `openspec/specs/pricing/`. Every requirement below is removed in full.

| # | Requirement | Reason | Migration |
|---|-------------|--------|-----------|
| PRC-1 | Pricing page route | `/pricing` page deleted | None — landing CTA repoints to signup/audit (`landing-page`) |
| PRC-2 | Plan catalog | No paid plans | None |
| PRC-3 | CTA by auth state | No checkout/portal | None |
| PRC-4 | Action UX states | No billing actions | None |
| PRC-5 | Monthly-only | No plans | None |
| PRC-6 | Pro highlighted | No Pro plan | None |
| PRC-7 | Billing FAQ | No billing | None |
| PRC-8 | OG/SEO tags | Page deleted | None — landing OG tags remain (`landing-page`) |
