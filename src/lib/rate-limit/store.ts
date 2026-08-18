/**
 * Rate-limit store contract (RTL-2, design U5). The limiter owns the fixed
 * window logic; the store is a dumb per-key counter. Injectable so unit tests
 * assert limiter behavior against a mock without shared state.
 *
 * The contract is ASYNC by design (design U5): the production store backs the
 * counter with a Prisma atomic UPSERT, which is inherently async. The
 * in-memory implementation below adapts with trivial `async` wrappers.
 */

export interface RateLimitEntry {
  count: number;
  /** Epoch ms when the current window started. */
  windowStart: number;
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  /** Records one request in the given window (replaces an expired window). */
  increment(key: string, windowStart: number): Promise<void>;
  reset(key: string): Promise<void>;
}

/**
 * Dev/test default store: an in-memory `Map`. Per-instance only — in
 * serverless each instance gets its own map (see RTL-6 JSDoc on the limiter).
 */
export class InMemoryStore implements RateLimitStore {
  private readonly entries = new Map<string, RateLimitEntry>();

  async get(key: string): Promise<RateLimitEntry | null> {
    return this.entries.get(key) ?? null;
  }

  async increment(key: string, windowStart: number): Promise<void> {
    const entry = this.entries.get(key);
    if (entry !== undefined && entry.windowStart === windowStart) {
      this.entries.set(key, { count: entry.count + 1, windowStart });
    } else {
      this.entries.set(key, { count: 1, windowStart });
    }
  }

  async reset(key: string): Promise<void> {
    this.entries.delete(key);
  }
}
