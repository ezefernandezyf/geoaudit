import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

/**
 * PDF render pipeline (U4, PDF-4/6, threat matrix: Chromium subprocess).
 *
 * `renderPdf(html, deps)` launches headless Chromium, loads the template HTML
 * and returns PDF bytes. Production uses `puppeteer-core` +
 * `@sparticuz/chromium-min` (the Vercel-blessed pair, PDF-4). chromium-min
 * ships NO binary in the package: the stripped Chromium is downloaded at
 * runtime from the pinned GitHub release pack (the official Vercel template
 * pattern) and cached in /tmp per warm instance. Local dev uses the full
 * `puppeteer` dev dependency and its bundled Chrome instead of that download.
 *
 * - PDF-6: `printBackground: true` so navy/emerald/amber/red survive print.
 * - `--no-sandbox`: serverless Chromium cannot use the sandbox (no setuid).
 * - Fonts (PDF-5): the template references `/fonts/*.ttf`; `setContent` has no
 *   origin, so a `<base>` points the browser at the traced `public/` bundle
 *   (PDF-8) and the fonts resolve OFFLINE (no network, no CDN).
 * - Threat: any launch/render rejection is wrapped in the typed
 *   `PdfRenderError` — the route maps it to a 5xx, never an uncaught throw —
 *   and the browser is always closed (finally), so a failed render leaks no
 *   subprocess. `deps` is injected so tests mock the launch chain.
 */

/** Typed render failure — the route maps this to a 5xx (PDF-9). */
export class PdfRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfRenderError";
  }
}

/** Minimal structural surface of a Chromium page used by the pipeline. */
export type PdfPageLike = {
  setContent(
    html: string,
    options?: { waitUntil?: string | string[] },
  ): Promise<void>;
  pdf(options: {
    printBackground?: boolean;
    format?: string;
  }): Promise<Uint8Array>;
};

/** Minimal structural surface of a Chromium browser used by the pipeline. */
export type PdfBrowserLike = {
  newPage(): Promise<PdfPageLike>;
  close(): Promise<void>;
};

/** Injected launch capability — the default wires puppeteer-core + chromium-min. */
export type PdfRenderDeps = {
  launch: () => Promise<PdfBrowserLike>;
};

/** Serverless-safe Chrome flags (threat matrix: Chromium subprocess). */
export const CHROMIUM_ARGS = ["--no-sandbox"];

/** Pinned chromium-min release pack — same Chromium major as the pin (149). */
export const CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.tar";

/** Launch config resolved per environment (dev: puppeteer; prod: chromium-min). */
async function resolveLaunchConfig(): Promise<{
  executablePath: string;
  headless: boolean;
  defaultViewport: { width: number; height: number };
}> {
  if (process.env.NODE_ENV !== "production") {
    // Local dev: the full `puppeteer` dev dep ships its own bundled Chrome
    // (installed via the approved postinstall) — no 50MB+ remote download.
    const devPuppeteer = await import("puppeteer");
    return {
      executablePath: devPuppeteer.default.executablePath(),
      headless: true,
      defaultViewport: { width: 1920, height: 1080 },
    };
  }
  return {
    executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
    headless: chromium.headless,
    defaultViewport: chromium.defaultViewport,
  };
}

const defaultDeps: PdfRenderDeps = {
  async launch() {
    const config = await resolveLaunchConfig();
    return puppeteer.launch({
      args: CHROMIUM_ARGS,
      defaultViewport: config.defaultViewport,
      executablePath: config.executablePath,
      headless: config.headless,
    });
  },
};

/**
 * Renders `html` to PDF bytes (PDF-4). `deps` defaults to the chromium-min
 * launch; tests inject a mock chain. Never throws raw puppeteer errors — only
 * the typed `PdfRenderError`.
 */
export async function renderPdf(
  html: string,
  deps: PdfRenderDeps = defaultDeps,
): Promise<Buffer> {
  let browser: PdfBrowserLike | null = null;
  try {
    browser = await deps.launch();
    const page = await browser.newPage();
    // `/fonts/*` resolves against the traced `public/` bundle (PDF-5/8).
    const base = `file://${process.cwd()}/public/`;
    const documentHtml = html.replace(/<head>/i, `<head><base href="${base}">`);
    await page.setContent(documentHtml, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ printBackground: true, format: "A4" });
    return Buffer.from(pdf);
  } catch (cause) {
    throw new PdfRenderError(
      "No se pudo generar el PDF del reporte. Intente nuevamente.",
    );
  } finally {
    if (browser !== null) {
      await browser.close().catch(() => {
        /* close is best-effort cleanup; the render error is already typed */
      });
    }
  }
}
