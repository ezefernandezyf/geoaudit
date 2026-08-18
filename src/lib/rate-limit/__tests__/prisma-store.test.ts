import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@/generated/prisma/client";
import { PrismaRateLimitStore } from "@/lib/rate-limit/prisma-store";
import type { RateLimitEntryClient } from "@/lib/rate-limit/prisma-store";

/**
 * U5.T3 — PrismaRateLimitStore (RTL-6, design U5). The store maps the async
 * limiter contract onto the `rateLimitEntry` delegate with an atomic UPSERT
 * on the composite `(key, windowStart)` PK. The Prisma client is injected and
 * mocked: no real DB, no real Prisma runtime (established pattern U1/U3).
 *
 * `windowStart` is BigInt in the DB (epoch ms overflows Int); the store
 * converts number↔bigint at this boundary — the limiter keeps working with
 * `Date.now()` numbers.
 */

const KEY = "1.2.3.4";
/** Epoch ms far beyond Int32 — proves the number→BigInt boundary (R6). */
const WINDOW_START = 1_752_000_000_000;
const WINDOW_START_BIGINT = BigInt(WINDOW_START);

function mockClient(): {
  client: RateLimitEntryClient;
  findFirst: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
} {
  const findFirst = vi.fn(async () => null);
  const upsert = vi.fn(async () => ({
    key: KEY,
    windowStart: WINDOW_START_BIGINT,
    count: 1,
  }));
  const deleteMany = vi.fn(async () => ({ count: 0 }));
  return {
    client: { rateLimitEntry: { findFirst, upsert, deleteMany } },
    findFirst,
    upsert,
    deleteMany,
  };
}

const findFirstArgs = (key: string): Prisma.RateLimitEntryFindFirstArgs => ({
  where: { key },
  orderBy: { windowStart: "desc" },
});

describe("PrismaRateLimitStore (RTL-6)", () => {
  it("returns null when no row exists for the key", async () => {
    const { client, findFirst } = mockClient();
    const store = new PrismaRateLimitStore(client);

    expect(await store.get(KEY)).toBeNull();
    expect(findFirst).toHaveBeenCalledWith(findFirstArgs(KEY));
  });

  it("maps the latest row to the store entry, converting BigInt to number", async () => {
    const { client, findFirst } = mockClient();
    findFirst.mockResolvedValue({
      key: KEY,
      windowStart: WINDOW_START_BIGINT,
      count: 3,
    });
    const store = new PrismaRateLimitStore(client);

    expect(await store.get(KEY)).toEqual({
      count: 3,
      windowStart: WINDOW_START,
    });
  });

  it("reads the newest window row (orderBy windowStart desc)", async () => {
    const { client, findFirst } = mockClient();
    const store = new PrismaRateLimitStore(client);

    await store.get(KEY);

    expect(findFirst).toHaveBeenCalledWith({
      where: { key: KEY },
      orderBy: { windowStart: "desc" },
    });
  });

  it("increments atomically: upsert on (key, windowStart) with count+1", async () => {
    const { client, upsert } = mockClient();
    const store = new PrismaRateLimitStore(client);

    await store.increment(KEY, WINDOW_START);

    expect(upsert).toHaveBeenCalledWith({
      where: {
        key_windowStart: { key: KEY, windowStart: WINDOW_START_BIGINT },
      },
      create: { key: KEY, windowStart: WINDOW_START_BIGINT, count: 1 },
      update: { count: { increment: 1 } },
    });
  });

  it("converts the number windowStart to BigInt before hitting the DB (R6 boundary)", async () => {
    const { client, upsert } = mockClient();
    const store = new PrismaRateLimitStore(client);

    await store.increment(KEY, WINDOW_START);

    // The upsert must be called with bigint (postgres `bigint`), never the raw
    // epoch-ms number — that is the whole point of the boundary conversion.
    expect(upsert.mock.calls[0][0]).toMatchObject({
      where: { key_windowStart: { windowStart: WINDOW_START_BIGINT } },
      create: { windowStart: WINDOW_START_BIGINT },
    });
  });

  it("reset clears every window row for the key", async () => {
    const { client, deleteMany } = mockClient();
    const store = new PrismaRateLimitStore(client);

    await store.reset(KEY);

    expect(deleteMany).toHaveBeenCalledWith({ where: { key: KEY } });
  });

  it("never reads before incrementing — the upsert itself is the write (atomicity by construction)", async () => {
    const { client, findFirst, upsert } = mockClient();
    const store = new PrismaRateLimitStore(client);

    await store.increment(KEY, WINDOW_START);

    expect(findFirst).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});
