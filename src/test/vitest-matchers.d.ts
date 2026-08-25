import "vitest";

/**
 * C14 (A11Y-1): Vitest matcher augmentation for jest-axe. Must import "vitest"
 * so this augments (not shadows) the real module. The `T = any` parameter list
 * is required verbatim — TypeScript only merges interface declarations with
 * identical type parameters, and both Vitest's own `Assertion` and jest-dom's
 * augmentation declare `T = any` (declaration-file accommodation, not app code).
 */
declare module "vitest" {
  /* `T = any` required verbatim (see docblock): TS only merges interface
     declarations with identical type parameters, and Vitest/jest-dom both
     declare `Assertion<T = any>`. Declaration-file accommodation, not app code. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
  interface Assertion<T = any> {
    /** C14 (A11Y-1): axe results carry no WCAG violations. */
    toHaveNoViolations(): Promise<void>;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): Promise<void>;
  }
}
