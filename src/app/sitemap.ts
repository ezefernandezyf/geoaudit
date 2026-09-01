import type { MetadataRoute } from "next";

/**
 * sitemap.xml (LND-10, sprint 9). Generated via the Next App Router metadata
 * route, deriving the public routes programmatically from NEXT_PUBLIC_APP_URL.
 * The crawler/platform engines probe `${origin}/sitemap.xml` - a 200 here is a
 * detectable, rewarded signal.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Public, indexable routes of the marketing/landing surface. */
const PUBLIC_ROUTES = ["", "/login", "/signup"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_ROUTES.map((route) => ({
    url: `${APP_URL}${route}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : 0.8,
  }));
}
