import { describe, expect, it } from "vitest";
import { buildReportHtml } from "@/pdf/report-template";
import type { MultiPageResult } from "@/lib/contracts/audit-result";
import { auditResultFixture } from "@/lib/contracts/__fixtures__/audit-result";
import { BRAND_DESCRIPTOR, BRAND_NAME } from "@/lib/brand";

/**
 * U4.3/U4.4 - PDF report template (PDF-4/5/6, design D3).
 *
 * `buildReportHtml` turns a persisted result into a self-contained HTML
 * document that Chromium renders to PDF: design tokens inline (PDF-6), fonts
 * self-hosted in `public/fonts/` via `@font-face` (PDF-5) and the same report
 * sections as the web report (score hero, domain scorecard, findings, meta).
 * The multi-page master shape (D3) renders its aggregate + per-page rows.
 */
const FONT_FILES = [
  "InstrumentSerif-Regular.ttf",
  "InstrumentSerif-Italic.ttf",
  "WorkSans-Regular.ttf",
  "WorkSans-Bold.ttf",
  "JetBrainsMono-Regular.ttf",
];

const BRAND_TOKENS = ["#0f172a", "#10b981", "#f59e0b", "#ef4444"];

describe("buildReportHtml (PDF-5/6)", () => {
  it("emits an @font-face block per self-hosted font resolved from public/fonts", () => {
    const html = buildReportHtml(auditResultFixture);

    for (const file of FONT_FILES) {
      expect(html).toContain(`/fonts/${file}`);
    }
    expect(html).toMatch(/@font-face/);
  });

  it("embeds the navy/emerald/amber/red design tokens so brand colors print", () => {
    const html = buildReportHtml(auditResultFixture);

    for (const token of BRAND_TOKENS) {
      expect(html).toContain(token);
    }
  });

  it("declares @page print CSS for A4 output", () => {
    const html = buildReportHtml(auditResultFixture);

    expect(html).toMatch(/@page\s*\{[^}]*size:\s*A4/i);
  });

  it("renders the Relevy brand in the title, wordmark and footer (SHL-9)", () => {
    const html = buildReportHtml(auditResultFixture);

    expect(html).toContain(
      `<title>${BRAND_NAME} - ${BRAND_DESCRIPTOR}</title>`,
    );
    expect(html).toContain(`<span class="brand">${BRAND_NAME}</span>`);
    expect(html).toContain(`${BRAND_NAME} - Reporte de auditoría GEO`);
    expect(html).not.toContain("GeoAudit");
  });

  it("emits a complete HTML document", () => {
    const html = buildReportHtml(auditResultFixture);

    expect(html.trimStart().toLowerCase().startsWith("<!doctype html>")).toBe(
      true,
    );
    expect(html).toMatch(/<\/html>\s*$/);
  });
});

describe("buildReportHtml single-page report (PDF-4)", () => {
  it("renders the GEO Score, the audited URL and the severity band label", () => {
    const html = buildReportHtml(auditResultFixture);

    expect(html).toContain("68");
    expect(html).toContain("https://example.com/");
    expect(html).toContain("Regular");
  });

  it("renders the five domain rows with their derived scores", () => {
    const html = buildReportHtml(auditResultFixture);

    for (const label of [
      "Acceso de bots",
      "Citabilidad",
      "E-E-A-T",
      "Datos estructurados",
      "Plataforma",
    ]) {
      expect(html).toContain(label);
    }
    // crawlers 71 · citability 62 · content 65 · schema proxy 90 · platform aio 70
    expect(html).toContain("71");
    expect(html).toContain("90");
    expect(html).toContain("70");
  });

  it("renders findings: top passages, suggestions, schema issues and blocked bots", () => {
    const html = buildReportHtml(auditResultFixture);

    expect(html).toContain("Pasajes más citables");
    expect(html).toContain(
      "GEO is the practice of optimizing content for AI assistants.",
    );
    expect(html).toContain("Sugerencias de contenido");
    expect(html).toContain("define_core_concept");
    expect(html).toContain("Organization missing sameAs");
    expect(html).toContain("OAI-SearchBot");
    expect(html).toContain("bloqueado");
  });

  it("renders a No disponible chip for a degraded engine (RAO-12 honesty)", () => {
    const degraded = {
      ...auditResultFixture,
      citability: {
        ...auditResultFixture.citability,
        pageScore: 0,
        top3: [],
        bottom3: [],
        suggestions: [],
      },
      meta: { ...auditResultFixture.meta, errors: ["citability: boom"] },
    };

    const html = buildReportHtml(degraded);

    expect(html).toContain("No disponible");
  });

  it("renders the meta strip with the audit date and duration", () => {
    const html = buildReportHtml(auditResultFixture);

    expect(html).toContain("3.2 s");
  });
});

describe("buildReportHtml multi-page aggregate (D3)", () => {
  const multiPageResult: MultiPageResult = {
    aggregate: {
      url: "https://example.com/",
      geoScore: 74,
      severityBand: "Fair",
      durationMs: 2400,
    },
    pages: [
      {
        url: "https://example.com/",
        geoScore: 68,
        severityBand: "Fair",
        durationMs: 900,
      },
      {
        url: "https://example.com/blog",
        geoScore: 80,
        severityBand: "Good",
        durationMs: 1100,
      },
    ],
  };

  it("renders the aggregate score plus one row per audited page", () => {
    const html = buildReportHtml(multiPageResult);

    expect(html).toContain("74");
    expect(html).toContain("Páginas analizadas");
    expect(html).toContain("https://example.com/blog");
    expect(html).toContain("Bueno");
  });
});
