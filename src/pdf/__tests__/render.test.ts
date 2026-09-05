import { describe, expect, it, vi } from "vitest";
import {
  PdfRenderError,
  renderPdf,
  resolveChromiumPackUrl,
} from "@/pdf/render";
import type { PdfRenderDeps } from "@/pdf/render";

/**
 * U4.5/U4.6 - PDF render pipeline (PDF-4/6, threat matrix: Chromium subprocess).
 *
 * `renderPdf(html, deps)` launches headless Chromium through an INJECTED
 * `deps.launch` (the real default wires `puppeteer-core` +
 * `@sparticuz/chromium-min`), renders the HTML and returns PDF bytes.
 *
 * - PDF-6: `page.pdf({ printBackground: true, format: "A4" })` - brand colors
 *   survive print.
 * - Threat: a launch/render rejection NEVER escapes raw - it is wrapped in the
 *   typed `PdfRenderError` the route maps to a 5xx (never an uncaught throw),
 *   and the browser is always closed (finally).
 */

const SAMPLE_HTML =
  "<!doctype html><html><head></head><body><h1>Reporte</h1></body></html>";

function successDeps(): {
  deps: PdfRenderDeps;
  pdfMock: ReturnType<typeof vi.fn>;
  setContentMock: ReturnType<typeof vi.fn>;
  gotoMock: ReturnType<typeof vi.fn>;
  closeMock: ReturnType<typeof vi.fn>;
} {
  const pdfMock = vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
  const setContentMock = vi.fn().mockResolvedValue(undefined);
  const gotoMock = vi.fn().mockResolvedValue(undefined);
  const closeMock = vi.fn().mockResolvedValue(undefined);
  const deps: PdfRenderDeps = {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        goto: gotoMock,
        setContent: setContentMock,
        pdf: pdfMock,
      }),
      close: closeMock,
    }),
  };
  return { deps, pdfMock, setContentMock, gotoMock, closeMock };
}

describe("renderPdf (PDF-6)", () => {
  it("renders the HTML with printBackground: true on A4", async () => {
    const { deps, pdfMock, setContentMock, gotoMock, closeMock } =
      successDeps();

    const result = await renderPdf(SAMPLE_HTML, deps);

    expect(pdfMock).toHaveBeenCalledWith({
      printBackground: true,
      format: "A4",
    });
    // HYD-2: the main frame MUST commit (about:blank) before setContent -
    // puppeteer 25 throws "Requesting main frame too early!" otherwise.
    expect(gotoMock).toHaveBeenCalledWith("about:blank", {
      waitUntil: "domcontentloaded",
    });
    expect(setContentMock).toHaveBeenCalledWith(
      expect.stringContaining('<base href="file://'),
      { waitUntil: "networkidle0" },
    );
    expect(setContentMock).toHaveBeenCalledWith(
      expect.stringContaining("<h1>Reporte</h1>"),
      { waitUntil: "networkidle0" },
    );
    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString("latin1")).toBe("%PDF");
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});

describe("renderPdf failure path (threat: Chromium subprocess)", () => {
  it("wraps a launch rejection in the typed PdfRenderError - never uncaught", async () => {
    const deps: PdfRenderDeps = {
      launch: vi.fn().mockRejectedValue(new Error("chromium boom")),
    };

    await expect(renderPdf(SAMPLE_HTML, deps)).rejects.toBeInstanceOf(
      PdfRenderError,
    );
  });

  it("wraps a page.pdf rejection in the typed PdfRenderError", async () => {
    const pdfMock = vi.fn().mockRejectedValue(new Error("pdf boom"));
    const closeMock = vi.fn().mockResolvedValue(undefined);
    const deps: PdfRenderDeps = {
      launch: vi.fn().mockResolvedValue({
        newPage: vi.fn().mockResolvedValue({
          goto: vi.fn().mockResolvedValue(undefined),
          setContent: vi.fn().mockResolvedValue(undefined),
          pdf: pdfMock,
        }),
        close: closeMock,
      }),
    };

    await expect(renderPdf(SAMPLE_HTML, deps)).rejects.toBeInstanceOf(
      PdfRenderError,
    );
  });

  it("closes the browser even when rendering fails (finally)", async () => {
    const pdfMock = vi.fn().mockRejectedValue(new Error("pdf boom"));
    const closeMock = vi.fn().mockResolvedValue(undefined);
    const deps: PdfRenderDeps = {
      launch: vi.fn().mockResolvedValue({
        newPage: vi.fn().mockResolvedValue({
          goto: vi.fn().mockResolvedValue(undefined),
          setContent: vi.fn().mockResolvedValue(undefined),
          pdf: pdfMock,
        }),
        close: closeMock,
      }),
    };

    await expect(renderPdf(SAMPLE_HTML, deps)).rejects.toBeInstanceOf(
      PdfRenderError,
    );
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});

describe("resolveChromiumPackUrl (PDF-4)", () => {
  const BASE =
    "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack";

  it("resolves the x64 arch-suffixed pack URL", () => {
    expect(resolveChromiumPackUrl("x64")).toBe(`${BASE}.x64.tar`);
  });

  it("resolves the arm64 arch-suffixed pack URL", () => {
    expect(resolveChromiumPackUrl("arm64")).toBe(`${BASE}.arm64.tar`);
  });

  it("throws the typed PdfRenderError for an unsupported architecture", () => {
    expect(() => resolveChromiumPackUrl("ia32")).toThrow(PdfRenderError);
  });
});
