/**
 * Static 8-type Schema.org registry (RSC-3) with required/recommended property
 * tables per type (RSC-4/RSC-5), plus deprecated-schema flags (RSC-7).
 *
 * The registry is intentionally small and static — the same 8 types the
 * validator and the business-type templates rely on. `LocalBusiness` accepts
 * a few common concrete subtypes (Restaurant, Store, ...) so real-world
 * pages are not mis-flagged as unknown.
 */

export interface RegistryEntry {
  /** Canonical registry key, e.g. "organization". */
  key: string;
  /** Human label (may cover two Schema.org types, e.g. Article/Person). */
  label: string;
  /** Accepted @type names, canonical first (matched case-insensitively). */
  types: string[];
  /** Required properties for the canonical type (RSC-4). */
  required: string[];
  /** Recommended properties for the canonical type (RSC-5). */
  recommended: string[];
  /** Set when the type carries a deprecation/restriction flag (RSC-7). */
  deprecated?: { flag: string; note: string };
  /**
   * Per-concrete-type overrides for entries spanning multiple types:
   * Article/Person shares one entry but has different property tables.
   */
  profiles?: Record<string, { required: string[]; recommended: string[] }>;
}

export const SCHEMA_REGISTRY: RegistryEntry[] = [
  {
    key: "organization",
    label: "Organization",
    types: ["Organization", "Corporation", "NGO"],
    required: ["name", "url"],
    recommended: [
      "logo",
      "description",
      "sameAs",
      "foundingDate",
      "founder",
      "address",
      "contactPoint",
      "areaServed",
      "knowsAbout",
      "industry",
      "award",
      "numberOfEmployees",
    ],
  },
  {
    key: "local_business",
    label: "LocalBusiness",
    types: [
      "LocalBusiness",
      "Restaurant",
      "Store",
      "BarOrPub",
      "HairSalon",
      "AutoRepair",
    ],
    required: ["name", "url", "address", "telephone"],
    recommended: [
      "geo",
      "openingHoursSpecification",
      "priceRange",
      "sameAs",
      "aggregateRating",
      "hasMap",
      "image",
    ],
  },
  {
    key: "article_person",
    label: "Article/Person",
    types: ["Article", "NewsArticle", "BlogPosting", "TechArticle", "Person"],
    required: ["headline", "datePublished", "author"],
    recommended: ["dateModified", "image", "publisher", "speakable", "url"],
    profiles: {
      Person: {
        required: ["name"],
        recommended: [
          "url",
          "sameAs",
          "jobTitle",
          "worksFor",
          "knowsAbout",
          "image",
          "description",
        ],
      },
    },
  },
  {
    key: "product",
    label: "Product",
    types: ["Product"],
    required: ["name", "offers"],
    recommended: [
      "description",
      "image",
      "brand",
      "aggregateRating",
      "review",
      "sku",
      "category",
    ],
  },
  {
    key: "faq_page",
    label: "FAQPage",
    types: ["FAQPage"],
    required: ["mainEntity"],
    recommended: [],
    deprecated: {
      flag: "deprecated_faqpage",
      note: "FAQ rich results restricted to government/health sites (2023+); still parsed by AI platforms",
    },
  },
  {
    key: "website_search",
    label: "WebSite + SearchAction",
    types: ["WebSite"],
    required: ["name", "url"],
    recommended: ["potentialAction"],
  },
  {
    key: "breadcrumb_list",
    label: "BreadcrumbList",
    types: ["BreadcrumbList"],
    required: ["itemListElement"],
    recommended: [],
  },
  {
    key: "software_application",
    label: "SoftwareApplication",
    types: ["SoftwareApplication"],
    required: ["name", "applicationCategory"],
    recommended: [
      "operatingSystem",
      "offers",
      "aggregateRating",
      "featureList",
      "softwareVersion",
      "url",
    ],
  },
];

/** Deprecated schemas outside the 8-type registry (RSC-7). */
export const DEPRECATED_SCHEMAS: {
  type: string;
  flag: string;
  note: string;
}[] = [
  {
    type: "HowTo",
    flag: "deprecated_howto",
    note: "HowTo rich results deprecated (2023); keep for AI parsing or remove",
  },
];

export interface RegistryMatch {
  entry: RegistryEntry;
  /** The concrete type name matched inside `entry.types`. */
  matchedType: string;
}

/** Looks up a @type name (case-insensitive) in the registry; null when unknown. */
export function findRegistryEntry(
  typeName: string | null,
): RegistryMatch | null {
  if (!typeName) return null;
  const needle = typeName.toLowerCase();
  for (const entry of SCHEMA_REGISTRY) {
    for (const type of entry.types) {
      if (type.toLowerCase() === needle) {
        return { entry, matchedType: type };
      }
    }
  }
  return null;
}

/** Property table for a concrete matched type (entry defaults or profile override). */
export function profileFor(
  entry: RegistryEntry,
  matchedType: string,
): { required: string[]; recommended: string[] } {
  return (
    entry.profiles?.[matchedType] ?? {
      required: entry.required,
      recommended: entry.recommended,
    }
  );
}
