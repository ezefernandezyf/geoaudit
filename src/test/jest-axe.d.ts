/**
 * C14 (A11Y-1): jest-axe ships no bundled types, so the module surface used by
 * the tests is declared here. Kept ambient (no top-level import) - jest-axe
 * resolves to an untyped CommonJS module, so this declares it without
 * shadowing any real type package. The Vitest matcher augmentation lives in
 * `vitest-matchers.d.ts` (it must import "vitest" to augment, not shadow).
 */
declare module "jest-axe" {
  import type { AxeResults } from "axe-core";

  type AxeHtml = Element | string;
  type AxeOptions = {
    globalOptions?: Record<string, unknown>;
    [key: string]: unknown;
  };

  export function configureAxe(
    options?: AxeOptions,
  ): (
    html: AxeHtml,
    additionalOptions?: Record<string, unknown>,
  ) => Promise<AxeResults>;

  export const axe: (
    html: AxeHtml,
    additionalOptions?: Record<string, unknown>,
  ) => Promise<AxeResults>;

  export const toHaveNoViolations: {
    toHaveNoViolations(results: AxeResults): {
      pass: boolean;
      message: () => string;
      actual: AxeResults["violations"];
    };
  };
}
