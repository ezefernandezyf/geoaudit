import { describe, expect, it } from "vitest";
import { InMemoryStore } from "@/lib/rate-limit/store";

/**
 * U5.T1/U5.T2 — RateLimitStore + InMemoryStore (RTL-2). The store is a dumb
 * Map-backed counter: the limiter owns window logic, the store only records
 * `{ count, windowStart }` per key.
 */
describe("InMemoryStore (RTL-2)", () => {
  it("returns null for an unknown key", () => {
    const store = new InMemoryStore();
    expect(store.get("1.2.3.4")).toBeNull();
  });

  it("creates an entry with count 1 and the given window start on first increment", () => {
    const store = new InMemoryStore();
    store.increment("1.2.3.4", 1_000);
    expect(store.get("1.2.3.4")).toEqual({ count: 1, windowStart: 1_000 });
  });

  it("accumulates count within the same window", () => {
    const store = new InMemoryStore();
    store.increment("1.2.3.4", 1_000);
    store.increment("1.2.3.4", 1_000);
    store.increment("1.2.3.4", 1_000);
    expect(store.get("1.2.3.4")).toEqual({ count: 3, windowStart: 1_000 });
  });

  it("resets count to 1 when the limiter starts a new window", () => {
    const store = new InMemoryStore();
    store.increment("1.2.3.4", 1_000);
    store.increment("1.2.3.4", 1_000);
    store.increment("1.2.3.4", 65_000);
    expect(store.get("1.2.3.4")).toEqual({ count: 1, windowStart: 65_000 });
  });

  it("keeps keys isolated from each other", () => {
    const store = new InMemoryStore();
    store.increment("1.2.3.4", 1_000);
    store.increment("5.6.7.8", 1_000);
    expect(store.get("1.2.3.4")).toEqual({ count: 1, windowStart: 1_000 });
    expect(store.get("5.6.7.8")).toEqual({ count: 1, windowStart: 1_000 });
  });

  it("reset removes the entry so the key starts fresh", () => {
    const store = new InMemoryStore();
    store.increment("1.2.3.4", 1_000);
    store.reset("1.2.3.4");
    expect(store.get("1.2.3.4")).toBeNull();
  });

  it("reset on an unknown key is a no-op", () => {
    const store = new InMemoryStore();
    expect(() => store.reset("9.9.9.9")).not.toThrow();
  });
});
