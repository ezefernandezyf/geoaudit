import { InMemoryStore } from "./store";
import type { RateLimitStore } from "./store";

export type { RateLimitEntry, RateLimitStore } from "./store";

/**
 * Fixed-window rate limiter for the free audit flow (RTL-1, design U5).
 *
 * Fixed window is deliberately simple: track request counts per window and
 * allow up to `maxRequests` per `windowMs`. Best-effort only — the in-memory
 * store is per-instance, so in serverless deployments each instance enforces
 * its own budget and the effective limit is multiplied by the instance count.
 * A real shared limiter backed by the DB lands in Sprint 3 (RTL-6); the
 * `RATE_LIMIT_ENABLED=false` env flag is the emergency kill switch (RTL-7).
 */

export type RateLimitResult = {
  allowed: boolean;
  /** Requests still available in the current window (0 when blocked). */
  remaining: number;
  /** Milliseconds until the current window resets. */
  resetMs: number;
};

export interface RateLimiterOptions {
  store: RateLimitStore;
  windowMs: number;
  maxRequests: number;
  /** Kill switch (RTL-7). Defaults to `RATE_LIMIT_ENABLED !== "false"`. */
  enabled?: boolean;
}

export interface RateLimiter {
  /** Records one request for `key` and returns the decision for it. */
  check(key: string): RateLimitResult;
  /** Clears the counter for `key` (used by tests and admin tooling). */
  reset(key: string): void;
}

export const DEFAULT_WINDOW_MS = 60_000;
export const DEFAULT_MAX_REQUESTS = 5;

/** RTL-7: the limiter is enabled unless the env flag is explicitly "false". */
export function isRateLimitEnabled(): boolean {
  return process.env.RATE_LIMIT_ENABLED !== "false";
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const enabled = options.enabled ?? isRateLimitEnabled();

  return {
    check(key: string): RateLimitResult {
      // Kill switch: bypass without touching the store (RTL-7).
      if (!enabled) {
        return { allowed: true, remaining: options.maxRequests, resetMs: 0 };
      }

      const now = Date.now();
      const entry = options.store.get(key);

      // No entry or expired window → start a fresh window with this request.
      if (entry === null || now - entry.windowStart >= options.windowMs) {
        options.store.increment(key, now);
        return {
          allowed: true,
          remaining: options.maxRequests - 1,
          resetMs: options.windowMs,
        };
      }

      // Over the budget → block, reporting when the window resets.
      if (entry.count >= options.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetMs: entry.windowStart + options.windowMs - now,
        };
      }

      options.store.increment(key, entry.windowStart);
      return {
        allowed: true,
        remaining: options.maxRequests - entry.count - 1,
        resetMs: entry.windowStart + options.windowMs - now,
      };
    },

    reset(key: string): void {
      options.store.reset(key);
    },
  };
}

/**
 * Client key for the limiter (RTL-3): first value of `x-forwarded-for`,
 * falling back to `x-real-ip`. When neither header exists (e.g. local dev
 * without a proxy) a fixed key is used so every local request shares one
 * budget instead of crashing.
 */
export const FALLBACK_CLIENT_KEY = "local-dev";

export function resolveClientKey(headers: {
  get(name: string): string | null;
}): string {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return FALLBACK_CLIENT_KEY;
}

/**
 * Singleton wired into the free audit Server Action (ADF-9). 5 requests per
 * 60s window per client key; disable with `RATE_LIMIT_ENABLED=false`.
 */
export const defaultRateLimiter = createRateLimiter({
  store: new InMemoryStore(),
  windowMs: DEFAULT_WINDOW_MS,
  maxRequests: DEFAULT_MAX_REQUESTS,
});
