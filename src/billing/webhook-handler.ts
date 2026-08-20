import type Stripe from "stripe";
import {
  aplicaSubscriptionEvent,
  type SubscriptionSyncEvent,
  type SubscriptionTxClient,
} from "@/billing/apply-subscription-event";
import type { PriceEnv } from "@/billing/types";
import type { SubscriptionStatus } from "@/lib/contracts/billing";

/**
 * Webhook handler (BLG-8/10, design U3).
 *
 * `handleStripeEvent` is the exactly-once gate + dispatcher between the
 * signature-verified route and the pure tier sync:
 *
 * 1. **Idempotency (BLG-8)** — `stripeWebhookEvent.create({ id: event.id })`
 *    first. `StripeWebhookEvent.id` is the Stripe event id (PK), so a replay
 *    hits a unique violation (P2002) and returns `{processed:false}` with
 *    ZERO mutation — exactly-once by construction (design decision A).
 * 2. **Dispatch (BLG-10)** — `checkout.session.completed` expands the
 *    session's subscription and resolves the user from `client_reference_id`;
 *    `customer.subscription.updated` / `.deleted` build the normalized event
 *    from `event.data.object`, resolving the user through the Subscription
 *    row by `stripeCustomerId` (created by U2's `getOrCreateCustomer`).
 *    Each handled type runs `aplicaSubscriptionEvent` inside
 *    `prisma.$transaction`. Unhandled types are acknowledged without
 *    mutating anything.
 *
 * Dependencies are INJECTED (structural prisma subset + Stripe client) so
 * the wiring is unit-testable with fakes, mirroring U2's service pattern.
 */

/** Structural prisma subset the handler touches (matches `PrismaClient`). */
export type WebhookPrisma = {
  stripeWebhookEvent: {
    create(args: { data: { id: string; type: string } }): Promise<unknown>;
  };
  subscription: {
    findUnique(args: {
      where: { stripeCustomerId: string };
    }): Promise<{ userId: string } | null>;
  };
  $transaction<T>(fn: (tx: SubscriptionTxClient) => Promise<T>): Promise<T>;
};

/**
 * Stripe subscription status → our `SubscriptionStatus` enum (BLG-3).
 * Total mapper: unknown statuses (e.g. Stripe's `paused`, not in the schema
 * enum) resolve to `CANCELED` — the terminal non-entitled status — so an
 * ambiguous state can never grant a paid tier (BLG-9: only ACTIVE/TRIALING
 * entitle).
 */
const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "ACTIVE",
  trialing: "TRIALING",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "UNPAID",
  incomplete: "INCOMPLETE",
  incomplete_expired: "INCOMPLETE_EXPIRED",
};

function normalizeSubscriptionStatus(status: string): SubscriptionStatus {
  return STATUS_MAP[status] ?? "CANCELED";
}

/**
 * Stripe SDK v22 quirk: `current_period_end` lives on the Subscription ITEM
 * (the Subscription-level field was dropped from the typings in this SDK
 * generation), so both the price id and the period end are read from
 * `items.data[0]`.
 */
function firstItemOf(
  sub: Stripe.Subscription,
): Stripe.SubscriptionItem | undefined {
  return sub.items.data[0];
}

function envFromProcess(): PriceEnv {
  return {
    pricePro: process.env.STRIPE_PRICE_PRO ?? null,
    priceEnterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? null,
  };
}

/** True when the error is the Prisma unique-constraint violation (P2002). */
function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

/**
 * Processes one verified Stripe event. Returns `{processed}` so callers can
 * observe exactly-once behavior; the route acks 200 either way (BLG-10).
 */
export async function handleStripeEvent(
  prisma: WebhookPrisma,
  stripe: Stripe,
  event: Stripe.Event,
): Promise<{ processed: boolean }> {
  // Idempotency gate (BLG-8): record the event id BEFORE any mutation.
  try {
    await prisma.stripeWebhookEvent.create({
      data: { id: event.id, type: event.type },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) return { processed: false };
    throw error; // real database failure must surface, not be swallowed
  }

  const sync = await buildSyncEvent(prisma, stripe, event);
  if (!sync) return { processed: false }; // unhandled type or unresolvable user

  await prisma.$transaction((tx) =>
    aplicaSubscriptionEvent(tx, sync.event, sync.env),
  );
  return { processed: true };
}

type SyncInput = { event: SubscriptionSyncEvent; env: PriceEnv };

async function buildSyncEvent(
  prisma: WebhookPrisma,
  stripe: Stripe,
  event: Stripe.Event,
): Promise<SyncInput | null> {
  if (event.type === "checkout.session.completed") {
    return buildFromCheckout(stripe, event);
  }
  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    return buildFromSubscription(prisma, event);
  }
  return null; // BLG-10: unhandled types are acknowledged, nothing to sync
}

async function buildFromCheckout(
  stripe: Stripe,
  event: Stripe.Event,
): Promise<SyncInput | null> {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.client_reference_id;
  if (!userId) return null; // orphan session — no user mapping, nothing to sync

  const expanded = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["subscription"],
  });
  const sub = expanded.subscription;
  if (!sub || typeof sub === "string") return null;

  return {
    event: {
      userId,
      customerId: String(sub.customer),
      subscriptionId: sub.id,
      status: normalizeSubscriptionStatus(sub.status),
      priceId: firstItemOf(sub)?.price.id ?? null,
      currentPeriodEnd: firstItemOf(sub)?.current_period_end ?? null,
    },
    env: envFromProcess(),
  };
}

async function buildFromSubscription(
  prisma: WebhookPrisma,
  event: Stripe.Event,
): Promise<SyncInput | null> {
  const sub = event.data.object as Stripe.Subscription;
  const row = await prisma.subscription.findUnique({
    where: { stripeCustomerId: String(sub.customer) },
  });
  if (!row) return null; // no local customer mapping — nothing to sync

  return {
    event: {
      userId: row.userId,
      customerId: String(sub.customer),
      subscriptionId: sub.id,
      status: normalizeSubscriptionStatus(sub.status),
      priceId: firstItemOf(sub)?.price.id ?? null,
      currentPeriodEnd: firstItemOf(sub)?.current_period_end ?? null,
    },
    env: envFromProcess(),
  };
}
