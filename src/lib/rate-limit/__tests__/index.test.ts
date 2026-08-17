import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createRateLimiter,
  DEFAULT_MAX_REQUESTS,
  DEFAULT_WINDOW_MS,
  FALLBACK_CLIENT_KEY,
  resolveClientKey,
} from "@/lib/rate-limit";
import { InMemoryStore } from "@/lib/rate-limit/store";
import type { RateLimitEntry, RateLimitStore } from "@/lib/rate-limit/store";

/**
 * U5.T1/U5.T3 — fixed-window rate limiter (RTL-1), injectable store (RTL-2),
 * client IP key (RTL-3) and kill switch (RTL-7). The window logic is asserted
 * against an injected mock store; one end-to-end case uses the real
 * InMemoryStore to prove the full cycle (allow → block → reset).
 */

function mockStore(entry: RateLimitEntry | null): RateLimitStore & {
  get: ReturnType<typeof vi.fn>;
  increment: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
} {
  const get = vi.fn(() => entry);
  const increment = vi.fn();
  const reset = vi.fn();
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

  it("allows a request within the limit and reports the remaining budget", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const store = mockStore({ count: 3, windowStart: NOW });
    const limiter = createRateLimiter({
      store,
      windowMs: WINDOW,
      maxRequests: MAX,
    });

    const result = limiter.check(KEY);

    expect(result).toEqual({ allowed: true, remaining: 1, resetMs: WINDOW });
    expect(store.increment).toHaveBeenCalledWith(KEY, NOW);
  });

  it("blocks a request that exceeds the limit with remaining 0", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const store = mockStore({ count: 5, windowStart: NOW });
    const limiter = createRateLimiter({
      store,
      windowMs: WINDOW,
      maxRequests: MAX,
    });

    const result = limiter.check(KEY);

    expect(result).toEqual({ allowed: false, remaining: 0, resetMs: WINDOW });
    expect(store.increment).not.toHaveBeenCalled();
  });

  it("starts a new window when the previous one expired (65s ago)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const store = mockStore({ count: 5, windowStart: NOW - 65_000 });
    const limiter = createRateLimiter({
      store,
      windowMs: WINDOW,
      maxRequests: MAX,
    });

    const result = limiter.check(KEY);

    expect(result).toEqual({ allowed: true, remaining: 4, resetMs: WINDOW });
    expect(store.increment).toHaveBeenCalledWith(KEY, NOW);
  });

  it("treats a missing entry as the first request of a fresh window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const store = mockStore(null);
    const limiter = createRateLimiter({
      store,
      windowMs: WINDOW,
      maxRequests: MAX,
    });

    const result = limiter.check(KEY);

    expect(result).toEqual({ allowed: true, remaining: 4, resetMs: WINDOW });
    expect(store.increment).toHaveBeenCalledWith(KEY, NOW);
  });

  it("enforces the full cycle against the real InMemoryStore", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const limiter = createRateLimiter({
      store: new InMemoryStore(),
      windowMs: WINDOW,
      maxRequests: MAX,
    });

    const decisions = Array.from({ length: MAX }, () => limiter.check(KEY));
    expect(decisions.map((d) => d.allowed)).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(limiter.check(KEY)).toEqual({
      allowed: false,
      remaining: 0,
      resetMs: WINDOW,
    });

    // Window expires → a new window starts with a fresh counter.
    vi.setSystemTime(NOW + 65_000);
    expect(limiter.check(KEY)).toEqual({
      allowed: true,
      remaining: 4,
      resetMs: WINDOW,
    });
  });

  it("reset delegates to the store for a key", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const store = mockStore({ count: 5, windowStart: NOW });
    const limiter = createRateLimiter({
      store,
      windowMs: WINDOW,
      maxRequests: MAX,
    });

    limiter.reset(KEY);

    expect(store.reset).toHaveBeenCalledWith(KEY);
  });
});

describe("kill switch (RTL-7)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("bypasses all checks when enabled is false — no store access", () => {
    const store = mockStore({ count: 5, windowStart: NOW });
    const limiter = createRateLimiter({
      store,
      windowMs: WINDOW,
      maxRequests: MAX,
      enabled: false,
    });

    const result = limiter.check(KEY);

    expect(result).toEqual({ allowed: true, remaining: MAX, resetMs: 0 });
    expect(store.get).not.toHaveBeenCalled();
    expect(store.increment).not.toHaveBeenCalled();
  });

  it("reads RATE_LIMIT_ENABLED=false from the environment as disabled", () => {
    vi.stubEnv("RATE_LIMIT_ENABLED", "false");
    const store = mockStore({ count: 5, windowStart: NOW });
    const limiter = createRateLimiter({
      store,
      windowMs: WINDOW,
      maxRequests: MAX,
    });

    expect(limiter.check(KEY)).toEqual({
      allowed: true,
      remaining: MAX,
      resetMs: 0,
    });
    expect(store.get).not.toHaveBeenCalled();
  });

  it("is enabled when the flag is absent or not 'false'", () => {
    const store = mockStore({ count: 0, windowStart: NOW });
    const limiter = createRateLimiter({
      store,
      windowMs: WINDOW,
      maxRequests: MAX,
    });

    expect(limiter.check(KEY).allowed).toBe(true);
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
