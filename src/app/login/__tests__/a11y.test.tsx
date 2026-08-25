import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "@/app/login/page";
import RootLayout from "@/app/layout";
import {
  assertLogicalFocusOrder,
  focusableElements,
} from "@/test/a11y-helpers";

const nav = vi.hoisted(() => ({ useSearchParams: vi.fn() }));
vi.mock("next/navigation", () => ({
  useSearchParams: nav.useSearchParams,
  usePathname: () => "/login",
}));
vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("next/font/google", () => ({
  Instrument_Serif: () => ({ variable: "mock-font-display" }),
  Work_Sans: () => ({ variable: "mock-font-sans" }),
  JetBrains_Mono: () => ({ variable: "mock-font-mono" }),
}));

async function renderPage() {
  nav.useSearchParams.mockReturnValue(new URLSearchParams(""));
  return render(<LoginPage />);
}

async function renderShell(page: React.ReactNode) {
  return render(await RootLayout({ children: page }));
}

/**
 * C14 — login accessibility (A11Y-2/4/5): axe scan of the auth card and the
 * full shell, landmark regions and logical focus order. The GitHub OAuth
 * button relies on the browser default focus outline (visible focus).
 */
describe("login page axe (A11Y-2)", () => {
  it("reports no WCAG violations on the rendered page", async () => {
    const { container } = await renderPage();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("reports no WCAG violations on the full shell (header/main/footer)", async () => {
    nav.useSearchParams.mockReturnValue(new URLSearchParams(""));
    await renderShell(<LoginPage />);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("login shell landmarks (A11Y-4)", () => {
  it("exposes banner, main navigation, main and contentinfo landmarks", async () => {
    nav.useSearchParams.mockReturnValue(new URLSearchParams(""));
    await renderShell(<LoginPage />);
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

describe("login focus (A11Y-5)", () => {
  it("keeps a logical tab order with no positive tabindex", async () => {
    nav.useSearchParams.mockReturnValue(new URLSearchParams(""));
    await renderShell(<LoginPage />);
    assertLogicalFocusOrder(focusableElements(document.body));
  });

  it("keeps the OAuth button and the switch link reachable by keyboard", async () => {
    await renderPage();
    const github = screen.getByRole("button", {
      name: "Continuar con GitHub",
    });
    expect(github).toBeEnabled();
    expect(screen.getByRole("link", { name: /cree una/i })).toHaveAttribute(
      "href",
      "/signup",
    );
  });
});
