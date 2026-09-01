import type { Prisma } from "@/generated/prisma/client";
import { countAuditsInWindow, FREE_AUDIT_LIMIT } from "@/lib/audit/tier";

/**
 * Plan pill data for the Navbar (SHL-2, U1.9). Pure resolver over an injected
 * structural prisma client (same pattern as `checkTierLimit`): the pill shows
 * the single FREE plan - `used` is measured by Audit rows in the 30-day
 * moving window (TLM-2) and `limit` is the FREE constant. Returns null when
 * no user row exists. No tier or subscription is consulted (TLM-7/8 removed).
 */

/** Structural prisma surface used by `resolveNavPlan` (matches PrismaClient). */
export type NavPlanPrisma = {
  user: {
    findUnique(args: { where: { id: string } }): Promise<{ id: string } | null>;
  };
  audit: {
    count(args: Prisma.AuditCountArgs): Promise<number>;
  };
};

export type NavPlan = { used: number; limit: number };

export async function resolveNavPlan(
  prisma: NavPlanPrisma,
  userId: string,
  now: number,
): Promise<NavPlan | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) return null;

  const used = await countAuditsInWindow(prisma, userId, now);
  return { used, limit: FREE_AUDIT_LIMIT };
}
