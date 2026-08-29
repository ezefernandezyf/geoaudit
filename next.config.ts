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
  /**
   * Security headers (SHL-7, design WU-4): applied to EVERY route.
   *
   * CSP ships as `Content-Security-Policy-Report-Only` per design (report-only
   * before enforce): the dev server (Turbopack HMR) injects inline scripts and
   * needs `unsafe-eval`, and Tailwind v4 renders inline `style` attributes
   * (score-bar fill width), so `style-src 'unsafe-inline'` is required. In
   * report-only nothing is blocked — the header only reports violations, so
   * the app keeps working while we observe production traffic. To enforce:
   * rename the key to `Content-Security-Policy` after zero violations on
   * landing/report (design Migration/Rollout).
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              // Next.js runtime chunks + Turbopack dev HMR (inline + eval only
              // needed in dev; harmless in report-only, removed on enforce).
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Tailwind v4 inline style attributes (score-bar fill width).
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // No camera/mic/geolocation surface on any page (defense in depth).
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
