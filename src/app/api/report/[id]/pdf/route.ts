import { NextResponse } from "next/server";
import type {
  AuditResult,
  MultiPageResult,
} from "@/lib/contracts/audit-result";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildReportHtml } from "@/pdf/report-template";
import { renderPdf } from "@/pdf/render";

/**
 * PDF export route (U4, PDF-1/2/7/9, design D3 — "PDF/detail render from
 * aggregate"). `GET /api/report/[id]/pdf` returns a client-ready PDF of a
 * persisted audit.
 *
 * - Route Handler (NOT a Server Action) per the PDF spike: `runtime: "nodejs"`
 *   (puppeteer + pg adapter need Node), `maxDuration: 60` headroom, and
 *   `force-dynamic` (per-user row, never prerenderable).
 * - PDF-2 ownership (D2): the query is `findFirst({ id, userId })`, so a
 *   non-owner and a missing audit both collapse to `null` → 404. No existence
 *   leak, same pattern as the detail page.
 * - No tier gate (PDF-3 removed): every authenticated owner exports the PDF;
 *   ownership (PDF-2) is the sole access check.
 * - Render (PDF-4): `buildReportHtml` (template, PDF-5/6) → `renderPdf`
 *   (chromium-min, PDF-4/6). PDF-9/threat matrix: a failure is ALWAYS a typed
 *   `PdfRenderError` (render.ts) mapped to 5xx here — never an uncaught throw.
 * - PDF-7 response: `application/pdf` + `Content-Disposition` attachment
 *   filename `relevy-{id}.pdf`.
 */
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

type PdfRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: PdfRouteContext) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // PDF-2: ownership scoped query — non-owner and missing collapse to 404.
  const audit = await prisma.audit.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!audit) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // D3: the master row holds either the full AuditResult or the light
  // multi-page shape — the template discriminates and renders both.
  const html = buildReportHtml(
    audit.result as unknown as AuditResult | MultiPageResult,
  );

  let pdf: Buffer;
  try {
    pdf = await renderPdf(html);
  } catch {
    // PDF-9 / threat matrix U4.5: typed 5xx, never an uncaught exception.
    return NextResponse.json({ error: "render_failed" }, { status: 500 });
  }

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relevy-${id}.pdf"`,
      "Content-Length": String(pdf.byteLength),
    },
  });
}
