import "@testing-library/jest-dom/vitest";
import { expect } from "vitest";
import { toHaveNoViolations } from "jest-axe";

// C14 (A11Y-1): jest-axe matcher wired into the global Vitest setup so every
// component/page test can assert axe results with `expect(...).toHaveNoViolations()`.
// jest-axe disables the color-contrast rule by default (jsdom cannot compute
// contrast) - contrast is covered separately by the @axe-core/playwright test
// (A11Y-3).
expect.extend(toHaveNoViolations);
