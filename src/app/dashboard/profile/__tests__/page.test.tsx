import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import ProfilePage from "@/app/dashboard/profile/page";
import { FREE_AUDIT_LIMIT, PAID_TIER_LIMITS } from "@/lib/audit/tier";

const { authMock, userFindUniqueMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: userFindUniqueMock },
    audit: { count: vi.fn(async () => 2) },
  },
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

function paidSubscription(plan = "PRO") {
  return {
    plan,
    auditsUsed: 4,
    auditsResetAt: null,
    currentPeriodEnd: new Date("2026-09-01T00:00:00.000Z"),
  };
}

beforeEach(() => {
  authMock.mockClear();
  userFindUniqueMock.mockClear();
  vi.mocked(redirect).mockClear();
});

/**
 * U4.5 — Profile RSC (PRF-1..6): renders the authenticated user's account
 * data — name/email (PRF-2), tier pill (PRF-3), usage against limit (PRF-4)
 * and a support entry (PRF-6). Sprint 10 removed the subscription management
 * surface (PRF-5): no portal action, no upgrade CTA.
 */
describe("ProfilePage (PRF-1)", () => {
  it("redirects to sign-in when there is no session", async () => {
    authMock.mockResolvedValue(null);
    await expect(ProfilePage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("renders name, email and the plan pill for a PRO user (PRF-2/3)", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1", name: "Ana" } });
    userFindUniqueMock.mockResolvedValue({
      name: "Ana",
      email: "ana@example.com",
      tier: "PRO",
      subscription: paidSubscription("PRO"),
    });

    render(await ProfilePage());

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByText("pro")).toBeInTheDocument();
  });

  it("shows usage as 'used / limit' against the paid tier limit (PRF-4)", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1", name: "Ana" } });
    userFindUniqueMock.mockResolvedValue({
      name: "Ana",
      email: "ana@example.com",
      tier: "PRO",
      subscription: paidSubscription("PRO"),
    });

    render(await ProfilePage());

    expect(screen.getByText(`4 / ${PAID_TIER_LIMITS.PRO}`)).toBeInTheDocument();
  });

  it("no longer renders a subscription management section (PRF-5 removed)", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1", name: "Ana" } });
    userFindUniqueMock.mockResolvedValue({
      name: "Ana",
      email: "ana@example.com",
      tier: "PRO",
      subscription: paidSubscription("PRO"),
    });

    render(await ProfilePage());

    expect(
      screen.queryByRole("button", { name: "Gestionar suscripción" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Mejorar a Pro" }),
    ).not.toBeInTheDocument();
  });

  it("shows FREE usage without an upgrade CTA (PRF-4, PRF-5 removed)", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1", name: "Ana" } });
    userFindUniqueMock.mockResolvedValue({
      name: "Ana",
      email: "ana@example.com",
      tier: "FREE",
      subscription: null,
    });

    render(await ProfilePage());

    expect(screen.getByText("free")).toBeInTheDocument();
    // audit.count mock returns 2 → "2 / 3".
    expect(screen.getByText(`2 / ${FREE_AUDIT_LIMIT}`)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Mejorar a Pro" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Gestionar suscripción" }),
    ).not.toBeInTheDocument();
  });

  it("exposes a support entry point (PRF-6)", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1", name: "Ana" } });
    userFindUniqueMock.mockResolvedValue({
      name: "Ana",
      email: "ana@example.com",
      tier: "FREE",
      subscription: null,
    });

    render(await ProfilePage());

    expect(
      screen.getByRole("link", { name: "soporte@geoaudit.app" }),
    ).toHaveAttribute("href", "mailto:soporte@geoaudit.app");
  });
});
