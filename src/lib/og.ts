import type { Metadata } from "next";

/**
 * C16 — shared OpenGraph/Twitter metadata builder (LND-8, PRC-8).
 *
 * Single source for the social preview fields emitted by the public marketing
 * pages (landing, pricing). Each page reuses its own `title`/`description`
 * and references the shared 1200×630 `public/og.png` asset. Relative URLs
 * (canonical, og:url, images) resolve against `metadataBase`, which the root
 * layout defines (see src/app/layout.tsx).
 */

/** Shared OG image asset (standard 1200×630 social preview) — C16. */
export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "GeoAudit — AI Visibility & GEO Audit",
} as const;

export type BuildOgMetadataInput = {
  title: string;
  description: string;
  /** Route path used for canonical + og:url (e.g. "/" or "/pricing"). */
  path: string;
};

export function buildOgMetadata({
  title,
  description,
  path,
}: BuildOgMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "GeoAudit",
      images: [OG_IMAGE],
      locale: "es_AR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
