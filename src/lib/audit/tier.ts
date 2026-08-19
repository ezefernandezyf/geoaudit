import type { Prisma } from "@/generated/prisma/client";

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
