import type { Prisma } from "@/generated/prisma/client";
import type { Tier } from "@/lib/contracts/billing";

/**
 * FREE tier limits (TLM-1/TLM-2, design U3).
 *
 * Pure helpers over an injected Prisma client, so the counting logic is
 * unit-testable with a plain mock — no real DB and no Prisma runtime are
 * pulled into the module (type-only import).
 */

/**
 * Minimal structural surface of the Prisma audit delegate used here: only the
 * `count` capability with the generated `AuditCountArgs`. Both a real
 * PrismaClient (its generic delegate method satisfies this) and a plain mock
 * (`{ audit: { count: vi.fn(...) } }`) are assignable.
 */
export type AuditCountClient = {
  audit: {
    count(args: Prisma.AuditCountArgs): Promise<number>;
  };
};

/** TLM-2: FREE users get 3 audits per 30-day moving window. */
export const FREE_AUDIT_LIMIT = 3;

/** TLM-2: window length — 30 days in milliseconds. */
export const FREE_AUDIT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * True while the user is still under the limit; false once `count` reaches
 * `FREE_AUDIT_LIMIT` (the next audit is then blocked).
 */
export function hasFreeAuditsLeft(count: number): boolean {
  return count < FREE_AUDIT_LIMIT;
}

/**
 * Counts the user's `Audit` rows created within the 30-day moving window
 * ending at `now` (TLM-2 scenario "Counting the moving window").
 *
 * Structural param: only the `count` capability of the audit delegate is
 * required, so tests pass a plain mock — no real Prisma runtime needed.
 */
export function countAuditsInWindow(
  prisma: AuditCountClient,
  userId: string,
  now: number,
): Promise<number> {
  return prisma.audit.count({
    where: {
      userId,
      createdAt: { gte: new Date(now - FREE_AUDIT_WINDOW_MS) },
    },
  });
}

/**
 * Paid-tier limits per billing period (TLM-2, design U4): PRO = 10,
 * ENTERPRISE = 50. FREE is NOT in this map — it uses the 30-day moving window
 * (FREE_AUDIT_LIMIT) instead (TLM-8 counter selection).
 */
export const PAID_TIER_LIMITS = { PRO: 10, ENTERPRISE: 50 } as const;

/**
 * Per-tier audit limit (TLM-2): FREE → 3 (moving window), PRO/ENTERPRISE →
 * their `PAID_TIER_LIMITS` value (per billing period).
 */
export function getTierLimit(tier: Tier): number {
  if (tier === "FREE") return FREE_AUDIT_LIMIT;
  return PAID_TIER_LIMITS[tier];
}

/**
 * True while a paid user is still under their period limit; false once `used`
 * reaches the tier limit (TLM-2, "Pro gets ten per period").
 */
export function hasPaidAuditsLeft(used: number, tier: Tier): boolean {
  return used < getTierLimit(tier);
}

/**
 * True for PRO/ENTERPRISE — the tiers that use the Subscription-backed paid
 * counter instead of the FREE 30-day window (TLM-8 counter selection).
 */
export function isPaidTier(tier: Tier): boolean {
  return tier === "PRO" || tier === "ENTERPRISE";
}

/**
 * Lazy period-end reset for the paid counter (TLM-7, design U4 — NO cron).
 *
 * Pure: given the moment `now`, the current `used`/`resetAt` and the Stripe
 * `periodEnd`, returns the effective counter state. When `periodEnd` has
 * passed (<= now), the counter resets to `{ used: 0, resetAt: periodEnd }`;
 * otherwise it stays `{ used, resetAt }` unchanged. `periodEnd` null means no
 * boundary has been set yet — the counter is kept as-is.
 */
export function resolvePaidCounter(
  now: number,
  used: number,
  resetAt: Date | null,
  periodEnd: Date | null,
): { used: number; resetAt: Date | null } {
  if (periodEnd !== null && periodEnd.getTime() <= now) {
    return { used: 0, resetAt: periodEnd };
  }
  return { used, resetAt };
}
