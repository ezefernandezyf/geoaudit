// @vitest-environment node
/**
 * C14 (A11Y-3) + WU-4 (A11Y-6, SHL-7): accessibility + security-header scan in
 * a real browser via @axe-core/playwright. jsdom cannot compute contrast
 * (jest-axe disables `cat.color`), so WCAG 2.2 AA contrast is verified here.
 *
 * WU-4 extends the original landing-only contrast scan to the three measured
 * pages (landing/pricing/report — PERF-3) and to the rules behind the PERF-3
 * deviations: `aria-progressbar-name` (ScoreBar fill), `color-contrast`
 * (ScoreBar /100 + "Recomendado" badge) and `label-content-name-mismatch`
 * (navbar brand link). It also asserts the SHL-7 security headers are present
 * on real responses.
 *
 * The test SKIPS when no server is reachable at BASE_URL (the repo convention
 * for env-gated flows): in CI the unit gate stays green without a server, and
 * locally it runs automatically whenever `pnpm dev` is up. Accepted contrast
 * exceptions, if any, are documented in docs/performance.md — never silently
 * ignored (A11Y-3).
 *
 * Run manually against any URL:
 *   A11Y_CONTRAST_URL=http://localhost:3000 pnpm test src/app/__tests__/a11y-contrast.test.ts
 */
import { existsSync } from "node:fs";
import { connect } from "node:net";
import { describe, expect, it } from "vitest";

const BASE_URL = process.env.A11Y_CONTRAST_URL ?? "http://localhost:3000";

/** Fast TCP reachability probe — keeps the skipped path (CI, no server) cheap. */
async function isReachable(url: string, timeoutMs = 500): Promise<boolean> {
  try {
    const { hostname, port } = new URL(url);
    await new Promise<void>((resolve, reject) => {
      const socket = connect({
        host: hostname,
        port: Number(port) || 80,
        timeout: timeoutMs,
      });
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("timeout", () => {
        socket.destroy();
        reject(new Error("timeout"));
      });
      socket.once("error", () => {
        socket.destroy();
        reject(new Error("connection refused"));
      });
    });
    return true;
  } catch {
    return false;
  }
}

const reachable = await isReachable(BASE_URL);

/** Fallback executable for environments without the Playwright browser cache. */
function chromiumExecutable(): string | undefined {
  const puppeteerChrome = `${process.env.HOME}/.cache/puppeteer/chrome/linux-152.0.7977.42/chrome-linux64/chrome`;
  return existsSync(puppeteerChrome) ? puppeteerChrome : undefined;
}

/**
 * WU-4 (A11Y-6): the pages that PERF-3 measured. The report runs a live audit
 * (example.com, ~2.8s) so its browser timeout is larger than the static pages.
 */
const A11Y_PAGES = [
  { name: "landing", url: `${BASE_URL}/`, waitFor: "heading" as const },
  { name: "pricing", url: `${BASE_URL}/pricing`, waitFor: "heading" as const },
  {
    name: "report",
    // Full URL with protocol: resolveReportUrl parses searchParams.url with
    // urlInputSchema (z.url) — a bare hostname falls back to the empty state.
    url: `${BASE_URL}/report?url=${encodeURIComponent("https://example.com")}`,
    // The live audit streams under Suspense: wait for the first real
    // progressbar (ScoreBar fill) before scanning.
    waitFor: "progressbar" as const,
  },
];

/** The axe rules behind every PERF-3 deviation + the original C14 contrast rule. */
const A11Y_RULES = [
  "color-contrast",
  "aria-progressbar-name",
  "label-content-name-mismatch",
];

describe.skipIf(!reachable)(
  `landing/pricing/report a11y (A11Y-3, A11Y-6) against ${BASE_URL}`,
  () => {
    for (const page of A11Y_PAGES) {
      it(
        `reports no WCAG 2.2 AA violations on ${page.name} (${A11Y_RULES.join(", ")})`,
        async () => {
          // Lazy imports: the browser stack only loads when the server is up.
          const { chromium } = await import("playwright");
          const { default: AxeBuilder } = await import("@axe-core/playwright");

          const browser = await chromium.launch({
            headless: true,
            executablePath: chromiumExecutable(),
          });
          try {
            // @axe-core/playwright requires a page from an explicit context
            // (browser.newContext) — the default newPage context is rejected.
            const context = await browser.newContext();
            const pageHandle = await context.newPage();
            // Static pages: networkidle guarantees the Tailwind CSS is applied
            // before the contrast scan. Report: the audit streams under
            // Suspense, so wait for the first real ScoreBar progressbar.
            await pageHandle.goto(page.url, {
              waitUntil:
                page.name === "report" ? "domcontentloaded" : "networkidle",
            });
            if (page.waitFor === "progressbar") {
              await pageHandle
                .getByRole("progressbar")
                .first()
                .waitFor({ timeout: 45_000 });
            }

            const results = await new AxeBuilder({ page: pageHandle })
              .withRules(A11Y_RULES)
              .analyze();
            await context.close();

            // A11Y-3: violations MUST be caught — or documented in
            // docs/performance.md with justification, never silently ignored.
            const violations = results.violations.filter((v) =>
              A11Y_RULES.includes(v.id),
            );
            expect(violations, `${page.name} axe violations`).toEqual([]);
          } finally {
            await browser.close();
          }
        },
        page.name === "report" ? 90_000 : 60_000,
      );
    }

    it("sends the SHL-7 security headers on every response", async () => {
      const res = await fetch(`${BASE_URL}/`, { method: "HEAD" });

      // CSP ships report-only (design: report-only before enforce).
      expect(res.headers.get("content-security-policy-report-only")).toContain(
        "default-src 'self'",
      );
      expect(res.headers.get("strict-transport-security")).toContain(
        "max-age=",
      );
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("referrer-policy")).toBe(
        "strict-origin-when-cross-origin",
      );
    });
  },
);
