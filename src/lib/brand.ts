/**
 * Shared brand constants (sprint 11 rebrand, design §Brand).
 *
 * Single source of truth for every user-visible brand string (copy, og
 * metadata, layout JSON-LD, PDF templates, emails). Surfaces import these
 * constants instead of hardcoding literals so the brand can never drift.
 */

/** Product name shown in every user-visible surface. */
export const BRAND_NAME = "Relevy";

/** Production domain (owns relevy.app; Vercel alias replaced the legacy one). */
export const BRAND_DOMAIN = "relevy.app";

/** Shared support inbox — MUST NOT be hardcoded anywhere else (SHL-8, PRF-6). */
export const SUPPORT_EMAIL = "ezefernandezyf@gmail.com";

/** One-line descriptor used in OG alt text and metadata summaries. */
export const BRAND_DESCRIPTOR = "AI Visibility & GEO Audit";

/** Public repository (renamed geo-saas → relevy on GitHub). */
export const BRAND_REPO = "https://github.com/ezefernandezyf/relevy";
