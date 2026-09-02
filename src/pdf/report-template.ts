import type {
  AuditResult,
  MultiPageResult,
  SeverityBand,
} from "@/lib/contracts/audit-result";
import { formatAuditDate, formatDurationMs } from "@/report/format";
import { severityForScore } from "@/scoring/calculator";
import {
  DOMAIN_ROWS,
  isEngineDegraded,
  rowScore,
} from "@/report/domain-metrics";
import { BRAND_DESCRIPTOR, BRAND_NAME } from "@/lib/brand";

/**
 * PDF report template (U4, PDF-4/5/6, design D3).
 *
 * Turns a persisted audit result into a SELF-CONTAINED HTML document that
 * `render.ts` feeds to headless Chromium. Self-contained means:
 *
 * - Fonts are self-hosted in `public/fonts/` and declared via `@font-face`
 *   (PDF-5) - `next/font` does not apply outside the Next render tree. The
 *   route traces `public/fonts/` into the function bundle (PDF-8) and
 *   `render.ts` points a `<base>` at it so they resolve OFFLINE.
 * - The navy/emerald/amber/red design tokens are inlined (PDF-6) and the CSS
 *   uses `print-color-adjust: exact` so backgrounds survive print.
 * - `@page { size: A4 }` shapes the printed page.
 *
 * Single-page audits render the full report (score hero, domain scorecard,
 * findings, meta). Multi-page master rows (D3) render the aggregate hero plus
 * one row per audited page - per-page PDFs are deferred per proposal scope.
 *
 * Every interpolated value is HTML-escaped: the audit data originates from a
 * fetched page, so it is treated as untrusted text, never markup.
 */

/** Escapes HTML special characters - audit content is untrusted text. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Band → score accent color (600-level shades, print-legible on white). */
const BAND_SCORE_HEX: Record<SeverityBand, string> = {
  Excellent: "#16a34a",
  Good: "#059669",
  Fair: "#d97706",
  Poor: "#ea580c",
  Critical: "#dc2626",
};

/** Band → severity chip tint (50-level bg + 700-level text, WCAG AA). */
const BAND_CHIP: Record<SeverityBand, { bg: string; text: string }> = {
  Excellent: { bg: "#f0fdf4", text: "#15803d" },
  Good: { bg: "#ecfdf5", text: "#047857" },
  Fair: { bg: "#fffbeb", text: "#b45309" },
  Poor: { bg: "#fff7ed", text: "#c2410c" },
  Critical: { bg: "#fef2f2", text: "#b91c1c" },
};

/** Band → Spanish label (mirrors `SeverityBadge`, STYLE-BRIEF §7). */
const BAND_LABEL: Record<SeverityBand, string> = {
  Excellent: "Excelente",
  Good: "Bueno",
  Fair: "Regular",
  Poor: "Deficiente",
  Critical: "Crítico",
};

/** The four brand tokens inline (PDF-6) - the CSS variables the report uses. */
const BRAND_CSS = `
  --navy: #0f172a;
  --emerald: #10b981;
  --amber: #f59e0b;
  --red: #ef4444;
  --surface-muted: #f8fafc;
  --border: #e2e8f0;
  --text-secondary: #475569;
`;

/** @font-face block per self-hosted font in `public/fonts/` (PDF-5). */
const FONT_FACES = `
  @font-face {
    font-family: "Instrument Serif";
    src: url("/fonts/InstrumentSerif-Regular.ttf") format("truetype");
    font-weight: 400;
    font-style: normal;
  }
  @font-face {
    font-family: "Instrument Serif";
    src: url("/fonts/InstrumentSerif-Italic.ttf") format("truetype");
    font-weight: 400;
    font-style: italic;
  }
  @font-face {
    font-family: "Work Sans";
    src: url("/fonts/WorkSans-Regular.ttf") format("truetype");
    font-weight: 400;
    font-style: normal;
  }
  @font-face {
    font-family: "Work Sans";
    src: url("/fonts/WorkSans-Bold.ttf") format("truetype");
    font-weight: 700;
    font-style: normal;
  }
  @font-face {
    font-family: "JetBrains Mono";
    src: url("/fonts/JetBrainsMono-Regular.ttf") format("truetype");
    font-weight: 400;
    font-style: normal;
  }
`;

