import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createDefaultStore,
  createRateLimiter,
  DEFAULT_MAX_REQUESTS,
  DEFAULT_WINDOW_MS,
  FALLBACK_CLIENT_KEY,
  getDefaultRateLimiter,
  resolveClientKey,
} from "@/lib/rate-limit";
import { InMemoryStore } from "@/lib/rate-limit/store";
import type { RateLimitEntry, RateLimitStore } from "@/lib/rate-limit/store";

/**
 * U5.T1/U5.T3 — fixed-window rate limiter (RTL-1), injectable store (RTL-2),
 * client IP key (RTL-3) and kill switch (RTL-7). The window logic is asserted
 * against an injected mock store; one end-to-end case uses the real
 * InMemoryStore to prove the full cycle (allow → block → reset).
 *
 * The store interface is ASYNC (design U5): every store call is awaited and
 * the mocks return Promises, mirroring the DB-backed store in production.
 */

function mockStore(entry: RateLimitEntry | null): RateLimitStore & {
  get: ReturnType<typeof vi.fn>;
  increment: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
} {
  const get = vi.fn(async () => entry);
  const increment = vi.fn(async () => {});
  const reset = vi.fn(async () => {});
  return { get, increment, reset };
}

const WINDOW = 60_000;
const MAX = 5;
const KEY = "1.2.3.4";
const NOW = new Date("2026-08-17T12:00:00Z").getTime();

describe("createRateLimiter — fixed window (RTL-1)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows a request within the limit and reports the remaining budget", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const store = mockStore({ count: 3, windowStart: NOW });
    const limiter = createRateLimiter({
      store,
      windowMs: WINDOW,
      maxRequests: MAX,
    });

    const result = await limiter.check(KEY);

    expect(result).toEqual({ allowed: true, remaining: 1, resetMs: WINDOW });
    expect(store.increment).toHaveBeenCalledWith(KEY, NOW);
  });

  it("blocks a request that exceeds the limit with remaining 0", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const store = mockStore({ count: 5, windowStart: NOW });
    const limiter = createRateLimiter({
      store,
      windowMs: WINDOW,
      maxRequests: MAX,
    });

    const result = await limiter.check(KEY);

    expect(result).toEqual({ allowed: false, remaining: 0, resetMs: WINDOW });
    expect(store.increment).not.toHaveBeenCalled();
  });

  it("starts a new window when the previous one expired (65s ago)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const store = mockStore({ count: 5, windowStart: NOW - 65_000 });
    const limiter = createRateLimiter({
      store,
      windowMs: WINDOW,
      maxRequests: MAX,
    });

    const result = await limiter.check(KEY);

    expect(result).toEqual({ allowed: true, remaining: 4, resetMs: WINDOW });
    expect(store.increment).toHaveBeenCalledWith(KEY, NOW);
  });

  it("treats a missing entry as the first request of a fresh window", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const store = mockStore(null);
    const limiter = createRateLimiter({
      store,
      windowMs: WINDOW,
      maxRequests: MAX,
    });

    const result = await limiter.check(KEY);

    expect(result).toEqual({ allowed: true, remaining: 4, resetMs: WINDOW });
    expect(store.increment).toHaveBeenCalledWith(KEY, NOW);
  });

  it("enforces the full cycle against the real InMemoryStore", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const limiter = createRateLimiter({
      store: new InMemoryStore(),
      windowMs: WINDOW,
      maxRequests: MAX,
    });

    // Sequential awaits: each check depends on the previous increment landing.
    const decisions: Array<Awaited<ReturnType<typeof limiter.check>>> = [];
    for (let i = 0; i < MAX; i += 1) {
      decisions.push(await limiter.check(KEY));
    }
    expect(decisions.map((d) => d.allowed)).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(await limiter.check(KEY)).toEqual({
      allowed: false,
      remaining: 0,
      resetMs: WINDOW,
    });

    // Window expires → a new window starts with a fresh counter.
    vi.setSystemTime(NOW + 65_000);
    expect(await limiter.check(KEY)).toEqual({
      allowed: true,
      remaining: 4,
      resetMs: WINDOW,
    });
  });

  it("reset delegates to the store for a key", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const store = mockStore({ count: 5, windowStart: NOW });
    const limiter = createRateLimiter({
      store,
      windowMs: WINDOW,
      maxRequests: MAX,
    });

    await limiter.reset(KEY);

    expect(store.reset).toHaveBeenCalledWith(KEY);
  });
});

