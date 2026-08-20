import type { Tier } from "@/lib/contracts/billing";
import {
  countAuditsInWindow,
  hasFreeAuditsLeft,
  hasPaidAuditsLeft,
  isPaidTier,
  resolvePaidCounter,
} from "@/lib/audit/tier";

/**
 * Per-tier enforcement (TLM-3/7/8, design U4).
 *
 * `checkTierLimit` is the SHARED counter-selection (TLM-8) used by BOTH the
 * cheap pre-check in `actions.ts` (TLM-3) and the authoritative gate in
 * `audit-runner.tsx` (TLM-4): FREE users are measured by `Audit` rows in the
 * 30-day moving window, PRO/ENTERPRISE by the Subscription-backed paid
 * counter resolved (with a lazy period-end reset) against `currentPeriodEnd`.
 *
 * `recordPaidAudit` increments the paid counter inside the SAME transaction
 * that creates the Audit row (TLM-7).
 *
 * Both functions are pure orchestrations over injected structural prisma
 * clients (the tier helpers are type-only imports / injected logic), so they
 * are unit-testable with plain mocks — no real DB, no Prisma runtime.
 */

/** Structural prisma surface used by `checkTierLimit` (matches PrismaClient). */
export type TierEnforcementPrisma = {
  user: {
    findUnique(args: {
      where: { id: string };
      include: { subscription: true };
    }): Promise<{
      tier: Tier;
      subscription: {
        plan: Tier;
        auditsUsed: number;
        auditsResetAt: Date | null;
        currentPeriodEnd: Date | null;
      } | null;
    } | null>;
  };
};

/**
 * Authoritative / pre-check gate (TLM-3/4/8): returns `{ allowed }` for a
 * user by their tier. FREE → `countAuditsInWindow` + `hasFreeAuditsLeft`;
 * PRO/ENTERPRISE → `resolvePaidCounter` over the subscription →
 * `hasPaidAuditsLeft`. A missing user row is treated as allowed (no limit to
 * enforce — the audit flow never invokes this for anonymous users, TLM-6).
 */
export async function checkTierLimit(
  prisma: TierEnforcementPrisma,
  userId: string,
  now: number,
): Promise<{ allowed: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
  if (!user) return { allowed: true };

  if (isPaidTier(user.tier)) {
    const sub = user.subscription;
    const used = sub?.auditsUsed ?? 0;
    const { used: effectiveUsed, resetAt } = resolvePaidCounter(
      now,
      used,
      sub?.auditsResetAt ?? null,
      sub?.currentPeriodEnd ?? null,
    );
    void resetAt; // the effective resetAt is applied by recordPaidAudit on write
    return { allowed: hasPaidAuditsLeft(effectiveUsed, user.tier) };
  }

  const count = await countAuditsInWindow(prisma as never, userId, now);
  return { allowed: hasFreeAuditsLeft(count) };
}

/** Structural prisma transaction client used by `recordPaidAudit`. */
export type PaidAuditTx = {
  subscription: {
    findUnique(args: { where: { userId: string } }): Promise<{
      plan: Tier;
      auditsUsed: number;
      auditsResetAt: Date | null;
      currentPeriodEnd: Date | null;
    } | null>;
    update(args: {
      where: { userId: string };
      data: { auditsUsed: { increment: number }; auditsResetAt: Date | null };
    }): Promise<unknown>;
  };
};

/**
 * Increments the paid counter (TLM-7) inside a transaction. Resolves the lazy
 * period-end reset first — when `currentPeriodEnd` has passed, `auditsUsed`
 * resets to 0 (via `resolvePaidCounter`) and `auditsResetAt` advances to the
 * new period before the increment. Caller passes the same `$transaction` that
 * creates the Audit row.
 */
export async function recordPaidAudit(
  tx: PaidAuditTx,
  userId: string,
  now: number,
): Promise<void> {
  const sub = await tx.subscription.findUnique({ where: { userId } });
  const used = sub?.auditsUsed ?? 0;
  const resetAt = resolvePaidCounter(
    now,
    used,
    sub?.auditsResetAt ?? null,
    sub?.currentPeriodEnd ?? null,
  ).resetAt;

  await tx.subscription.update({
    where: { userId },
    data: { auditsUsed: { increment: 1 }, auditsResetAt: resetAt },
  });
}
