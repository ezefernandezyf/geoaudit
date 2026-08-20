import { z } from "zod";

/**
 * Billing contracts (BLG-1/BLG-3/BLG-5, design U1).
 *
 * Single source of truth for plan/status values, shared server + client.
 * `tierSchema` mirrors the Prisma `Tier` enum — value parity is enforced by
 * contract test (BLG-1: no divergent `Plan` enum).
 */

export const tierSchema = z.enum(["FREE", "PRO", "ENTERPRISE"]);

export type Tier = z.infer<typeof tierSchema>;

export const subscriptionStatusSchema = z.enum([
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "CANCELED",
  "UNPAID",
  "INCOMPLETE",
  "INCOMPLETE_EXPIRED",
]);

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

/**
 * Plans a user can check out for. FREE is excluded: the checkout flow only
 * upgrades to a paid tier (BLG-5).
 */
export const checkoutPlanSchema = z.enum(["PRO", "ENTERPRISE"]);

export type CheckoutPlan = z.infer<typeof checkoutPlanSchema>;
