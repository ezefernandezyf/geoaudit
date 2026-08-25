/**
 * Gemini-shaped view model types (APT-1, design `presenters/types.ts`).
 *
 * These are the honest, nullable version of the Gemini reference
 * (`/home/ezeyf/Descargas/geoaudit/src/types.ts`): every field the report
 * components need, but where the real `AuditResult` contract does not measure
 * something (citationRate, impactScore, presenceInPrompts, lastCrawled) the
 * field is either omitted or nullable — the adapter never fabricates a value
 * presented as measured (APT-10).
 *
 * Pure types only: no React, no I/O. Consumed by the pure adapter
 * `toGeminiViewModel` and every presentational report component (U5.5+).
 */

/** Lowercase Gemini severity band (normalized from the Capitalized contract). */
export type GeminiBand = "excellent" | "good" | "fair" | "poor" | "critical";

/** One of the five report category rows, with its real score and weight. */
export interface CategoryScore {
  /** Stable id (the domain-metrics engine key). */
  id: string;
  /** Display name (Spanish UI). */
  name: string;
  /** Real engine score 0-100 (rowScore derivation). */
  score: number;
  /** Always 100 (all dimensions are scored out of 100). */
  maxScore: 100;
  /** Real weight from SPRINT_1_WEIGHTS, formatted as a percent string. */
  weight: string;
  /** Lowercase band of the real score (90/75/60/40 thresholds). */
  status: GeminiBand;
  /** Always null — the engine does not expose a key metric (APT-10). */
  keyMetric: string | null;
  /** Concise honest description of the category. */
  description: string;
}

/** A single actionable finding derived from real engine data. */
export interface Finding {
  /** Stable unique id for React keys. */
  id: string;
  /** Short headline. */
  title: string;
  /** Lowercase band — honest, derived from real scores where possible. */
  severity: GeminiBand;
  /** Report section this finding belongs to. */
  category: "Crawlers" | "Citabilidad" | "Datos estructurados";
  /** Detail text. */
  description: string;
  /** Always null — the engine does not compute an impact score (APT-7/10). */
  impactScore: null;
  /** Only present when a real source exists (e.g. generated JSON-LD). */
  codeSnippet?: string;
  /** Language hint when a codeSnippet is present. */
  codeLanguage?: "json";
  /** Actionable, honest recommendation. */
  recommendation: string;
}

/** A platform row in the six-platform matrix. */
export interface PlatformRow {
  /** Stable id (chatgpt / claude / perplexity / gemini / aio / copilot). */
  id: string;
  /** Display name (Spanish UI). */
  name: string;
  /** Crawler bot identifier (mono). */
  bot: string;
  /** Readiness score 0-100 from perPlatform, or null when not measured. */
  readiness: number | null;
  /** Bot access state from crawlers.perBot. */
  access: "allowed" | "blocked" | "unknown";
}

/**
 * The full Gemini-shaped view model (APT-1). Every report component is a pure
 * presenter of this shape — it never reads `AuditResult` directly.
 */
export interface GeminiView {
  /** Real GEO Score, rounded to the nearest integer. */
  totalScore: number;
  /** Lowercase band of the real score (90/75/60/40 thresholds). */
  band: GeminiBand;
  /** Hostname of the audited URL. */
  domain: string;
  /** Title — falls back to the domain when no real title is derivable. */
  title: string;
  /** One-line summary built only from real metrics. */
  summary: string;
  /** Audit duration in whole seconds (min 1 when non-zero). */
  durationSeconds: number;
  /** Persisted audit date — provided by the caller, null by default. */
  auditDate: string | null;
  /** Exactly five category scores (Acceso de bots / Citabilidad / E-E-A-T / Datos estructurados / Plataforma). */
  categoryScores: CategoryScore[];
  /** Findings derived from real citability + schema + crawler data. */
  findings: Finding[];
  /** Six platform rows (Claude readiness null when not measured). */
  platforms: PlatformRow[];
  /** Passed through from the caller; null when absent (APT-9). */
  shareToken: string | null;
}
