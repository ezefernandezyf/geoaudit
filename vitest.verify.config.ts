import base from "./vitest.config";
import { defineConfig } from "vitest/config";

/**
 * Dedicated Vitest config for the ScoreHero verification script (A3.1, LND-7).
 *
 * `scripts/scorehero-verify.test.ts` hits the REAL network (`runAudit` against
 * candidate URLs), so it is kept OUT of the standard suite: the base config
 * includes only `src/**`, and this config scopes the run to `scripts/**` with
 * a generous timeout for the live audits.
 *
 * Run: pnpm verify:scorehero
 */
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ["scripts/**/*.test.{ts,tsx}"],
    testTimeout: 300_000,
  },
});
