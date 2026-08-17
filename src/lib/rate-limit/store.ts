/**
 * Rate-limit store contract (RTL-2, design U5). The limiter owns the fixed
 * window logic; the store is a dumb per-key counter. Injectable so unit tests
 * assert limiter behavior against a mock without shared state.
 */

export interface RateLimitEntry {
  count: number;
  /** Epoch ms when the current window started. */
  windowStart: number;
}

export interface RateLimitStore {
  get(key: string): RateLimitEntry | null;
  /** Records one request in the given window (replaces an expired window). */
  increment(key: string, windowStart: number): void;
  reset(key: string): void;
}

/**
 * Production default store: an in-memory `Map`. Per-instance only — in
 * serverless each instance gets its own map (see RTL-6 JSDoc on the limiter).
 */
export class InMemoryStore implements RateLimitStore {
  private readonly entries = new Map<string, RateLimitEntry>();

  get(key: string): RateLimitEntry | null {
    return this.entries.get(key) ?? null;
  }

  increment(key: string, windowStart: number): void {
    const entry = this.entries.get(key);
    if (entry !== undefined && entry.windowStart === windowStart) {
      this.entries.set(key, { count: entry.count + 1, windowStart });
    } else {
      this.entries.set(key, { count: 1, windowStart });
    }
  }

  reset(key: string): void {
    this.entries.delete(key);
  }
}
