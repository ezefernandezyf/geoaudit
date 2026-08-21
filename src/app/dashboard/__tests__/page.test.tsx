import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import DashboardPage from "@/app/dashboard/page";
import { formatAuditDate } from "@/report/format";

const { authMock, findManyMock, userFindUniqueMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findManyMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
}));

// next-auth/lib/env.js imports next/server (unresolvable in vitest); the auth
// behavior itself is covered in src/lib/__tests__/auth-session.test.ts.
vi.mock("@/lib/auth", () => ({ auth: authMock }));
// Read-only source (DSH-5): the mocked audit delegate exposes ONLY findMany, so
// any write call the page (or its imports) attempted would throw at runtime.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    audit: { findMany: findManyMock },
    user: { findUnique: userFindUniqueMock },
  },
}));
// The billing CTA (DSH-6) receives the portal Server Action; mock the module so
// the page test doesn't pull in the Stripe stack.
vi.mock("@/billing/actions", () => ({
  portalAction: vi.fn(async () => ({ error: null })),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
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

beforeEach(() => {
  authMock.mockResolvedValue({ user: { id: "user-1" } });
  findManyMock.mockClear();
  findManyMock.mockResolvedValue(prismaRows);
  userFindUniqueMock.mockClear();
  userFindUniqueMock.mockResolvedValue({ tier: "FREE" });
  vi.mocked(redirect).mockClear();
});

/**
 * U4 — Dashboard RSC (DSH-1..DSH-5): reads the session user's persisted Audit
 * rows newest→oldest and composes the presentational components. The page
 * never re-runs audits: it only queries, and the components render.
 */
describe("DashboardPage (DSH-1)", () => {
  it("queries the session user's audits newest→oldest", async () => {
    await DashboardPage();
    expect(findManyMock).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("renders the history table with URL, score, band and date", async () => {
    render(await DashboardPage());

    const table = screen.getByRole("table");
    expect(within(table).getByText("https://example.com")).toBeInTheDocument();
    expect(within(table).getByText("87")).toBeInTheDocument();
    expect(within(table).getByText("Excelente")).toBeInTheDocument();
    expect(
      within(table).getByText(
        formatAuditDate(prismaRows[0].createdAt.getTime()),
      ),
    ).toBeInTheDocument();
  });
});

describe("DashboardPage (DSH-2/DSH-3)", () => {
  it("renders the score trend bars", async () => {
    render(await DashboardPage());
    expect(screen.getByRole("img", { name: "GEO Score 87" })).toHaveStyle({
      height: "87%",
    });
    expect(screen.getByRole("img", { name: "GEO Score 62" })).toHaveStyle({
      height: "62%",
    });
  });

  it("offers a re-audit link per row", async () => {
    render(await DashboardPage());
    const links = screen.getAllByRole("link", { name: "Re-auditar" });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute(
      "href",
      "/report?url=https%3A%2F%2Fexample.com",
    );
  });
});

describe("DashboardPage (DSH-4/DSH-5)", () => {
  it("renders the empty state for a user without audits", async () => {
    findManyMock.mockResolvedValueOnce([]);
    render(await DashboardPage());

    expect(
      screen.getByRole("heading", { name: "Aún no hiciste auditorías" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Re-auditar" }),
    ).not.toBeInTheDocument();
  });

  it("reads persisted rows without re-running audits", async () => {
    render(await DashboardPage());
    // findMany is the only audit delegate call the page makes.
    expect(findManyMock).toHaveBeenCalledTimes(1);
  });
});

describe("DashboardPage guard", () => {
  it("redirects to /login when there is no session", async () => {
    authMock.mockResolvedValueOnce(null);
    await expect(DashboardPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
