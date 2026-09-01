import { describe, expect, it } from "vitest";
import { InMemoryStore } from "@/lib/rate-limit/store";

/**
 * U5.T1/U5.T2 - RateLimitStore + InMemoryStore (RTL-2, design U5). The store is
 * a dumb Map-backed counter: the limiter owns window logic, the store only
 * records `{ count, windowStart }` per key.
 *
 * The store contract is ASYNC (design decision U5): the DB-backed store's
 * UPSERT is inherently async, so the whole interface is Promise-returning and
 * InMemoryStore adapts with trivial `async` wrappers.
 */
describe("InMemoryStore (RTL-2)", () => {
  it("exposes an async interface - every method returns a Promise", () => {
    const store = new InMemoryStore();
    expect(store.get("1.2.3.4")).toBeInstanceOf(Promise);
    expect(store.increment("1.2.3.4", 1_000)).toBeInstanceOf(Promise);
    expect(store.reset("1.2.3.4")).toBeInstanceOf(Promise);
  });

  it("returns null for an unknown key", async () => {
    const store = new InMemoryStore();
    expect(await store.get("1.2.3.4")).toBeNull();
  });

  it("creates an entry with count 1 and the given window start on first increment", async () => {
    const store = new InMemoryStore();
    await store.increment("1.2.3.4", 1_000);
    expect(await store.get("1.2.3.4")).toEqual({
      count: 1,
      windowStart: 1_000,
    });
  });

  it("accumulates count within the same window", async () => {
    const store = new InMemoryStore();
    await store.increment("1.2.3.4", 1_000);
    await store.increment("1.2.3.4", 1_000);
    await store.increment("1.2.3.4", 1_000);
    expect(await store.get("1.2.3.4")).toEqual({
      count: 3,
      windowStart: 1_000,
    });
  });

  it("resets count to 1 when the limiter starts a new window", async () => {
    const store = new InMemoryStore();
    await store.increment("1.2.3.4", 1_000);
    await store.increment("1.2.3.4", 1_000);
    await store.increment("1.2.3.4", 65_000);
    expect(await store.get("1.2.3.4")).toEqual({
      count: 1,
      windowStart: 65_000,
    });
  });

  it("keeps keys isolated from each other", async () => {
    const store = new InMemoryStore();
    await store.increment("1.2.3.4", 1_000);
    await store.increment("5.6.7.8", 1_000);
    expect(await store.get("1.2.3.4")).toEqual({
      count: 1,
      windowStart: 1_000,
    });
    expect(await store.get("5.6.7.8")).toEqual({
      count: 1,
      windowStart: 1_000,
    });
  });

  it("reset removes the entry so the key starts fresh", async () => {
    const store = new InMemoryStore();
    await store.increment("1.2.3.4", 1_000);
    await store.reset("1.2.3.4");
    expect(await store.get("1.2.3.4")).toBeNull();
  });

  it("reset on an unknown key is a no-op", async () => {
    const store = new InMemoryStore();
    await expect(store.reset("9.9.9.9")).resolves.toBeUndefined();
  });
});
