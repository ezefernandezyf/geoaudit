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
  ORG_AREA_SERVED,
  ORG_EMPLOYEES,
  ORG_INDUSTRY,
  ORG_SAME_AS,
  SUPPORT_EMAIL,
} from "@/lib/brand";

/**
 * Sprint 11 rebrand (design §Brand): the shared brand module is the single
 * source of truth for every user-visible brand string. Keeping the assertions
 * here locks the constants so no surface (copy, og, layout, emails) can
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

  // LND-19.1 (sprint 19): ORG_SAME_AS grows 3→5 with two more REAL, verified
  // profiles (TikTok @ezefernandezdev + the relevy GitHub repo) so
  // countValidSameAs returns 15 (5×3) - never invented handles (LND-7).
  it("exposes exactly five real sameAs profiles (LND-19.1)", () => {
    expect(ORG_SAME_AS).toEqual([
      "https://github.com/ezefernandezyf",
      "https://www.linkedin.com/in/ezequiel-fernandez-59a21a387/",
      "https://ezefernandez.com",
      "https://www.tiktok.com/@ezefernandezdev",
      "https://github.com/ezefernandezyf/relevy",
    ]);
  });

  it("exposes the real founder as a Person", () => {
    expect(FOUNDER).toEqual({
      "@type": "Person",
      name: "Ezequiel Alejandro Fernandez",
      sameAs: ORG_SAME_AS,
    });
  });

  it("shares the ORG_SAME_AS const by reference (D2 dedupe)", () => {
    // D2 (sprint 16): the founder reuses the SAME array - sameAsUrls dedupes
    // the URLs, so authoritativeness is unchanged (+0) while the nested Person
    // sameAs still earns the +2 expertise signal.
    expect(FOUNDER.sameAs).toBe(ORG_SAME_AS);
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

  // LND-9 (sprint 17, D6): real org attributes confirmed by the founder -
  // country AR (matches BRAND_ADDRESS), Software industry, solo founder
  // without contractors. Never invented placeholders (LND-7).
  it("exposes the real area served (AR)", () => {
    expect(ORG_AREA_SERVED).toBe("AR");
  });

  it("exposes the real industry (Software)", () => {
    expect(ORG_INDUSTRY).toBe("Software");
  });

  it("exposes the real employee count (1, solo founder)", () => {
    expect(ORG_EMPLOYEES).toBe(1);
  });
});
