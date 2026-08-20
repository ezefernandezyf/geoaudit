import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import { getStripe } from "@/billing/stripe";

/**
 * U1.5 — Stripe client singleton (BLG-4, design U1).
 *
 * BLG-4: the client must fail safe when STRIPE_SECRET_KEY is missing (return
 * null, never throw at import) and be memoized per process via globalThis.
 * The `stripe` package is mocked: the test asserts the constructor contract
 * (key + pinned apiVersion) and the singleton behavior.
 */

const g = globalThis as unknown as { stripe?: unknown };

vi.mock("stripe", () => {
  const StripeMock = vi.fn(function (
    this: unknown,
    key: string,
    config?: { apiVersion?: string },
  ) {
    (this as { key: string }).key = key;
    (this as { config?: { apiVersion?: string } }).config = config;
  });
  return { default: StripeMock };
});

const StripeMock = Stripe as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  delete g.stripe;
  StripeMock.mockClear();
  vi.stubEnv("STRIPE_SECRET_KEY", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getStripe (BLG-4)", () => {
  it("returns null when STRIPE_SECRET_KEY is missing (fail safe)", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");

    expect(getStripe()).toBeNull();
    expect(StripeMock).not.toHaveBeenCalled();
  });

  it("returns null when STRIPE_SECRET_KEY is unset", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", undefined);

    expect(getStripe()).toBeNull();
  });

  it("constructs a Stripe client with the key and a pinned apiVersion", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");

    const stripe = getStripe();

    expect(stripe).not.toBeNull();
    expect(StripeMock).toHaveBeenCalledTimes(1);
    expect(StripeMock).toHaveBeenCalledWith("sk_test_123", {
      apiVersion: expect.stringMatching(/^\d{4}-\d{2}-\d{2}(\.\w+)?$/),
    });
    const config = StripeMock.mock.calls[0][1];
    expect(config?.apiVersion).toBeDefined();
  });

  it("memoizes the instance on globalThis across calls", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");

    const first = getStripe();
    const second = getStripe();

    expect(second).toBe(first);
    expect(StripeMock).toHaveBeenCalledTimes(1);
  });
});
