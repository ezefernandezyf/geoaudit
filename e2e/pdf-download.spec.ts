import { test, expect } from "@playwright/test";
import { GITHUB_SKIP_MSG, hasGithubCreds, signInViaGithub } from "./helpers";

/**
 * PDF export E2E (E2E-5, sprint 8 C12).
 *
 * The full journey: authenticated PRO user → run a real audit (persists the
 * Audit row, TLM-6) → dashboard history → audit detail page → "Exportar PDF"
 * → the `/api/report/[id]/pdf` route re-checks ownership + tier (PDF-2/3) and
 * streams `geo-audit-<id>.pdf` → the browser fires a download event.
 *
 * skip-if-no-env: requires a REAL authenticated PRO user in the database —
 * `E2E_PDF_ENABLED=true` (explicit opt-in), GitHub test-account credentials
 * and DATABASE_URL. A GitHub sign-in alone is FREE tier, which shows the
 * upgrade CTA instead of the export action (PDF-3), so this spec can never
 * run in CI — it skips with a clear message.
 */
const PDF_SKIP_MSG =
  "Requiere E2E_PDF_ENABLED=true, un usuario PRO real en la DB (DATABASE_URL) y credenciales GitHub de test; no disponible en CI.";

test("PDF downloads from the audit detail page of a PRO user", async ({
  page,
}) => {
  test.skip(process.env.E2E_PDF_ENABLED !== "true", PDF_SKIP_MSG);
  test.skip(!hasGithubCreds(), PDF_SKIP_MSG);

  await signInViaGithub(page);

  // Run one audit as the signed-in user so the Audit row exists (TLM-6).
  await page.goto("/");
  await page.getByLabel("URL del sitio").fill("https://example.com");
  await page.getByRole("button", { name: "Auditar URL" }).click();
  await expect(page.getByText(/GEO Score \d+/).first()).toBeVisible({
    timeout: 60_000,
  });

  // The history table links the newest audit first → open its detail page.
  await page.goto("/dashboard");
  await page
    .getByRole("link", { name: /example\.com/ })
    .first()
    .click();

  // PRO gate allowed → the real export action is rendered (PDF-3).
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Exportar PDF" }).click();
  const download = await downloadPromise;

  // PDF-7: attachment filename `geo-audit-<id>.pdf`.
  expect(download.suggestedFilename()).toMatch(/^geo-audit-.*\.pdf$/);
});
