import {
  resolveTier,
  type NormalizedSubscriptionEvent,
  type PriceEnv,
} from "@/billing/types";
import type { SubscriptionStatus, Tier } from "@/lib/contracts/billing";

/**
 * Tier sync (BLG-9, TLM-7, design U3).
 *
 * `aplicaSubscriptionEvent` is the SINGLE place where a Stripe subscription
 * event becomes a tier change: it resolves the tier (pure `resolveTier`, U1),
 * upserts the `Subscription` row by `stripeCustomerId`, and syncs the
 * denormalized `User.tier` ONLY when the value actually changed (TLM-7 — no
 * pointless writes).
 *
 * It is PURE in the sense that its only side effects are the calls on the
 * injected structural tx client (`SubscriptionTxClient`), so tests pass a
 * fake object and assert the exact args (design: "assert exact
 * upsert/update args"). The caller wraps it in `prisma.$transaction`.
 *
 * The event carries `userId` on top of `NormalizedSubscriptionEvent`: the
 * `Subscription.userId` column is required for the upsert `create`, and the
 * handler resolves it from `client_reference_id` (checkout) or from the
 * subscription row by customer id (subscription events).
 */
export type SubscriptionSyncEvent = NormalizedSubscriptionEvent & {
  userId: string;
};

/** Structural prisma transaction client the sync touches (matches `Prisma.TransactionClient`). */
export type SubscriptionTxClient = {
  subscription: {
    upsert(args: {
      where: { stripeCustomerId: string };
      create: {
        userId: string;
        stripeCustomerId: string;
        stripeSubscriptionId: string | null;
        plan: Tier;
        status: SubscriptionStatus;
        currentPeriodEnd: Date | null;
      };
      update: {
        stripeSubscriptionId: string | null;
        plan: Tier;
        status: SubscriptionStatus;
        currentPeriodEnd: Date | null;
      };
    }): Promise<unknown>;
  };
  user: {
    findUnique(args: { where: { id: string } }): Promise<{ tier: Tier } | null>;
    update(args: {
      where: { id: string };
      data: { tier: Tier };
    }): Promise<unknown>;
  };
};

/**
 * Applies one normalized subscription event inside a transaction.
 * Stripe epoch seconds → `Date` for `currentPeriodEnd` (null stays null).
 */
export async function aplicaSubscriptionEvent(
  tx: SubscriptionTxClient,
  event: SubscriptionSyncEvent,
  env: PriceEnv,
): Promise<void> {
  const tier = resolveTier(event.status, event.priceId, env);
  const currentPeriodEnd =
    event.currentPeriodEnd !== null
      ? new Date(event.currentPeriodEnd * 1000)
      : null;

  await tx.subscription.upsert({
    where: { stripeCustomerId: event.customerId },
    create: {
      userId: event.userId,
      stripeCustomerId: event.customerId,
      stripeSubscriptionId: event.subscriptionId,
      plan: tier,
      status: event.status,
      currentPeriodEnd,
    },
    update: {
      stripeSubscriptionId: event.subscriptionId,
      plan: tier,
      status: event.status,
      currentPeriodEnd,
    },
  });

  // TLM-7: sync the denormalized User.tier only when it changed.
  const user = await tx.user.findUnique({ where: { id: event.userId } });
  if (user && user.tier !== tier) {
    await tx.user.update({ where: { id: event.userId }, data: { tier } });
  }
}
