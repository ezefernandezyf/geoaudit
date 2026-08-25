import { test, expect } from "@playwright/test";

/**
 * Free audit flow E2E (E2E-2, sprint 8 C12).
 *
 * Anonymous landing → real URL input → submit → the audit runs SERVER-SIDE
 * under Suspense (report page, `runAudit`) — it cannot be mocked with
 * `page.route`. Per the design decision (C12): use a stable public URL
 * (`https://example.com`, IANA-owned, always up) and assert TOLERANTLY that
 * the report renders its score, never exact values.
 *
 * The only assert on the outcome is the report's `GEO Score` label plus a
 * numeric score (`/GEO Score \d+/`) — the actual value depends on the live
 * audit (example.com is stable, ~2-3s per the WU-C3 measurements).
 *
 * Local re-runs: the free audit Server Action enforces a 5 req / 60s
 * fixed-window limiter shared by every local request. If the audit specs are
 * re-run repeatedly within a minute, set `RATE_LIMIT_ENABLED=false` (CI
 * already does, see ci.yml e2e job) — this spec is about the user journey,
 * the limiter is unit-tested.
 */
test("anonymous free audit: URL input on the landing renders the report score", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByLabel("URL del sitio").fill("https://example.com");
  await page.getByRole("button", { name: "Auditar URL" }).click();

  // The action redirects to /report?url=<normalized> (ARU-5).
  await expect(page).toHaveURL(/\/report\?url=/);

  // Tolerant assert (E2E-2): the report rendered a numeric GEO Score.
  await expect(page.getByText(/GEO Score \d+/).first()).toBeVisible({
    timeout: 60_000,
  });
});
