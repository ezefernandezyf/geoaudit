import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { toGeminiViewModel } from "@/report/presenters/toGeminiViewModel";
import type { GeminiView } from "@/report/presenters/types";
import {
  degradedCitabilityResult,
  unsupportedPageResult,
} from "@/report/__tests__/variants";

/**
 * GeminiView fixtures for the U5.6+ presenter tests. Built through the REAL
 * pure adapter (`toGeminiViewModel`) from the canonical `AuditResult`
 * fixtures - the presenters are tested against the exact binding the app
 * ships, never a hand-rolled view that could drift from the adapter.
 */

/** View of the canonical valid audit (68 Fair, 5 engines, 7 findings). */
export const geminiViewFixture: GeminiView =
  toGeminiViewModel(auditResultFixture);

/** View of the degraded audit (RAO-12): citability engine failed → score 0. */
export const degradedViewFixture: GeminiView = toGeminiViewModel(
  degradedCitabilityResult,
);

/** View of the non-HTML page (RAO-13): only the crawler engine scored. */
export const unsupportedViewFixture: GeminiView = toGeminiViewModel(
  unsupportedPageResult,
);
