import { test, expect } from "@playwright/test";
import { GITHUB_SKIP_MSG, hasGithubCreds, signInViaGithub } from "./helpers";

/**
 * Stripe test checkout E2E (E2E-4, sprint 8 C12).
 *
 * Drives the REAL Pro upgrade: signed-in FREE user → /pricing → "Mejorar" →
 * `checkoutAction` creates a Stripe Checkout Session and redirects to the
 * Stripe-hosted test checkout → the 4242 test card completes the payment →
 * redirect back to /dashboard?checkout=success.
 *
 * skip-if-no-env (E2E-4): requires Stripe test secrets AND GitHub test-account
 * credentials (the checkout action needs an authenticated user — anonymous
 * clicks return the inline "auth" error by design, BLG-5). CI has neither, so
 * this spec skips with a clear message and the pipeline stays green.
 *
 * Assumes a FREE account (a previously-paid account shows "Plan activo"
 * instead of the checkout CTA on the Pro card).
 */
const STRIPE_SKIP_MSG =
  "Requiere STRIPE_SECRET_KEY + STRIPE_PRICE_PRO (modo test) + credenciales de cuenta GitHub de test; no disponible en CI.";

test("Pro checkout drives the Stripe hosted test checkout to completion", async ({
  page,
}) => {
  test.skip(!hasGithubCreds(), GITHUB_SKIP_MSG);
  test.skip(
    !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_PRO,
    STRIPE_SKIP_MSG,
  );

  await signInViaGithub(page);

  await page.goto("/pricing");
  // FREE user: the Pro card renders the real checkout CTA (ENTERPRISE renders
  // a second "Mejorar" — the Pro card is the first in the catalog).
  await page.getByRole("button", { name: "Mejorar" }).first().click();

  // checkoutAction redirects to the Stripe-hosted test checkout (BLG-5).
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });

  // Test card 4242… (Stripe docs, test mode) — stable placeholder selectors.
  await page
    .getByPlaceholder("1234 1234 1234 1234")
    .fill("4242 4242 4242 4242");
  await page.getByPlaceholder("MM / YY").fill("12 / 34");
  await page.getByPlaceholder("CVC").fill("424");

  const email = page.getByPlaceholder("Email");
  if (await email.isVisible().catch(() => false)) {
    await email.fill("e2e-checkout@example.com");
  }

  await page.locator("button[type='submit']").click();

  // Success URL from the action (SUCCESS_PATH = /dashboard?checkout=success).
  await expect(page).toHaveURL(/\/dashboard\?checkout=success/, {
    timeout: 60_000,
  });
});
