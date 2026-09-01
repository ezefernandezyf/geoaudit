import { InMemoryStore } from "./store";
import type { RateLimitStore } from "./store";

export type { RateLimitEntry, RateLimitStore } from "./store";

/**
 * Fixed-window rate limiter for the free audit flow (RTL-1, design U5).
 *
 * Fixed window is deliberately simple: track request counts per window and
 * allow up to `maxRequests` per `windowMs`. The store is ASYNC (design U5):
 * the production default is DB-backed so the budget is shared across
 * serverless instances (RTL-6); `InMemoryStore` is the dev/test default.
 * `RATE_LIMIT_ENABLED=false` is the emergency kill switch (RTL-7).
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
  check(key: string): Promise<RateLimitResult>;
  /** Clears the counter for `key` (used by tests and admin tooling). */
  reset(key: string): Promise<void>;
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
    async check(key: string): Promise<RateLimitResult> {
      // Kill switch: bypass without touching the store (RTL-7).
      if (!enabled) {
        return { allowed: true, remaining: options.maxRequests, resetMs: 0 };
      }

      const now = Date.now();
      const entry = await options.store.get(key);

      // No entry or expired window → start a fresh window with this request.
      if (entry === null || now - entry.windowStart >= options.windowMs) {
        await options.store.increment(key, now);
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

      await options.store.increment(key, entry.windowStart);
      return {
        allowed: true,
        remaining: options.maxRequests - entry.count - 1,
        resetMs: entry.windowStart + options.windowMs - now,
      };
    },

    async reset(key: string): Promise<void> {
      await options.store.reset(key);
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
 * Default store for the singleton (design U5, env-guarded): production uses
 * the shared DB-backed store (RTL-6); dev/test keep the per-instance
 * in-memory store so nothing here requires a DATABASE_URL. Exposed for tests
 * that assert the guard decision.
 *
 * The Prisma modules are imported DYNAMICALLY, only inside the production
 * branch: `@/lib/prisma` throws at module load without DATABASE_URL, so a
 * top-level import would break every dev/test evaluation of this module (U1
 * gotcha). In production the wiring matches every other prisma consumer
 * (`actions.ts`, `audit-runner.tsx`, dashboard page).
 */
export async function createDefaultStore(
  env: NodeJS.ProcessEnv = process.env,
): Promise<RateLimitStore> {
  if (env.NODE_ENV === "production") {
    const [{ PrismaRateLimitStore }, { prisma }] = await Promise.all([
      import("./prisma-store"),
      import("@/lib/prisma"),
    ]);
    return new PrismaRateLimitStore(prisma);
  }
  return new InMemoryStore();
}

let defaultLimiterPromise: Promise<RateLimiter> | null = null;

/**
 * Singleton limiter wired into the free audit Server Action (ADF-9). 5
 * requests per 60s window per client key; disable with
 * `RATE_LIMIT_ENABLED=false`. Async because the default store must be
 * resolved before the first check - memoized per process.
 */
export function getDefaultRateLimiter(): Promise<RateLimiter> {
  defaultLimiterPromise ??= (async () =>
    createRateLimiter({
      store: await createDefaultStore(),
      windowMs: DEFAULT_WINDOW_MS,
      maxRequests: DEFAULT_MAX_REQUESTS,
    }))();
  return defaultLimiterPromise;
}

/** Anonymous audit limiter window (TLM-11, RTL-8): 30-day fixed window. */
export const ANON_AUDIT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
/** Anonymous audit limiter budget (TLM-11, RTL-8): 3 audits per window. */
export const ANON_AUDIT_MAX_REQUESTS = 3;

let anonLimiterPromise: Promise<RateLimiter> | null = null;

/**
 * Anonymous audit limiter (RTL-8, TLM-11): 3 audits per 30-day fixed window
 * per client IP, keyed `anon:{ip}` at the call site so it never collides with
 * the burst limiter's plain-IP keys (RTL-1). Reuses the same default store:
 * production shares the `rateLimitEntry` table with the burst limiter; dev/test
 * keep the in-memory store. Enforced ONLY in the audit runner (authoritative
 * gate, TLM-11) - never pre-checked in the form action - so each completed
 * anonymous audit increments exactly once. Same kill switch as the burst
 * limiter (RTL-7): `RATE_LIMIT_ENABLED=false` bypasses without touching the
 * store. Async because the default store must be resolved before the first
 * check - memoized per process like `getDefaultRateLimiter`.
 */
export function getAnonymousAuditLimiter(): Promise<RateLimiter> {
  anonLimiterPromise ??= (async () =>
    createRateLimiter({
      store: await createDefaultStore(),
      windowMs: ANON_AUDIT_WINDOW_MS,
      maxRequests: ANON_AUDIT_MAX_REQUESTS,
    }))();
  return anonLimiterPromise;
}
