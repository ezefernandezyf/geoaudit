import { describe, expect, it } from "vitest";
import {
  BRAND_ADDRESS,
  BRAND_CONTACT_POINT,
  BRAND_DESCRIPTOR,
  BRAND_DOMAIN,
  BRAND_NAME,
  BRAND_REPO,
  FOUNDER,
  FOUNDING_DATE,
  KNOWS_ABOUT,
  ORG_SAME_AS,
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

describe("brand constants (sprint 12 LND-9 real data)", () => {
  it("exposes real sameAs profiles, never invented handles", () => {
    expect(ORG_SAME_AS).toContain("https://github.com/ezefernandezyf");
    expect(ORG_SAME_AS).toContain(
      "https://www.linkedin.com/in/ezequiel-fernandez-59a21a387/",
    );
    expect(ORG_SAME_AS).toContain("https://ezefernandez.com");
  });

  it("exposes the real founder as a Person", () => {
    expect(FOUNDER).toEqual({
      "@type": "Person",
      name: "Ezequiel Alejandro Fernandez",
    });
  });

  it("exposes the real founding date", () => {
    expect(FOUNDING_DATE).toBe("2026-08-05");
  });

  it("exposes the real HQ address (country + locality)", () => {
    expect(BRAND_ADDRESS).toEqual({
      "@type": "PostalAddress",
      addressCountry: "AR",
      addressLocality: "Ciudad Autónoma de Buenos Aires",
    });
  });

  it("exposes a contactPoint tied to the real support email", () => {
    expect(BRAND_CONTACT_POINT).toEqual({
      "@type": "ContactPoint",
      email: SUPPORT_EMAIL,
      contactType: "customer support",
    });
  });

  it("exposes knowsAbout topics covering the GEO product", () => {
    expect(KNOWS_ABOUT).toContain("GEO");
    expect(KNOWS_ABOUT).toContain("AI search visibility");
  });
});