describe("kill switch (RTL-7)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("bypasses all checks when enabled is false — no store access", async () => {
    const store = mockStore({ count: 5, windowStart: NOW });
    const limiter = createRateLimiter({
      store,
      windowMs: WINDOW,
      maxRequests: MAX,
      enabled: false,
    });

    const result = await limiter.check(KEY);

    expect(result).toEqual({ allowed: true, remaining: MAX, resetMs: 0 });
    expect(store.get).not.toHaveBeenCalled();
    expect(store.increment).not.toHaveBeenCalled();
  });

  it("reads RATE_LIMIT_ENABLED=false from the environment as disabled", async () => {
    vi.stubEnv("RATE_LIMIT_ENABLED", "false");
    const store = mockStore({ count: 5, windowStart: NOW });
    const limiter = createRateLimiter({
      store,
      windowMs: WINDOW,
      maxRequests: MAX,
    });

    expect(await limiter.check(KEY)).toEqual({
      allowed: true,
      remaining: MAX,
      resetMs: 0,
    });
    expect(store.get).not.toHaveBeenCalled();
  });

  it("is enabled when the flag is absent or not 'false'", async () => {
    const store = mockStore({ count: 0, windowStart: NOW });
    const limiter = createRateLimiter({
      store,
      windowMs: WINDOW,
      maxRequests: MAX,
    });

    expect((await limiter.check(KEY)).allowed).toBe(true);
    expect(store.get).toHaveBeenCalled();
  });
});

describe("client key resolution (RTL-3)", () => {
  function fakeHeaders(values: Record<string, string | null>) {
    return { get: (name: string) => values[name] ?? null };
  }

  it("takes the first IP from the x-forwarded-for list", () => {
    expect(
      resolveClientKey(
        fakeHeaders({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }),
      ),
    ).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip when x-forwarded-for is missing", () => {
    expect(resolveClientKey(fakeHeaders({ "x-real-ip": "198.51.100.7" }))).toBe(
      "198.51.100.7",
    );
  });

  it("falls back to a fixed dev key when no client header exists", () => {
    expect(resolveClientKey(fakeHeaders({}))).toBe(FALLBACK_CLIENT_KEY);
    expect(FALLBACK_CLIENT_KEY).toBe("local-dev");
  });

  it("ignores an empty x-forwarded-for and falls back to x-real-ip", () => {
    expect(
      resolveClientKey(
        fakeHeaders({ "x-forwarded-for": " ", "x-real-ip": "198.51.100.7" }),
      ),
    ).toBe("198.51.100.7");
  });

  it("trims surrounding whitespace from the forwarded IP", () => {
    expect(
      resolveClientKey(fakeHeaders({ "x-forwarded-for": "  203.0.113.9  " })),
    ).toBe("203.0.113.9");
  });
});

describe("production defaults (used by the action singleton)", () => {
  it("exports the fixed window and request budget constants", () => {
    expect(DEFAULT_WINDOW_MS).toBe(WINDOW);
    expect(DEFAULT_MAX_REQUESTS).toBe(MAX);
  });
});

/**
 * U5.T4 — default store env guard (design U5): production backs the singleton
 * with the shared Prisma store; dev/test keep the per-instance InMemoryStore
 * so the module (and its tests) never require a DATABASE_URL.
 *
 * The production branch is verified by re-importing the module with
 * NODE_ENV=production after mocking the two DYNAMICALLY imported modules:
 * `@/lib/prisma` (the singleton, which throws without DATABASE_URL) and
 * `./prisma-store` (whose PrismaRateLimitStore receives the prisma client).
 * This proves index.ts stays prisma-import-free in dev/test AND that it wires
 * the real prisma singleton in production.
 */
const { dbStore, receivedPrisma } = vi.hoisted(() => ({
  dbStore: {
    get: vi.fn(async () => null),
    increment: vi.fn(async () => {}),
    reset: vi.fn(async () => {}),
  },
  receivedPrisma: { value: undefined as unknown },
}));

vi.mock("@/lib/rate-limit/prisma-store", () => ({
  PrismaRateLimitStore: class {
    constructor(client: unknown) {
      receivedPrisma.value = client;
    }
    get = dbStore.get;
    increment = dbStore.increment;
    reset = dbStore.reset;
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: { fakePrisma: true } }));

describe("default store env guard (design U5)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("selects InMemoryStore outside production (dev/test)", async () => {
    expect(await createDefaultStore({ NODE_ENV: "test" })).toBeInstanceOf(
      InMemoryStore,
    );
    expect(
      await createDefaultStore({ NODE_ENV: "development" }),
    ).toBeInstanceOf(InMemoryStore);
  });

  it("defaults the singleton to a working store with no DATABASE_URL in dev/test", async () => {
    const limiter = await getDefaultRateLimiter();
    const result = await limiter.check("1.2.3.4");
    expect(result.allowed).toBe(true);
    await limiter.reset("1.2.3.4");
  });

  it("uses the Prisma-backed store in production, wiring the prisma singleton", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const mod = await import("@/lib/rate-limit");

    const limiter = await mod.getDefaultRateLimiter();
    const result = await limiter.check("1.2.3.4");

    expect(result.allowed).toBe(true);
    // The singleton limiter delegated to the DB store...
    expect(dbStore.get).toHaveBeenCalledWith("1.2.3.4");
    expect(dbStore.increment).toHaveBeenCalledWith(
      "1.2.3.4",
      expect.any(Number),
    );
    // ...which received the real prisma singleton as its client.
    expect(receivedPrisma.value).toEqual({ fakePrisma: true });
  });
});
