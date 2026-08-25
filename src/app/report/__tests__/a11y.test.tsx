import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import ReportPage from "@/app/report/page";
import RootLayout from "@/app/layout";
import {
  assertLogicalFocusOrder,
  focusableElements,
} from "@/test/a11y-helpers";

// The valid-URL branch streams AuditRunner (async RSC, own tests) — the a11y
// scan covers the Empty state, which renders the real inline audit form.
vi.mock("@/report/audit-runner", () => ({
  AuditRunner: ({ url }: { url: string }) => <div>AuditRunner:{url}</div>,
}));
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("next/font/google", () => ({
  Instrument_Serif: () => ({ variable: "mock-font-display" }),
  Work_Sans: () => ({ variable: "mock-font-sans" }),
  JetBrains_Mono: () => ({ variable: "mock-font-mono" }),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/report" }));

async function renderPage() {
  return render(await ReportPage({ searchParams: Promise.resolve({}) }));
}

async function renderShell(page: React.ReactNode) {
  return render(await RootLayout({ children: page }));
}

/**
 * C14 — report accessibility (A11Y-2/4/5): axe scan of the Empty state (the
 * inline audit form, ARU-5) and the full shell, landmark regions and logical
 * focus order.
 */
describe("report page axe (A11Y-2)", () => {
  it("reports no WCAG violations on the empty state", async () => {
    const { container } = await renderPage();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("reports no WCAG violations on the full shell (header/main/footer)", async () => {
    const page = await ReportPage({ searchParams: Promise.resolve({}) });
    await renderShell(page);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("report shell landmarks (A11Y-4)", () => {
  it("exposes banner, main navigation, main and contentinfo landmarks", async () => {
    const page = await ReportPage({ searchParams: Promise.resolve({}) });
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

describe("report focus (A11Y-5)", () => {
  it("keeps a logical tab order with no positive tabindex", async () => {
    const page = await ReportPage({ searchParams: Promise.resolve({}) });
    await renderShell(page);
    assertLogicalFocusOrder(focusableElements(document.body));
  });

  it("declares a visible focus indicator on the correction form", async () => {
    await renderPage();
    const input = screen.getByLabelText("URL del sitio");
    expect(input.className).toMatch(/focus:ring-2/);
    const submit = screen.getByRole("button", { name: /auditar/i });
    expect(submit.className).toMatch(/focus-visible:ring-2/);
  });
});
