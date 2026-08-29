import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createShareToken,
  revokeShareToken,
  type ShareLinkState,
} from "@/lib/audit/share-actions";

const { authMock, findFirstMock, updateMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findFirstMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    audit: { findFirst: findFirstMock, update: updateMock },
  },
}));

/** UUID v4 shape (node:crypto randomUUID). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formWithAudit(auditId: string): FormData {
  const fd = new FormData();
  fd.set("auditId", auditId);
  return fd;
}

const auditRow = {
  id: "audit-1",
  userId: "user-1",
  url: "https://example.com/",
  geoScore: 68,
  severityBand: "Fair",
  durationMs: 3214,
  shareToken: null,
  createdAt: new Date("2026-08-10T12:00:00.000Z"),
};

const prevState: ShareLinkState = {
  shareToken: null,
  error: null,
  revoked: false,
};

beforeEach(() => {
  authMock.mockReset();
  findFirstMock.mockReset();
  updateMock.mockReset();
  authMock.mockResolvedValue({ user: { id: "user-1" } });
  findFirstMock.mockResolvedValue(auditRow);
  updateMock.mockResolvedValue({ ...auditRow, shareToken: "tok" });
});

/**
 * U2.3/U2.4 — share-link Server Actions (SHR-1/3/4, design D4).
 *
 * `createShareToken` / `revokeShareToken` take `(prevState, formData)` (the
 * `"use server"` action contract); the audit id travels in the form while the
 * USER id always comes from the session (never from the client). Ownership is
 * enforced with the D2 scoped `findFirst { id, userId }`; there is no tier
 * gate (SHR-3: any authenticated owner creates a link).
 */
describe("createShareToken (SHR-3)", () => {
  it("rejects an unauthenticated request before any DB access", async () => {
    authMock.mockResolvedValue(null);

    const state = await createShareToken(prevState, formWithAudit("audit-1"));

    expect(state).toEqual({ shareToken: null, error: "auth", revoked: false });
    expect(findFirstMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects a missing or non-owned audit (D2: scoped findFirst)", async () => {
    findFirstMock.mockResolvedValue(null);

    const state = await createShareToken(prevState, formWithAudit("audit-1"));

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "audit-1", userId: "user-1" },
    });
    expect(state).toEqual({
      shareToken: null,
      error: "not-found",
      revoked: false,
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("generates a random UUID and persists it as shareToken for any owner (SHR-1)", async () => {
    const state = await createShareToken(prevState, formWithAudit("audit-1"));

    expect(UUID_RE.test(state.shareToken ?? "")).toBe(true);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "audit-1" },
      data: { shareToken: state.shareToken },
    });
    expect(state.error).toBeNull();
  });

  it("generates a different token per audit (SHR-1: unique across audits)", async () => {
    const first = await createShareToken(prevState, formWithAudit("audit-1"));
    const second = await createShareToken(prevState, formWithAudit("audit-2"));

    expect(first.shareToken).not.toBe(second.shareToken);
  });
});

describe("revokeShareToken (SHR-4)", () => {
  it("rejects an unauthenticated request before any DB access", async () => {
    authMock.mockResolvedValue(null);

    const state = await revokeShareToken(prevState, formWithAudit("audit-1"));

    expect(state).toEqual({ shareToken: null, error: "auth", revoked: false });
    expect(findFirstMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects a missing or non-owned audit (D2: scoped findFirst)", async () => {
    findFirstMock.mockResolvedValue(null);

    const state = await revokeShareToken(prevState, formWithAudit("audit-1"));

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "audit-1", userId: "user-1" },
    });
    expect(state).toEqual({
      shareToken: null,
      error: "not-found",
      revoked: false,
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("nulls shareToken for the owner (SHR-4)", async () => {
    const state = await revokeShareToken(prevState, formWithAudit("audit-1"));

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "audit-1" },
      data: { shareToken: null },
    });
    expect(state).toEqual({ shareToken: null, error: null, revoked: true });
  });
});
