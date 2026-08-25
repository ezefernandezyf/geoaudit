import type { AuditResult } from "@/lib/contracts/audit-result";
import { DOMAIN_ROWS, rowScore } from "@/report/domain-metrics";
import { severityForScore } from "@/scoring/calculator";
import { SPRINT_1_WEIGHTS } from "@/scoring/weights";
import { deriveFindings } from "./findings";
import { buildPlatformRows } from "./platforms";
import type { GeminiBand, GeminiView } from "./types";

/**
 * Pure adapter (U5.2, APT-2..APT-6, APT-9, APT-10, design
 * `presenters/toGeminiViewModel.ts`).
 *
 * Maps a real `AuditResult` into the Gemini-shaped `GeminiView`. This is the
 * single source of truth for data binding: every report/landing/dashboard
 * component becomes a pure presenter of this view model and never reads
 * `AuditResult` directly.
 *
 * Pure: no I/O, no state, deterministic — fully unit-testable with fixtures.
 *
 * Notes on the binding decisions:
 * - Score + band use the REAL `severityForScore` thresholds (90/75/60/40),
 *   never Gemini's 80/65/45/25. The Capitalized contract band is normalized to
 *   lowercase here (APT-2).
 * - The `AuditResult` contract does not carry `shareToken` or `createdAt`
 *   (those live on the persisted Prisma `Audit` row, supplied by the caller),
 *   so the adapter accepts them via an optional `ctx` and passes them through
 *   when present, `null` otherwise (APT-9). This keeps the function pure.
 */

/** Caller-provided context the contract does not carry. */
export type ViewModelContext = {
  /** Persisted share token — passed through when present (APT-9). */
  shareToken?: string | null;
  /** Persisted audit date — passed through when present. */
  auditDate?: string | null;
};

/** Hostname of an audited URL; empty string on any parse failure. */
function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

/** Weight (SPRINT_1_WEIGHTS) for a domain-metrics engine key (design §Adapter). */
const ENGINE_WEIGHT: Record<string, number> = {
  crawler: SPRINT_1_WEIGHTS.weights.technical, // 18.75
  citability: SPRINT_1_WEIGHTS.weights.citability, // 31.25
  content: SPRINT_1_WEIGHTS.weights.eeat, // 25
  schema: SPRINT_1_WEIGHTS.weights.schema, // 12.5
  platform: SPRINT_1_WEIGHTS.weights.platform, // 12.5
};

/** Concise, honest description per category (Spanish UI). */
const CATEGORY_DESCRIPTION: Record<string, string> = {
  crawler: "Acceso de los crawlers de IA al sitio.",
  citability: "Probabilidad de que los asistentes citen los pasajes.",
  content: "Calidad del contenido según E-E-A-T.",
  schema: "Marcado de datos estructurados.",
  platform: "Preparación de la plataforma para IA.",
};

/** Lowercase Gemini band from a real score. */
function bandFor(score: number): GeminiBand {
  return severityForScore(score).toLowerCase() as GeminiBand;
}

/** One-line summary composed ONLY from real metrics (APT-4, APT-10). */
function buildSummary(
  domain: string,
  totalScore: number,
  band: GeminiBand,
  durationSeconds: number,
): string {
  return `${domain} — GEO Score ${totalScore} (${band}) en ~${durationSeconds}s`;
}

export function toGeminiViewModel(
  audit: AuditResult,
  ctx: ViewModelContext = {},
): GeminiView {
  const { url, geoScore, durationMs } = audit.summary;

  const totalScore = Math.round(geoScore);
  const band = bandFor(geoScore);
  const domain = extractHostname(url);
  const title = domain;
  const durationSeconds = Math.max(1, Math.round(durationMs / 1000));

  const categoryScores = DOMAIN_ROWS.map((row) => {
    const score = rowScore(audit, row.engine);
    const weight = ENGINE_WEIGHT[row.engine] ?? 0;
    return {
      id: row.engine,
      name: row.label,
      score,
      maxScore: 100 as const,
      weight: `${weight}%`,
      status: bandFor(score),
      keyMetric: null,
      description: CATEGORY_DESCRIPTION[row.engine] ?? "",
    };
  });

  return {
    totalScore,
    band,
    domain,
    title,
    summary: buildSummary(domain, totalScore, band, durationSeconds),
    durationSeconds,
    auditDate: ctx.auditDate ?? null,
    categoryScores,
    findings: deriveFindings(audit.citability, audit.schema, audit.crawlers),
    platforms: buildPlatformRows(
      audit.platform.perPlatform,
      audit.crawlers.perBot,
    ),
    shareToken: ctx.shareToken ?? null,
  };
}
