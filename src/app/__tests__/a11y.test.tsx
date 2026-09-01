import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";
import Page from "@/app/page";
import RootLayout from "@/app/layout";
import {
  assertLogicalFocusOrder,
  focusableElements,
} from "@/test/a11y-helpers";

// The landing page resolves auth() (LND-6) and the layout feeds the Navbar;
// next-auth/lib/env.js imports next/server (unresolvable in vitest), so the
// module is mocked. Anonymous session keeps the shell free of /dashboard links.
const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async (): Promise<Session | null> => null),
}));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
// RootLayout loads next/font/google (network fetch in vitest) and the Navbar
// renders the client NavLinks island (usePathname).
vi.mock("next/font/google", () => ({
  Instrument_Serif: () => ({ variable: "mock-font-display" }),
  Work_Sans: () => ({ variable: "mock-font-sans" }),
  JetBrains_Mono: () => ({ variable: "mock-font-mono" }),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

async function renderPage() {
  return render(await Page());
}

async function renderShell(page: React.ReactNode) {
  return render(await RootLayout({ children: page }));
}

/**
 * C14 - landing accessibility (A11Y-2/4/5): axe scans the page and the full
 * shell (header/nav/main/footer), asserts the landmark regions and the logical
 * focus order, and checks the shared interactive primitives declare a visible
 * focus indicator. Contrast is intentionally not asserted here: jest-axe
 * disables `cat.color` because jsdom cannot compute it (A11Y-3 is covered by
 * the @axe-core/playwright test).
 */
describe("landing page axe (A11Y-2)", () => {
  it("reports no WCAG violations on the rendered page", async () => {
    const { container } = await renderPage();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("reports no WCAG violations on the full shell (header/main/footer)", async () => {
    const page = await Page();
    await renderShell(page);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("landing shell landmarks (A11Y-4)", () => {
  it("exposes banner, main navigation, main and contentinfo landmarks", async () => {
    const page = await Page();
    await renderShell(page);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Navegación principal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Pie de página" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});

describe("landing focus (A11Y-5)", () => {
  it("keeps a logical tab order with no positive tabindex", async () => {
    const page = await Page();
    await renderShell(page);
    assertLogicalFocusOrder(focusableElements(document.body));
  });

  it("declares a visible focus indicator on the shared interactive primitives", async () => {
    await renderPage();
    const submit = screen.getByRole("button", { name: /auditar/i });
    expect(submit.className).toMatch(/focus-visible:ring-2/);
    const input = screen.getByLabelText("URL del sitio");
    expect(input.className).toMatch(/focus:ring-2/);
  });
});
