// @vitest-environment node
/**
 * C14 (A11Y-3) — color-contrast scan of the landing page in a real browser
 * via @axe-core/playwright. jsdom cannot compute contrast (jest-axe disables
 * `cat.color`), so WCAG 2.2 AA contrast is verified here.
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

describe.skipIf(!reachable)(
  `landing color contrast (A11Y-3) against ${BASE_URL}`,
  () => {
    it("reports no WCAG 2.2 AA color-contrast violations", async () => {
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
        const page = await context.newPage();
        await page.goto(BASE_URL, { waitUntil: "networkidle" });

        const results = await new AxeBuilder({ page })
          .withRules(["color-contrast"])
          .analyze();
        await context.close();

        // A11Y-3: contrast violations MUST be caught — or documented in
        // docs/performance.md with justification, never silently ignored.
        const contrastViolations = results.violations.filter(
          (v) => v.id === "color-contrast",
        );
        expect(contrastViolations).toEqual([]);
      } finally {
        await browser.close();
      }
    }, // especially when the suite runs in a batch with the dev server busy. // Browser launch + navigation + axe scan is slower than the 5s default,
    60_000);
  },
);
