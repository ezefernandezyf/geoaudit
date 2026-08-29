import { expect, type Page } from "@playwright/test";

/**
 * Shared E2E helpers (sprint 8, C12 — signup/PDF flows; sprint 10 removed the
 * Stripe checkout spec, E2E-4).
 *
 * The signup and PDF specs need a REAL authenticated GitHub session:
 * NextAuth v5 signs in through GitHub OAuth, so there is no way to mock the
 * session in the browser (the JWT cookie + the Prisma-backed user row are
 * server-side). Following the project's skip-if-no-env pattern (see
 * src/lib/__tests__/prisma.test.ts — `describe.skip` by env var), those specs
 * SKIP themselves with a clear message when the test-account credentials are
 * absent — CI stays green without them.
 */

const GITHUB_USERNAME = process.env.E2E_GITHUB_USERNAME ?? "";
const GITHUB_PASSWORD = process.env.E2E_GITHUB_PASSWORD ?? "";

/** True when GitHub test-account credentials are provided (E2E-3/4/5 opt-in). */
export function hasGithubCreds(): boolean {
  return Boolean(GITHUB_USERNAME && GITHUB_PASSWORD);
}

/** Clear skip reason shown by `test.skip(!hasGithubCreds(), …)`. */
export const GITHUB_SKIP_MSG =
  "Requiere E2E_GITHUB_USERNAME + E2E_GITHUB_PASSWORD de una cuenta de test de GitHub (OAuth real; no disponible en CI).";

/**
 * Drives the GitHub OAuth sign-in from the /signup page (E2E-3) until the
 * authenticated dashboard is reached. The OAuth app callback is registered for
 * http://localhost:3000/api/auth/callback/github, so this flow only works
 * against a local dev server with a registered GitHub test app — exactly why
 * the spec skips when the credentials are absent.
 */
export async function signInViaGithub(page: Page): Promise<void> {
  await page.goto("/signup");
  await page.getByRole("button", { name: "Continuar con GitHub" }).click();

  // GitHub's own login page (stable classic ids) — the flow leaves the app.
  await page.locator("#login_field").fill(GITHUB_USERNAME, { timeout: 30_000 });
  await page.locator("#password").fill(GITHUB_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  // First-time apps show an authorization screen — accept it when present.
  const authorize = page.getByRole("button", {
    name: "Authorize",
    exact: true,
  });
  if (await authorize.isVisible({ timeout: 15_000 }).catch(() => false)) {
    await authorize.click();
  }

  // NextAuth callback → the callbackUrl default (/dashboard).
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
}
