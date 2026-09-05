/**
 * DASH-19.1 (sprint 19): shared BreadcrumbList JSON-LD for the authenticated
 * dashboard pages - honest navigation trail Home > Dashboard > … (LND-7).
 *
 * Injected per page (no `dashboard/layout.tsx` exists); the `APP_URL`
 * derivation mirrors the landing pattern (src/app/page.tsx) so the emitted
 * `item` URLs are absolute and truthful regardless of environment.
 */

export type BreadcrumbItem = {
  /** Visible crumb name (matches the real navigation trail). */
  name: string;
  /** Absolute path from the site root, e.g. "/dashboard". */
  path: string;
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function BreadcrumbListJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: `${APP_URL}${item.path}`,
          })),
        }),
      }}
    />
  );
}
