import type { Prisma } from "@/generated/prisma/client";
import type { RateLimitEntry, RateLimitStore } from "./store";

/**
 * DB-backed rate-limit store (RTL-6, design U5).
 *
 * The in-memory store is per-instance: in serverless each instance enforces
 * its own budget, multiplying the effective limit by the instance count. This
 * store shares state across instances through the `rateLimitEntry` table,
 * using an atomic UPSERT on the composite `(key, windowStart)` primary key -
 * no read-modify-write race between concurrent requests.
 *
 * `windowStart` is persisted as `BigInt` (postgres `bigint`): epoch ms
 * overflow Prisma's `Int` (2^31). The limiter works with plain `Date.now()`
 * numbers; the number↔bigint conversion happens at THIS boundary.
 *
 * The Prisma client is injected and typed structurally (same pattern as
 * `AuditCountClient` in tier.ts): only the `rateLimitEntry` delegate
 * capabilities the store uses, so both a real PrismaClient and a plain mock
 * are assignable - this module pulls in no Prisma runtime.
 */

/** Row shape as persisted: `windowStart` is BigInt in the database. */
type RateLimitRow = {
  key: string;
  windowStart: bigint;
  count: number;
};

/**
 * Minimal structural surface of the Prisma `rateLimitEntry` delegate used
 * here (same pattern as `AuditCountClient` in tier.ts): only the capabilities
 * the store uses, so both a real PrismaClient and a plain mock are assignable.
 * The generated delegate's generic methods satisfy these signatures.
 */
export interface RateLimitEntryClient {
  rateLimitEntry: {
    findFirst(
      args: Prisma.RateLimitEntryFindFirstArgs,
    ): Promise<RateLimitRow | null>;
    upsert(args: Prisma.RateLimitEntryUpsertArgs): Promise<RateLimitRow>;
    deleteMany(
      args: Prisma.RateLimitEntryDeleteManyArgs,
    ): Promise<{ count: number }>;
  };
}

export class PrismaRateLimitStore implements RateLimitStore {
  constructor(private readonly prisma: RateLimitEntryClient) {}

  /**
   * Latest window row for `key` (newest `windowStart` first). Returns null
   * when the key never hit the limiter.
   */
  async get(key: string): Promise<RateLimitEntry | null> {
    const row = await this.prisma.rateLimitEntry.findFirst({
      where: { key },
      orderBy: { windowStart: "desc" },
    });
    return row
      ? { count: row.count, windowStart: Number(row.windowStart) }
      : null;
  }

  /**
   * Atomic UPSERT on `(key, windowStart)`: creates the row with count 1 on
   * first hit, or increments it when the same window row already exists.
   * The `number` window start is converted to `BigInt` at this boundary.
   */
  async increment(key: string, windowStart: number): Promise<void> {
    const ws = BigInt(windowStart);
    await this.prisma.rateLimitEntry.upsert({
      where: { key_windowStart: { key, windowStart: ws } },
      create: { key, windowStart: ws, count: 1 },
      update: { count: { increment: 1 } },
    });
  }

  /** Clears every window row for `key` (used by tests and admin tooling). */
  async reset(key: string): Promise<void> {
    await this.prisma.rateLimitEntry.deleteMany({ where: { key } });
  }
}
