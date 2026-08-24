import type { Prisma } from "@/generated/prisma/client";
import type { Tier } from "@/lib/contracts/billing";
import {
  countAuditsInWindow,
  getTierLimit,
  isPaidTier,
  resolvePaidCounter,
} from "@/lib/audit/tier";

/**
 * Plan pill data for the Navbar (SHL-2, U1.9). Pure resolver over an injected
 * structural prisma client (same pattern as `checkTierLimit`): FREE users are
 * measured by Audit rows in the 30-day moving window (TLM-2), paid users by
 * the Subscription-backed counter resolved against `currentPeriodEnd`
 * (TLM-7/8). Returns null when no user row exists.
 */

/** Structural prisma surface used by `resolveNavPlan` (matches PrismaClient). */
export type NavPlanPrisma = {
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
  audit: {
    count(args: Prisma.AuditCountArgs): Promise<number>;
  };
};

export type NavPlan = { tier: Tier; used: number; limit: number };

export async function resolveNavPlan(
  prisma: NavPlanPrisma,
  userId: string,
  now: number,
): Promise<NavPlan | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
  if (!user) return null;

  const limit = getTierLimit(user.tier);

  if (isPaidTier(user.tier)) {
    const sub = user.subscription;
    const used = sub
      ? resolvePaidCounter(
          now,
          sub.auditsUsed,
          sub.auditsResetAt,
          sub.currentPeriodEnd,
        ).used
      : 0;
    return { tier: user.tier, used, limit };
  }

  const used = await countAuditsInWindow(prisma, userId, now);
  return { tier: user.tier, used, limit };
}
