import type { NextConfig } from "next";

/**
 * GeoAudit Next.js config.
 *
 * PDF export (U4, PDF-8): the `/api/report/[id]/pdf` route runs in a
 * serverless function and renders with `puppeteer-core` +
 * `@sparticuz/chromium-min`. Those packages must stay EXTERNAL (never
 * bundled/relocated — chromium-min resolves its own paths at runtime) and the
 * function bundle must TRACE the files Chromium needs: the chromium-min
 * package itself and the self-hosted fonts in `public/fonts/` (PDF-5, the
 * template loads them offline via `@font-face`). The Chromium binary itself
 * is runtime-downloaded from the pinned pack URL (chromium-min has no bundled
 * binary), so no 50MB+ binary inflates the bundle.
 */
const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min"],
  outputFileTracingIncludes: {
    "/api/report/[id]/pdf": [
      "./node_modules/@sparticuz/chromium-min",
      "./public/fonts",
    ],
  },
};

export default nextConfig;
