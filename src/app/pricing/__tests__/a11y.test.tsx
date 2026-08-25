import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import PricingPage from "@/app/pricing/page";
import RootLayout from "@/app/layout";
import {
  assertLogicalFocusOrder,
  focusableElements,
} from "@/test/a11y-helpers";

const { authMock, userFindUniqueMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: userFindUniqueMock },
    // The layout resolves the nav plan pill (SHL-2): FREE sessions count the
    // audits in the 30-day window.
    audit: { count: vi.fn(async () => 0) },
  },
}));
vi.mock("@/billing/actions", () => ({
  checkoutAction: vi.fn(async () => ({ error: null })),
  portalAction: vi.fn(async () => ({ error: null })),
}));
vi.mock("next/font/google", () => ({
  Instrument_Serif: () => ({ variable: "mock-font-display" }),
  Work_Sans: () => ({ variable: "mock-font-sans" }),
  JetBrains_Mono: () => ({ variable: "mock-font-mono" }),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/pricing" }));

async function renderPage() {
  authMock.mockResolvedValue({ user: { id: "user-1" } });
  userFindUniqueMock.mockResolvedValue({ tier: "FREE" });
  return render(await PricingPage());
}

async function renderShell(page: React.ReactNode) {
  return render(await RootLayout({ children: page }));
}

/**
 * C14 — pricing accessibility (A11Y-2/4/5): axe scan of the page and the full
 * shell, landmark regions and logical focus order. Rendering the page with a
 * FREE session exercises the real plan catalog + CheckoutButton CTAs.
 */
describe("pricing page axe (A11Y-2)", () => {
  it("reports no WCAG violations on the rendered page", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    userFindUniqueMock.mockResolvedValue({ tier: "FREE" });
    const { container } = await renderPage();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("reports no WCAG violations on the full shell (header/main/footer)", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    userFindUniqueMock.mockResolvedValue({ tier: "FREE" });
    const page = await PricingPage();
    await renderShell(page);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("pricing shell landmarks (A11Y-4)", () => {
  it("exposes banner, main navigation, main and contentinfo landmarks", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    userFindUniqueMock.mockResolvedValue({ tier: "FREE" });
    const page = await PricingPage();
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

describe("pricing focus (A11Y-5)", () => {
  it("keeps a logical tab order with no positive tabindex", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    userFindUniqueMock.mockResolvedValue({ tier: "FREE" });
    const page = await PricingPage();
    await renderShell(page);
    assertLogicalFocusOrder(focusableElements(document.body));
  });

  it("declares a visible focus indicator on the plan CTAs", async () => {
    await renderPage();
    // FREE user: the Pro/Enterprise CTAs are real CheckoutButtons (Button
    // primitive declares focus-visible ring); the Free card shows "Plan activo".
    const mejorar = screen.getAllByRole("button", { name: /mejorar/i });
    expect(mejorar.length).toBeGreaterThanOrEqual(2);
    for (const button of mejorar) {
      expect(button.className).toMatch(/focus-visible:ring-2/);
    }
    // Anonymous: every card CTA is the sign-in link, which declares a ring too.
    authMock.mockResolvedValue(null);
    userFindUniqueMock.mockResolvedValue(null);
    render(await PricingPage());
    const signIn = screen.getAllByRole("link", {
      name: /iniciar sesión|empezar/i,
    });
    expect(signIn.length).toBe(3);
    for (const link of signIn) {
      expect(link.className).toMatch(/focus-visible:ring-2/);
    }
  });
});
