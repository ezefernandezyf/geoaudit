import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/dashboard/page";
import RootLayout from "@/app/layout";
import {
  assertLogicalFocusOrder,
  focusableElements,
} from "@/test/a11y-helpers";

const { authMock, findManyMock, userFindUniqueMock, auditCountMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    findManyMock: vi.fn(),
    userFindUniqueMock: vi.fn(),
    auditCountMock: vi.fn(),
  }));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
// The dashboard reads persisted audits (DSH-5) and the layout resolves the
// nav plan (SHL-2): findMany + count on audit, findUnique on user (existence
// check only — no tier field is read anymore).
vi.mock("@/lib/prisma", () => ({
  prisma: {
    audit: { findMany: findManyMock, count: auditCountMock },
    user: { findUnique: userFindUniqueMock },
  },
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  useRouter: vi.fn(() => ({ refresh: vi.fn() })),
  usePathname: () => "/dashboard",
}));
vi.mock("next/font/google", () => ({
  Instrument_Serif: () => ({ variable: "mock-font-display" }),
  Work_Sans: () => ({ variable: "mock-font-sans" }),
  JetBrains_Mono: () => ({ variable: "mock-font-mono" }),
}));

const prismaRows = [
  {
    id: "a1",
    url: "https://example.com",
    geoScore: 87,
    severityBand: "Excellent",
    durationMs: 3214,
    result: {},
    createdAt: new Date("2026-08-10T12:00:00.000Z"),
  },
  {
    id: "a2",
    url: "https://ejemplo.org/blog",
    geoScore: 62,
    severityBand: "Good",
    durationMs: 4100,
    result: {},
    createdAt: new Date("2026-08-03T12:00:00.000Z"),
  },
];

async function renderPage() {
  authMock.mockResolvedValue({
    user: { id: "user-1", name: "Marcos", email: "m@x.com" },
  });
  findManyMock.mockResolvedValue(prismaRows);
  userFindUniqueMock.mockResolvedValue({ id: "user-1" });
  auditCountMock.mockResolvedValue(2);
  return render(await DashboardPage());
}

async function renderShell(page: React.ReactNode) {
  return render(await RootLayout({ children: page }));
}

/**
 * C14 — dashboard accessibility (A11Y-2/4/5): axe scan of the page and the
 * full authenticated shell (header/nav/main/footer), landmark regions and
 * logical focus order. Renders with a FREE session + 2 persisted audits so the
 * aggregate, trend and history table are all exercised.
 */
describe("dashboard page axe (A11Y-2)", () => {
  it("reports no WCAG violations on the rendered page", async () => {
    const { container } = await renderPage();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("reports no WCAG violations on the full shell (header/main/footer)", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-1", name: "Marcos", email: "m@x.com" },
    });
    findManyMock.mockResolvedValue(prismaRows);
    userFindUniqueMock.mockResolvedValue({ id: "user-1" });
    auditCountMock.mockResolvedValue(2);
    const page = await DashboardPage();
    await renderShell(page);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("dashboard shell landmarks (A11Y-4)", () => {
  it("exposes banner, main navigation, main and contentinfo landmarks", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-1", name: "Marcos", email: "m@x.com" },
    });
    findManyMock.mockResolvedValue(prismaRows);
    userFindUniqueMock.mockResolvedValue({ id: "user-1" });
    auditCountMock.mockResolvedValue(2);
    const page = await DashboardPage();
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

describe("dashboard focus (A11Y-5)", () => {
  it("keeps a logical tab order with no positive tabindex", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-1", name: "Marcos", email: "m@x.com" },
    });
    findManyMock.mockResolvedValue(prismaRows);
    userFindUniqueMock.mockResolvedValue({ id: "user-1" });
    auditCountMock.mockResolvedValue(2);
    const page = await DashboardPage();
    await renderShell(page);
    assertLogicalFocusOrder(focusableElements(document.body));
  });

  it("declares a visible focus indicator on the runner and history controls", async () => {
    await renderPage();
    const input = screen.getByLabelText("URL del sitio");
    expect(input.className).toMatch(/focus:ring-2/);
    const runAudit = screen.getByRole("button", { name: /run audit/i });
    expect(runAudit.className).toMatch(/focus-visible:ring-2/);
    const reAudit = screen.getAllByRole("link", { name: /re-auditar/i });
    expect(reAudit.length).toBe(2);
    for (const link of reAudit) {
      expect(link.className).toMatch(/focus-visible:ring-2/);
    }
  });
});
