import { describe, expect, it } from "vitest";
import {
  BRAND_DESCRIPTOR,
  BRAND_DOMAIN,
  BRAND_NAME,
  BRAND_REPO,
  SUPPORT_EMAIL,
} from "@/lib/brand";

/**
 * Sprint 11 rebrand (design §Brand): the shared brand module is the single
 * source of truth for every user-visible brand string. Keeping the assertions
 * here locks the constants so no surface (copy, og, layout, PDF, emails) can
 * drift back to "GeoAudit" or the old support address.
 */
describe("brand constants (sprint 11 rebrand)", () => {
  it("names the product Relevy", () => {
    expect(BRAND_NAME).toBe("Relevy");
  });

  it("uses the production domain relevy.app", () => {
    expect(BRAND_DOMAIN).toBe("relevy.app");
  });

  it("uses the shared support email", () => {
    expect(SUPPORT_EMAIL).toBe("ezefernandezyf@gmail.com");
  });

  it("keeps the product descriptor short and descriptive", () => {
    expect(BRAND_DESCRIPTOR).toBe("AI Visibility & GEO Audit");
  });

  it("points the repo link to the renamed Relevy repository", () => {
    expect(BRAND_REPO).toBe("https://github.com/ezefernandezyf/relevy");
  });
});
