import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration (sprint 8, C12/C13, E2E-1/6).
 *
 * - webServer: boots `pnpm dev` (the single Next.js dev server that serves
 *   server + client). Local runs REUSE an already-running dev server
 *   (`reuseExistingServer`), CI always starts its own.
 * - Projects: `desktop-chromium` runs every spec except `mobile.spec.ts`;
 *   `mobile-chromium` runs ONLY `mobile.spec.ts` at a 390×844 viewport
 *   (E2E-6). Keeping the audit-driving specs off the mobile project keeps the
 *   real-audit count low (the free audit runs server-side, no mocking).
 * - Retries: 2 in CI, 0 locally. Trace on first retry, screenshot on failure
 *   only — the `playwright-report/` HTML is uploaded by the CI job (E2E-7).
 *
 * Skipping secret-gated flows (E2E-3/5): the signup and PDF specs
 * use the project's skip-if-no-env pattern (see src/lib/__tests__/prisma.test.ts
 * describe.skip) — they call `test.skip(!env, msg)` and CI stays green without
 * secrets. (Sprint 10 removed the Stripe checkout spec, E2E-4.)
 *
 * Note on the rate limiter (RTL): the free audit Server Action enforces a
 * fixed 5 req / 60s window per client key. The audit specs run against real
 * URLs and are not about the limiter (unit-tested separately); CI sets
 * `RATE_LIMIT_ENABLED=false` (see ci.yml e2e job) so retries cannot trip it.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
      },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
