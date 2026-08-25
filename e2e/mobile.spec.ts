import { test, expect, type Page } from "@playwright/test";

/**
 * Mobile viewport E2E (E2E-6, sprint 8 C13).
 *
 * Runs ONLY in the `mobile-chromium` project (390×844 viewport, see
 * playwright.config.ts). Covers the key flows at a mobile width:
 * - landing renders with its CTA and NO horizontal overflow;
 * - the free audit flow end-to-end (the report page renders the GEO Score);
 * - the multipage page guard (anonymous → /login — multipage is auth + PRO
 *   gated, so the honest anonymous assertion is the redirect).
 *
 * The overflow check is the C13 core: `documentElement.scrollWidth` must fit
 * the viewport width — a horizontal scrollbar at mobile is the classic
 * responsive regression.
 */
async function hasNoHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth <= root.clientWidth;
  });
}

test.describe("mobile viewport (390×844)", () => {
  test("landing renders without horizontal overflow", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: "Auditar URL" }),
    ).toBeVisible();
    expect(await hasNoHorizontalOverflow(page)).toBe(true);
  });

  test("free audit flow works at mobile (E2E-6)", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("URL del sitio").fill("https://example.com");
    await page.getByRole("button", { name: "Auditar URL" }).click();

    await expect(page).toHaveURL(/\/report\?url=/);
    await expect(page.getByText(/GEO Score \d+/).first()).toBeVisible({
      timeout: 60_000,
    });
    expect(await hasNoHorizontalOverflow(page)).toBe(true);
  });

  test("multipage guard at mobile: anonymous is redirected to /login (E2E-6)", async ({
    page,
  }) => {
    await page.goto("/multipage");

    await expect(page).toHaveURL(/\/login/);
  });
});
