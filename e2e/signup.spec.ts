import { test, expect } from "@playwright/test";
import { GITHUB_SKIP_MSG, hasGithubCreds, signInViaGithub } from "./helpers";

/**
 * GitHub signup flow E2E (E2E-3, sprint 8 C12).
 *
 * Two layers of coverage, both honest:
 * - The signup UI itself is PUBLIC and always testable: the /signup card with
 *   its GitHub CTA renders for any visitor — this test always runs.
 * - COMPLETING the OAuth handshake needs a real GitHub test identity (the
 *   OAuth app callback is registered for localhost). Per skip-if-no-env, the
 *   completion test SKIPS with a clear message when E2E_GITHUB_USERNAME /
 *   E2E_GITHUB_PASSWORD are absent (they never are in CI).
 */
test.describe("GitHub signup (E2E-3)", () => {
  test("signup card renders with the GitHub CTA", async ({ page }) => {
    await page.goto("/signup");

    await expect(
      page.getByRole("heading", { name: "Cree su cuenta" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continuar con GitHub" }),
    ).toBeVisible();
    // Scoped to <main>: the shell navbar also links "Inicie sesión".
    await expect(
      page.getByRole("main").getByRole("link", { name: "Inicie sesión" }),
    ).toBeVisible();
  });

  test("signup completes via GitHub and lands on the authenticated dashboard", async ({
    page,
  }) => {
    test.skip(!hasGithubCreds(), GITHUB_SKIP_MSG);

    await signInViaGithub(page);

    // Middleware + page guard redirect the session user to /dashboard; the
    // sr-only page heading is the stable post-auth landmark.
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByRole("heading", { name: "Panel de auditorías" }),
    ).toBeVisible();
  });
});