/** Print + layout CSS shared by both report shapes. */
const PRINT_CSS = `
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Work Sans", sans-serif;
    font-size: 11px;
    line-height: 1.55;
    color: var(--navy);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h1, h2, h3 { font-family: "Instrument Serif", serif; margin: 0; }
  h2 { font-size: 17px; letter-spacing: -0.01em; }
  h3 { font-size: 12px; font-family: "Work Sans", sans-serif; font-weight: 700; }
  code, .mono { font-family: "JetBrains Mono", monospace; font-size: 9px; }
  .page { max-width: 180mm; margin: 0 auto; }
  .brand-header {
    display: flex; align-items: baseline; justify-content: space-between;
    border-bottom: 2px solid var(--emerald); padding-bottom: 6px; margin-bottom: 14px;
  }
  .brand-header .brand { font-family: "Instrument Serif", serif; font-size: 20px; letter-spacing: -0.01em; }
  .brand-header .doc-title { font-size: 10px; color: var(--text-secondary); }
  .hero {
    display: flex; align-items: center; justify-content: space-between;
    border: 1px solid var(--border); border-radius: 6px; padding: 14px; margin-bottom: 16px;
  }
  .hero .geo-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-secondary); }
  .hero .geo-score { font-family: "Instrument Serif", serif; font-size: 46px; line-height: 1; }
  .hero .url { font-size: 10px; color: var(--navy); overflow-wrap: anywhere; }
  .hero .meta { font-size: 9px; color: var(--text-secondary); text-align: right; }
  .chip {
    display: inline-block; border-radius: 999px; padding: 1px 8px;
    font-size: 9px; font-weight: 700; border: 1px solid transparent;
  }
  .section { margin-bottom: 16px; }
  .row {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; margin-top: 6px;
  }
  .row .row-label { font-size: 11px; font-weight: 500; }
  .row .row-score { font-family: "Instrument Serif", serif; font-size: 17px; }
  .bar-track { height: 5px; border-radius: 999px; background: var(--surface-muted); overflow: hidden; margin-top: 6px; }
  .bar-fill { height: 5px; border-radius: 999px; }
  .unavailable { color: var(--text-secondary); font-size: 10px; }
  ul, ol { margin: 4px 0 0; padding-left: 16px; }
  li { margin-top: 3px; }
  .passage { overflow-wrap: anywhere; }
  .suggestion, .issue, .avisos li {
    border: 1px solid var(--border); background: var(--surface-muted);
    border-radius: 6px; padding: 5px 8px; font-size: 10px; margin-top: 4px;
  }
  .suggestion .key { color: var(--text-secondary); }
  .bot-badge {
    display: inline-block; border-radius: 999px; padding: 0 6px; margin-left: 6px;
    font-size: 8px; font-weight: 700; color: var(--red);
  }
  .findings-grid { margin-top: 8px; }
  .findings-block { margin-top: 10px; }
  .meta-strip { display: flex; gap: 18px; font-size: 9px; color: var(--text-secondary); }
  .avisos { margin: 8px 0 0; padding-left: 0; list-style: none; }
  .avisos-title { font-size: 10px; font-weight: 700; margin-top: 10px; }
  .footer {
    margin-top: 18px; padding-top: 6px; border-top: 2px solid var(--emerald);
    font-size: 8px; color: var(--text-secondary);
    display: flex; justify-content: space-between;
  }
`;

function severityChip(band: SeverityBand): string {
  const { bg, text } = BAND_CHIP[band];
  const label = BAND_LABEL[band];
  return `<span class="chip" style="background:${bg};color:${text}">${label}</span>`;
}

function domainScorecard(result: AuditResult): string {
  const { errors } = result.meta;
  const rows = DOMAIN_ROWS.map(({ engine, label }) => {
    const degraded = isEngineDegraded(errors, engine);
    const score = rowScore(result, engine);
    if (degraded) {
      return `<div class="row">
        <span class="row-label">${escapeHtml(label)}</span>
        <span class="unavailable">No disponible</span>
      </div>`;
    }
    if (score === null) {
      // APT-11: a row the engine did not measure (legacy 2.0.0 without
      // brandAuthority, RAO-16) prints "No medido" - never a fabricated 0.
      return `<div class="row">
        <span class="row-label">${escapeHtml(label)}</span>
        <span class="unavailable">No medido</span>
      </div>`;
    }
    const band = severityForScore(score);
    return `<div class="row">
        <span class="row-label">${escapeHtml(label)}</span>
        <span class="row-score" style="color:${BAND_SCORE_HEX[band]}">${score}</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${score}%;background:${BAND_SCORE_HEX[band]}"></div></div>`;
  });
  return rows.join("\n");
}

function blockedBots(result: AuditResult): string[] {
  return Object.entries(result.crawlers.perBot)
    .filter(([, status]) => status === "blocked")
    .map(([bot]) => bot);
}

