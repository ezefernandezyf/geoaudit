import {
  countAuditsInWindow,
  hasFreeAuditsLeft,
  type AuditCountClient,
} from "@/lib/audit/tier";

/**
 * FREE-only enforcement (TLM-3, design decision B).
 *
 * `checkTierLimit` is the SHARED gate used by BOTH the cheap pre-check in
 * `actions.ts` (TLM-3) and the authoritative gate in `audit-runner.tsx`
 * (TLM-4): every authenticated user is measured by `Audit` rows in the 30-day
 * moving window (TLM-2), so both checks always agree.
 *
 * Sprint 10 (decision B): `recordPaidAudit` and the paid counter path are
 * deleted with the billing capability (TLM-7/8 removed). The single gate stays
 * here — one tested enforcement point instead of inlining the two helpers at
 * the three call sites.
 *
 * Pure orchestration over an injected structural prisma client (the tier
 * helpers are type-only imports / injected logic), so it is unit-testable with
 * plain mocks — no real DB, no Prisma runtime.
 */

/**
 * Authoritative / pre-check gate (TLM-3/4): counts the user's audits in the
 * 30-day window and applies the FREE limit. A user with no audit rows in the
 * window (or no user row at all — the audit flow never invokes this for
 * anonymous users, TLM-6) counts 0, which is under the limit.
 */
export async function checkTierLimit(
  prisma: AuditCountClient,
  userId: string,
  now: number,
): Promise<{ allowed: boolean }> {
  const count = await countAuditsInWindow(prisma, userId, now);
  return { allowed: hasFreeAuditsLeft(count) };
}
