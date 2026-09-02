/**
 * Gemini-shaped view model types (APT-1, design `presenters/types.ts`).
 *
 * These are the honest, nullable version of the Gemini reference
 * (`/home/ezeyf/Descargas/relevy/src/types.ts`): every field the report
 * components need, but where the real `AuditResult` contract does not measure
 * something (citationRate, impactScore, presenceInPrompts, lastCrawled) the
 * field is either omitted or nullable - the adapter never fabricates a value
 * presented as measured (APT-10).
 *
 * Pure types only: no React, no I/O. Consumed by the pure adapter
 * `toGeminiViewModel` and every presentational report component (U5.5+).
 */

/** Lowercase Gemini severity band (normalized from the Capitalized contract). */
export type GeminiBand = "excellent" | "good" | "fair" | "poor" | "critical";

/** One of the six report category rows, with its real score and weight. */
export interface CategoryScore {
  /** Stable id (the domain-metrics engine key). */
  id: string;
  /** Display name (Spanish UI). */
  name: string;
  /**
   * Real engine score 0-100, or `null` when the row was not measured (legacy
   * 2.0.0 without `brandAuthority`, or a failed engine, RAO-16/APT-11). `null`
   * renders "No medido" - the adapter never fabricates a 0 for it (APT-10).
   * A MEASURED 0 (brand without external presence, RGS-11) is a real 0.
   */
  score: number | null;
  /** Always 100 (all dimensions are scored out of 100). */
  maxScore: 100;
  /** Real weight from the v3.1.0 weights, formatted as a percent string. */
  weight: string;
  /**
   * Lowercase band of the real score (80/65/50/30 thresholds), or `null` when
   * the score is `null` - a "No medido" row carries no band (APT-11).
   */
  status: GeminiBand | null;
  /** Always null - the engine does not expose a key metric (APT-10). */
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
  /** Lowercase band - honest, derived from real scores where possible. */
  severity: GeminiBand;
  /** Report section this finding belongs to. */
  category: "Crawlers" | "Citabilidad" | "Datos estructurados";
  /** Detail text. */
  description: string;
  /**
   * Optional grouped items (ARU-13/14, design sprint 8 A1/A2): when a finding
   * aggregates a category (structured-data issues, blocked bots), the raw
   * items travel here and the UI renders them as a list under the description.
   */
  details?: string[];
  /** Always null - the engine does not compute an impact score (APT-7/10). */
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
 * presenter of this shape - it never reads `AuditResult` directly.
 */
export interface GeminiView {
  /** Real GEO Score, rounded to the nearest integer. */
  totalScore: number;
  /** Lowercase band of the real score (80/65/50/30 thresholds). */
  band: GeminiBand;
  /** Hostname of the audited URL. */
  domain: string;
  /** Title - falls back to the domain when no real title is derivable. */
  title: string;
  /** One-line summary built only from real metrics. */
  summary: string;
  /** Audit duration in whole seconds (min 1 when non-zero). */
  durationSeconds: number;
  /** Persisted audit date - provided by the caller, null by default. */
  auditDate: string | null;
  /** Exactly six category scores (Acceso de bots / Citabilidad / E-E-A-T / Datos estructurados / Plataforma / Autoridad de marca). */
  categoryScores: CategoryScore[];
  /** Findings derived from real citability + schema + crawler data. */
  findings: Finding[];
  /** Six platform rows (Claude readiness null when not measured). */
  platforms: PlatformRow[];
  /** Passed through from the caller; null when absent (APT-9). */
  shareToken: string | null;
}
