import { describe, expect, it } from "vitest";
import { emptyBrandResult } from "@/brand/index";
import {
  auditResultFixture,
  auditResultV3Fixture,
} from "@/lib/contracts/__fixtures__/audit-result";
import type { BrandAuthorityResult } from "@/lib/contracts/audit-result";
import {
  DOMAIN_ROWS,
  deriveBrandScore,
  rowScore,
} from "@/report/domain-metrics";

/**
 * U4 - domain-metrics (APT-6, APT-11): the ONE source of truth for "what is
 * the score of a domain row", shared by the web scorecard and the Gemini view
 * model. The brand row is the honesty case: a MEASURED 0
 * is a real value (RGS-11 penalty), an absent or failed engine is `null`
 * ("No medido") - the `rowScore` default `return 0` must never fabricate a
 * measured value for the brand row (APT-11, RAO-16).
 */

describe("DOMAIN_ROWS (APT-6)", () => {
  it("lists six rows with the brand row last", () => {
    expect(DOMAIN_ROWS).toHaveLength(6);
    expect(DOMAIN_ROWS.map((row) => row.engine)).toEqual([
      "crawler",
      "citability",
      "content",
      "schema",
      "platform",
      "brand",
    ]);
    expect(DOMAIN_ROWS[5]).toEqual({
      engine: "brand",
      label: "Autoridad de marca",
    });
  });
});

describe("deriveBrandScore (APT-11)", () => {
  it("returns null when brandAuthority is absent (legacy 2.0.0 rows)", () => {
    expect(deriveBrandScore(undefined)).toBeNull();
  });

  it("returns null when the brand engine failed (status error, BRA-7)", () => {
    expect(deriveBrandScore(emptyBrandResult("rate_limit"))).toBeNull();
  });

  it("returns the measured score on success", () => {
    expect(deriveBrandScore(auditResultV3Fixture.brandAuthority)).toBe(84);
  });

  it("returns a measured 0 as 0 - never conflated with 'not measured'", () => {
    const zeroBrand: BrandAuthorityResult = {
      status: "success",
      reason: null,
      score: 0,
      signals: {
        entityPresence: false,
        entityConsistency: false,
        wikidataCompleteness: 0,
      },
      entity: {
        wikipediaTitle: null,
        wikidataId: null,
        wikidataLabel: null,
      },
    };
    expect(deriveBrandScore(zeroBrand)).toBe(0);
  });
});

describe("rowScore brand case (APT-6/11)", () => {
  it("derives the brand row through deriveBrandScore, never the default 0", () => {
    // Legacy fixture: brandAuthority absent → null, NOT the `return 0` trap.
    expect(rowScore(auditResultFixture, "brand")).toBeNull();
    // v3 fixture: measured 84 → 84.
    expect(rowScore(auditResultV3Fixture, "brand")).toBe(84);
  });

  it("keeps the five legacy engine derivations intact", () => {
    expect(rowScore(auditResultFixture, "crawler")).toBe(71);
    expect(rowScore(auditResultFixture, "citability")).toBe(62);
    expect(rowScore(auditResultFixture, "content")).toBe(65);
    expect(rowScore(auditResultFixture, "schema")).toBe(61);
    expect(rowScore(auditResultFixture, "platform")).toBe(70);
  });

  it("keeps the default 0 for unknown engine keys", () => {
    expect(rowScore(auditResultFixture, "nope")).toBe(0);
  });
});
