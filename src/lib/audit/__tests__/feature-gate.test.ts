import { describe, expect, it } from "vitest";
import { requirePaidTier } from "@/lib/audit/feature-gate";

/**
 * U2.1/U2.2 — PRO feature gate (TLM-9, design D7).
 *
 * `requirePaidTier(tier)` is the SINGLE enforcement point for the three
 * PRO-gated capabilities (multi-page audit, PDF export, share links): it
 * returns a discriminated union — `{ allowed: true }` for PRO/ENTERPRISE,
 * `{ allowed: false, cta: "upgrade" }` for FREE. Pure function over the
 * existing `isPaidTier` helper; no mocks.
 */
describe("requirePaidTier (TLM-9)", () => {
  it("denies FREE with an upgrade CTA", () => {
    expect(requirePaidTier("FREE")).toEqual({
      allowed: false,
      cta: "upgrade",
    });
  });

  it("allows PRO", () => {
    expect(requirePaidTier("PRO")).toEqual({ allowed: true });
  });

  it("allows ENTERPRISE", () => {
    expect(requirePaidTier("ENTERPRISE")).toEqual({ allowed: true });
  });

  it("discriminated union: only the denial carries the cta", () => {
    const denied = requirePaidTier("FREE");
    const allowed = requirePaidTier("PRO");

    if (denied.allowed) throw new Error("FREE must be denied");
    expect(denied.cta).toBe("upgrade");

    if (!allowed.allowed) throw new Error("PRO must be allowed");
    expect("cta" in allowed).toBe(false);
  });
});
