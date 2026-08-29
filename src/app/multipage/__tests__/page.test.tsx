import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import MultiPagePage from "@/app/multipage/page";
import { prisma } from "@/lib/prisma";
import { MULTIPAGE_COPY } from "@/lib/copy";

const { authMock, findManyMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findManyMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    audit: { findMany: findManyMock },
    // Kept only to assert the tier lookup is never consulted (MPU-2 removed).
    user: { findUnique: vi.fn() },
  },
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

/** A persisted multi-page result (the light `multiPageResultSchema` shape). */
const multiPageResult = {
  aggregate: {
    url: "https://acme-store.io/",
    geoScore: 74,
    severityBand: "Fair",
    durationMs: 2400,
  },
  pages: [
    {
      url: "https://acme-store.io/",
      geoScore: 68,
      severityBand: "Fair",
      durationMs: 900,
    },
    {
      url: "https://acme-store.io/pricing",
      geoScore: 80,
      severityBand: "Good",
      durationMs: 1100,
    },
  ],
};

const emptyAuditRows = [
  { id: "a1", url: "https://acme-store.io", result: {}, createdAt: new Date() },
];

const multiPageRows = [
  {
    id: "mp1",
    url: "https://acme-store.io",
    result: multiPageResult,
    createdAt: new Date(),
  },
];

beforeEach(() => {
  authMock.mockResolvedValue({ user: { id: "user-1" } });
  findManyMock.mockClear();
  vi.mocked(redirect).mockClear();
});

/**
 * U6.2 — MultiPage page (MPU-1/4/5, design U6): trigger page for every
 * authenticated user (MPU-2 removed — no tier gate, no upgrade CTA). Renders
 * the real form (MPU-1) + the Gemini route-selector/inspector driven by the
 * latest real multi-page result (MPU-4/5).
 */
describe("MultiPagePage trigger (MPU-1/2)", () => {
  it("renders the trigger form for every authenticated user — no tier lookup (MPU-2 removed)", async () => {
    findManyMock.mockResolvedValue(emptyAuditRows);
    render(await MultiPagePage());

    expect(
      screen.getByRole("button", { name: MULTIPAGE_COPY.form.submitLabel }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: MULTIPAGE_COPY.gate.cta }),
    ).not.toBeInTheDocument();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe("MultiPagePage real data (MPU-4/5)", () => {
  it("renders the route-selector + inspector from the latest real multi-page result", async () => {
    findManyMock.mockResolvedValue(multiPageRows);
    render(await MultiPagePage());

    expect(
      screen.getByRole("button", { name: MULTIPAGE_COPY.form.submitLabel }),
    ).toBeInTheDocument();
    // Real aggregate score + per-page rows from persisted data (MPU-4).
    expect(screen.getByText("74")).toBeInTheDocument();
    expect(screen.getByText("/pricing")).toBeInTheDocument();
    // Honest durations derived from real durationMs (MPU-5).
    expect(screen.getAllByText("0.9 s").length).toBeGreaterThanOrEqual(1);
  });

  it("shows a neutral empty hint when the user has no multi-page audit yet", async () => {
    findManyMock.mockResolvedValue(emptyAuditRows);
    render(await MultiPagePage());

    expect(
      screen.getByRole("heading", { name: MULTIPAGE_COPY.results.emptyTitle }),
    ).toBeInTheDocument();
  });
});

describe("MultiPagePage guard", () => {
  it("redirects to /login when there is no session", async () => {
    authMock.mockResolvedValueOnce(null);
    await expect(MultiPagePage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