function findings(result: AuditResult): string {
  const { citability, schema } = result;
  const bots = blockedBots(result);
  const hasCitability =
    citability.top3.length > 0 ||
    citability.bottom3.length > 0 ||
    citability.suggestions.length > 0;
  const hasSchema = schema.issues.length > 0;
  const hasBots = bots.length > 0;

  if (!hasCitability && !hasSchema && !hasBots) {
    return `<p style="color:var(--text-secondary);font-size:10px">Sin hallazgos destacados.</p>`;
  }

  const blocks: string[] = [];
  if (hasCitability) {
    if (citability.top3.length > 0) {
      blocks.push(`<div class="findings-block">
        <h3>Pasajes más citables</h3>
        <ol>${citability.top3.map((p) => `<li class="passage">${escapeHtml(p)}</li>`).join("")}</ol>
      </div>`);
    }
    if (citability.bottom3.length > 0) {
      blocks.push(`<div class="findings-block">
        <h3>A mejorar</h3>
        <ul>${citability.bottom3.map((p) => `<li class="passage">${escapeHtml(p)}</li>`).join("")}</ul>
      </div>`);
    }
    if (citability.suggestions.length > 0) {
      blocks.push(`<div class="findings-block">
        <h3>Sugerencias de contenido</h3>
        ${citability.suggestions
          .map(
            ({ block, key }) =>
              `<div class="suggestion"><span style="font-weight:700">${escapeHtml(block)}</span> <span class="key mono">${escapeHtml(key)}</span></div>`,
          )
          .join("")}
      </div>`);
    }
  }
  if (hasSchema) {
    blocks.push(`<div class="findings-block">
      <h3>Advertencias de schema</h3>
      ${schema.issues.map((issue) => `<div class="issue">${escapeHtml(issue)}</div>`).join("")}
    </div>`);
  }
  if (hasBots) {
    blocks.push(`<div class="findings-block">
      <h3>Bots bloqueados</h3>
      <ul style="list-style:none;padding-left:0">
        ${bots.map((bot) => `<li style="margin-top:4px"><span style="font-weight:700">${escapeHtml(bot)}</span><span class="bot-badge">bloqueado</span></li>`).join("")}
      </ul>
    </div>`);
  }
  return `<div class="findings-grid">${blocks.join("")}</div>`;
}

function reportMeta(result: AuditResult): string {
  const avisos =
    result.meta.errors.length > 0
      ? `<p class="avisos-title">Avisos del análisis</p>
         <ul class="avisos">${result.meta.errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("")}</ul>`
      : "";
  return `<div class="meta-strip">
    <span>${escapeHtml(formatAuditDate(result.meta.completedAt))}</span>
    <span>Duración: ${escapeHtml(formatDurationMs(result.summary.durationMs))}</span>
  </div>${avisos}`;
}

function document(hero: string, body: string, footerUrl: string): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${BRAND_NAME} - ${BRAND_DESCRIPTOR}</title>
<style>
:root {${BRAND_CSS}}
${FONT_FACES}
${PRINT_CSS}
</style>
</head>
<body>
<div class="page">
  <div class="brand-header">
    <span class="brand">${BRAND_NAME}</span>
    <span class="doc-title">Reporte de auditoría GEO</span>
  </div>
  ${hero}
  ${body}
  <div class="footer">
    <span>${BRAND_NAME} - Reporte de auditoría GEO</span>
    <span>${escapeHtml(footerUrl)}</span>
  </div>
</div>
</body>
</html>
`;
}

function hero(
  url: string,
  geoScore: number,
  band: SeverityBand,
  durationMs: number,
): string {
  return `<div class="hero">
  <div>
    <p class="geo-label">GEO Score</p>
    <p class="geo-score" style="color:${BAND_SCORE_HEX[band]}">${geoScore}</p>
    ${severityChip(band)}
  </div>
  <div class="meta">
    <p class="url">${escapeHtml(url)}</p>
    <p>Duración: ${escapeHtml(formatDurationMs(durationMs))}</p>
  </div>
</div>`;
}

/**
 * Renders the persisted result to a complete HTML document for PDF
 * generation (PDF-4). Discriminates the two persisted shapes (D3): the full
 * single-page `AuditResult` or the light multi-page master shape.
 */
export function buildReportHtml(result: AuditResult | MultiPageResult): string {
  if ("aggregate" in result) {
    const { aggregate, pages } = result;
    const body = `<div class="section">
  <h2>Páginas analizadas</h2>
  ${pages
    .map(
      (page) => `<div class="row">
        <span style="font-size:10px;overflow-wrap:anywhere">${escapeHtml(page.url)}</span>
        <span style="display:flex;align-items:center;gap:8px;white-space:nowrap">
          <span class="row-score" style="color:${BAND_SCORE_HEX[page.severityBand]}">${page.geoScore}</span>
          ${severityChip(page.severityBand)}
          <span style="color:var(--text-secondary);font-size:9px">${escapeHtml(formatDurationMs(page.durationMs))}</span>
        </span>
      </div>`,
    )
    .join("\n")}
</div>`;
    return document(
      hero(
        aggregate.url,
        aggregate.geoScore,
        aggregate.severityBand,
        aggregate.durationMs,
      ),
      body,
      aggregate.url,
    );
  }

  const body = `<div class="section">
  <h2>Puntajes por dominio</h2>
  ${domainScorecard(result)}
</div>
<div class="section">
  <h2>Hallazgos</h2>
  ${findings(result)}
</div>
<div class="section">
  ${reportMeta(result)}
</div>`;
  return document(
    hero(
      result.summary.url,
      result.summary.geoScore,
      result.summary.severityBand,
      result.summary.durationMs,
    ),
    body,
    result.summary.url,
  );
}
