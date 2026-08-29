import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/report/[id]/pdf/route";
import { PdfRenderError } from "@/pdf/render";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";

/**
 * U4.7/U4.8 — PDF route (PDF-1/2/7/9, threat matrix U4.5).
 *
 * `GET /api/report/[id]/pdf`:
 * - PDF-2: ownership via `findFirst({ id, userId })` — non-owner and missing
 *   collapse to null → 404 (same D2 pattern as the detail page).
 * - PDF-7: success → `application/pdf` + `Content-Disposition` attachment
 *   filename `geo-audit-{id}.pdf`.
 * - PDF-9/threat: a `renderPdf` rejection (typed `PdfRenderError`) becomes a
 *   5xx — never an uncaught exception; unauth → 401 typed.
 * - No tier gate (PDF-3 removed): every authenticated owner exports the PDF.
 */

const { authMock, findFirstMock, renderPdfMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  findFirstMock: vi.fn(),
  renderPdfMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    audit: { findFirst: findFirstMock },
  },
}));
vi.mock("@/pdf/render", () => ({
  renderPdf: renderPdfMock,
  PdfRenderError: class PdfRenderError extends Error {},
}));

const auditRow = {
  id: "audit-1",
  userId: "user-1",
  url: "https://example.com/",
  geoScore: 68,
  severityBand: "Fair",
  durationMs: 3214,
  shareToken: null,
  result: auditResultFixture,
  createdAt: new Date("2026-08-10T12:00:00.000Z"),
};

const PDF_BYTES = Buffer.from("%PDF-1.7 fake report bytes");

function get(id = "audit-1"): Promise<Response> {
  return GET(new Request(`https://app.example.com/api/report/${id}/pdf`), {
    params: Promise.resolve({ id }),
  });
}

beforeEach(() => {
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { id: "user-1" } });
  findFirstMock.mockReset();
  findFirstMock.mockResolvedValue(auditRow);
  renderPdfMock.mockReset();
  renderPdfMock.mockResolvedValue(PDF_BYTES);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/report/[id]/pdf (PDF-2 ownership)", () => {
  it("queries the audit scoped to the session user (id + userId)", async () => {
    await get();

    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "audit-1", userId: "user-1" },
    });
  });

  it("returns 404 when the audit does not exist (PDF-9)", async () => {
    findFirstMock.mockResolvedValue(null);

    const res = await get();

    expect(res.status).toBe(404);
    expect(renderPdfMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the audit belongs to another user (PDF-2)", async () => {
    authMock.mockResolvedValue({ user: { id: "user-2" } });
    findFirstMock.mockResolvedValue(null);

    const res = await get();

    expect(res.status).toBe(404);
    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: "audit-1", userId: "user-2" },
    });
    expect(renderPdfMock).not.toHaveBeenCalled();
  });

  it("returns 401 without a session", async () => {
    authMock.mockResolvedValue(null);

    const res = await get();

    expect(res.status).toBe(401);
    expect(findFirstMock).not.toHaveBeenCalled();
    expect(renderPdfMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/report/[id]/pdf (PDF-7 response contract)", () => {
  it("returns the PDF with application/pdf and a download filename", async () => {
    const res = await get();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="geo-audit-audit-1.pdf"',
    );
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(
      new Uint8Array(PDF_BYTES),
    );
    expect(renderPdfMock).toHaveBeenCalledTimes(1);
  });

  it("exports for every authenticated owner — no tier lookup (PDF-3 removed)", async () => {
    // The prisma mock exposes ONLY audit.findFirst: any tier lookup the route
    // attempted would throw. Every authenticated owner reaches the render.
    const res = await get();

    expect(res.status).toBe(200);
    expect(renderPdfMock).toHaveBeenCalledTimes(1);
  });
});

describe("GET /api/report/[id]/pdf (PDF-9 error states)", () => {
  it("maps a render failure to a typed 5xx — never an uncaught exception", async () => {
    renderPdfMock.mockRejectedValue(new PdfRenderError("render boom"));

    const res = await get();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "render_failed" });
  });
});
