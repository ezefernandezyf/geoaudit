import { describe, expect, it } from "vitest";
import { buildOgMetadata } from "@/lib/og";

/**
 * C16 — shared OG/Twitter metadata builder (LND-8, PRC-8).
 *
 * The helper is the single source for the OpenGraph + Twitter card fields
 * emitted by the landing and pricing pages (both reuse the page's own
 * title/description and reference the shared 1200×630 `public/og.png` asset).
 */
describe("buildOgMetadata (C1.1, LND-8/PRC-8)", () => {
  const meta = buildOgMetadata({
    title: "Planes y precios",
    description: "Descripción de prueba.",
    path: "/pricing",
  });

  it("keeps the page title and description", () => {
    expect(meta.title).toBe("Planes y precios");
    expect(meta.description).toBe("Descripción de prueba.");
  });

  it("emits the OpenGraph fields (title, description, url, siteName, image, locale, type)", () => {
    expect(meta.openGraph).toMatchObject({
      title: "Planes y precios",
      description: "Descripción de prueba.",
      url: "/pricing",
      siteName: "GeoAudit",
      locale: "es_AR",
      type: "website",
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: expect.any(String),
        },
      ],
    });
  });

  it("emits a summary_large_image Twitter card referencing og.png", () => {
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Planes y precios",
      description: "Descripción de prueba.",
      images: ["/og.png"],
    });
  });

  it("sets the canonical URL to the page path", () => {
    expect(meta.alternates?.canonical).toBe("/pricing");
  });
});
