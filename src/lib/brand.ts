/**
 * Shared brand constants (sprint 11 rebrand, design §Brand).
 *
 * Single source of truth for every user-visible brand string (copy, og
 * metadata, layout JSON-LD, emails). Surfaces import these
 * constants instead of hardcoding literals so the brand can never drift.
 */

/** Product name shown in every user-visible surface. */
export const BRAND_NAME = "Relevy";

/** Production domain (owns relevy.app; Vercel alias replaced the legacy one). */
export const BRAND_DOMAIN = "relevy.app";

/** Shared support inbox - MUST NOT be hardcoded anywhere else (SHL-8, PRF-6). */
export const SUPPORT_EMAIL = "ezefernandezyf@gmail.com";

/** One-line descriptor used in OG alt text and metadata summaries. */
export const BRAND_DESCRIPTOR = "AI Visibility & GEO Audit";

/** Public repository (renamed geo-saas → relevy on GitHub). */
export const BRAND_REPO = "https://github.com/ezefernandezyf/relevy";

/**
 * Real, verifiable org profiles for JSON-LD `sameAs` (LND-9, LND-7 honesty).
 * GitHub + LinkedIn + personal site - never invented handles. LND-19.1
 * (sprint 19): +TikTok @ezefernandezdev and the relevy GitHub repo (both
 * HTTP 200 verified) → 5 profiles → countValidSameAs 15 (5×3). FOUNDER
 * inherits the same array by reference (D2 dedupe).
 */
export const ORG_SAME_AS = [
  "https://github.com/ezefernandezyf",
  "https://www.linkedin.com/in/ezequiel-fernandez-59a21a387/",
  "https://ezefernandez.com",
  "https://www.tiktok.com/@ezefernandezdev",
  "https://github.com/ezefernandezyf/relevy",
] as const;

/** Real founder (Person) - author of Relevy, never a placeholder (LND-9). */
export const FOUNDER = {
  "@type": "Person",
  name: "Ezequiel Alejandro Fernandez",
  // LND-9 (sprint 16): the nested founder Person shares the SAME real profiles
  // as the Organization - a distinct expertise signal (+2) while sameAsUrls
  // dedupes them, so authoritativeness is unchanged (design D2).
  sameAs: ORG_SAME_AS,
} as const;

/** Real founding date (ISO) - Relevy was incorporated on this date (LND-9). */
export const FOUNDING_DATE = "2026-08-05";

/** Real HQ address (LND-9) - country and city only, nothing invented. */
export const BRAND_ADDRESS = {
  "@type": "PostalAddress",
  addressCountry: "AR",
  addressLocality: "Ciudad Autónoma de Buenos Aires",
} as const;

/** Real topics the product covers, used by JSON-LD `knowsAbout` (LND-9). */
export const KNOWS_ABOUT = [
  "GEO",
  "Generative Engine Optimization",
  "AI search visibility",
  "GEO audit",
  "SEO",
] as const;

/** Shared support contactPoint for JSON-LD `contactPoint` (LND-9). */
export const BRAND_CONTACT_POINT = {
  "@type": "ContactPoint",
  email: SUPPORT_EMAIL,
  contactType: "customer support",
} as const;

/**
 * Real org attributes for JSON-LD `areaServed` / `industry` /
 * `numberOfEmployees` (LND-9, sprint 17 D6). Confirmed by the founder:
 * country AR (matches BRAND_ADDRESS), Software industry, solo founder
 * without contractors. `award` is deliberately OMITTED - no real award
 * exists and inventing one would violate LND-7 (the schema engine keeps
 * reporting `missing_recommended` for award, honesty over score).
 */
export const ORG_AREA_SERVED = "AR";
export const ORG_INDUSTRY = "Software";
export const ORG_EMPLOYEES = 1;
