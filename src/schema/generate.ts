import { flattenToRecords, resolveTypeName } from "./parse";
import { findRegistryEntry, profileFor } from "./registry";
import type { BusinessType, ParsedBlock } from "./types";
import { hasValue } from "./validate";

/**
 * Corrected JSON-LD generation (RSC-9).
 *
 * With existing blocks: every parsed node is gap-filled - missing required
 * properties per its registry entry get a TODO marker while all existing
 * properties are preserved (RSC-9 scenario "Organization missing required
 * url"). The business-type primary schema is appended when absent.
 * With zero blocks: a full per-business-type template is emitted with TODO
 * markers for unfillable fields (RSC-11 "generated JSON-LD").
 *
 * Multiple nodes are wrapped in a single `@graph` (geo-schema skill §6).
 */

/** Generic marker for values that cannot be derived from a single page. */
export const TODO_MARKER = "TODO: fill from page";
/** Specific marker for URL-shaped gaps (pinned by RSC-9 tests). */
export const TODO_URL_MARKER = "TODO: fill from page URL";

/** Per-business-type primary schema (drives template + rubric criterion 4). */
export function primaryTypeFor(businessType: BusinessType): string {
  switch (businessType) {
    case "saas":
      return "SoftwareApplication";
    case "local":
      return "LocalBusiness";
    case "ecommerce":
      return "Product";
    case "publisher":
      return "Article";
    case "agency":
    case "hybrid":
    default:
      return "Organization";
  }
}

/** Full JSON-LD template for a business type, all unfillable fields TODOs. */
export function templateFor(
  businessType: BusinessType,
): Record<string, unknown> {
  switch (businessType) {
    case "saas":
      return {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: TODO_MARKER,
        url: TODO_URL_MARKER,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: TODO_MARKER, priceCurrency: "USD" },
      };
    case "local":
      return {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: TODO_MARKER,
        url: TODO_URL_MARKER,
        telephone: TODO_MARKER,
        address: {
          "@type": "PostalAddress",
          streetAddress: TODO_MARKER,
          addressLocality: TODO_MARKER,
          addressRegion: TODO_MARKER,
          postalCode: TODO_MARKER,
          addressCountry: TODO_MARKER,
        },
      };
    case "ecommerce":
      return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: TODO_MARKER,
        url: TODO_URL_MARKER,
        offers: {
          "@type": "Offer",
          price: TODO_MARKER,
          priceCurrency: TODO_MARKER,
          availability: "https://schema.org/InStock",
        },
      };
    case "publisher":
      return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: TODO_MARKER,
        url: TODO_URL_MARKER,
        datePublished: TODO_MARKER,
        author: { "@type": "Person", name: TODO_MARKER },
        publisher: {
          "@type": "Organization",
          name: TODO_MARKER,
          url: TODO_URL_MARKER,
        },
      };
    case "agency":
    case "hybrid":
    default:
      return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: TODO_MARKER,
        url: TODO_URL_MARKER,
        description: TODO_MARKER,
      };
  }
}

function recordHasType(
  record: Record<string, unknown>,
  typeName: string,
): boolean {
  const type = record["@type"];
  const types = Array.isArray(type) ? type : [type];
  return types.some(
    (entry) =>
      typeof entry === "string" &&
      entry.toLowerCase() === typeName.toLowerCase(),
  );
}

/** Preserves every existing property and fills missing required ones with TODOs. */
function fillMissingRequired(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const typeName = resolveTypeName(record);
  const match = findRegistryEntry(typeName);
  if (!match) {
    // Unknown types are kept as-is (RSC-3: included without validation).
    return { ...record };
  }
  const profile = profileFor(match.entry, match.matchedType);
  const corrected = { ...record };
  for (const prop of profile.required) {
    if (!hasValue(corrected, prop)) {
      corrected[prop] = prop === "url" ? TODO_URL_MARKER : TODO_MARKER;
    }
  }
  return corrected;
}

export function generateCorrected(
  parsed: ParsedBlock[],
  businessType: BusinessType,
): Record<string, unknown> {
  const nodes = parsed.flatMap((block) => flattenToRecords(block.data));
  if (nodes.length === 0) {
    return templateFor(businessType);
  }

  const corrected = nodes.map(fillMissingRequired);
  const primary = primaryTypeFor(businessType);
  if (!corrected.some((node) => recordHasType(node, primary))) {
    corrected.push(templateFor(businessType));
  }

  if (corrected.length === 1) return corrected[0];
  return { "@context": "https://schema.org", "@graph": corrected };
}
