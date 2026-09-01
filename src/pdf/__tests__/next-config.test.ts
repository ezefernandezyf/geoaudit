import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";

/**
 * U4.9 - Next.js bundle config for the PDF function (PDF-8).
 *
 * The route renders with `puppeteer-core` + `@sparticuz/chromium-min` from a
 * serverless function: those packages MUST be external (never bundled) and
 * the function bundle MUST trace the files Chromium needs - the
 * `@sparticuz/chromium-min` package itself and the self-hosted fonts in
 * `public/fonts/` (PDF-5). Verifiable at deploy: the function bundle contains
 * both.
 */
describe("next.config.ts (PDF-8)", () => {
  it("externalizes puppeteer-core and @sparticuz/chromium-min", () => {
    expect(nextConfig.serverExternalPackages).toEqual(
      expect.arrayContaining(["puppeteer-core", "@sparticuz/chromium-min"]),
    );
  });

  it("traces the chromium package and public/fonts into the PDF function", () => {
    const includes =
      nextConfig.outputFileTracingIncludes?.["/api/report/[id]/pdf"];

    expect(includes).toEqual(
      expect.arrayContaining([
        "./node_modules/@sparticuz/chromium-min",
        "./public/fonts",
      ]),
    );
  });

  it("applies the SHL-7 security headers to every route", async () => {
    const routes = await nextConfig.headers?.();
    const all = routes?.find((route) => route.source === "/(.*)");
    expect(all).toBeDefined();

    const keys = all?.headers.map((header) => header.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "Content-Security-Policy-Report-Only",
        "Strict-Transport-Security",
        "X-Content-Type-Options",
        "Referrer-Policy",
      ]),
    );

    // Pragmatic CSP per design (SHL-7): 'self' defaults, Tailwind inline
    // styles allowed, no object/frame embedding.
    const csp = all?.headers.find(
      (header) => header.key === "Content-Security-Policy-Report-Only",
    )?.value;
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("object-src 'none'");
  });
});
