import type {
  CitabilityResult,
  CrawlerResult,
  SchemaResult,
} from "@/lib/contracts/audit-result";
import { deriveSchemaScore } from "@/report/domain-metrics";
import { severityForScore } from "@/scoring/calculator";
import type { Finding } from "./types";

/**
 * Findings derivation (U5.3, APT-7, APT-10, design `presenters/findings.ts`).
 *
 * Builds the report's `findings[]` strictly from real engine data:
 * - `citability.bottom3` → weaknesses ("a mejorar"), band = the real citability
 *   band (`severityForScore(pageScore)`).
 * - `citability.top3` → strengths ("positivo"), band `good`.
 * - `schema.issues` → structured-data warnings, band = the real schema band
 *   (`severityForScore(deriveSchemaScore(schema))`); a `codeSnippet` is only
 *   attached when a real source exists (`schema.generated`, JSON.stringify).
 * - `crawlers.perBot` blocked bots → actionable, band `critical`.
 *
 * `impactScore` is ALWAYS null — the engine does not compute one, so we never
 * fabricate a number presented as measured (APT-7, APT-10). Same for any code
 * snippet: it only appears when `schema.generated` is present, never invented.
 */
export function deriveFindings(
  citability: CitabilityResult,
  schema: SchemaResult,
  crawlers: CrawlerResult,
): Finding[] {
  const findings: Finding[] = [];

  for (const [index, passage] of citability.bottom3.entries()) {
    findings.push({
      id: `citability-bottom-${index}`,
      title: "Pasaje a mejorar",
      severity: severityForScore(
        citability.pageScore,
      ).toLowerCase() as Finding["severity"],
      category: "Citabilidad",
      description: passage,
      impactScore: null,
      recommendation:
        "Reescriba el pasaje para que sea autocontenido, específico y fácil de citar por los asistentes de IA.",
    });
  }

  for (const [index, passage] of citability.top3.entries()) {
    findings.push({
      id: `citability-top-${index}`,
      title: "Pasaje altamente citable",
      severity: "good",
      category: "Citabilidad",
      description: passage,
      impactScore: null,
      recommendation:
        "Mantenga este pasaje como referencia de formato citable al crear contenido nuevo.",
    });
  }

  const schemaBand = severityForScore(
    deriveSchemaScore(schema),
  ).toLowerCase() as Finding["severity"];
  const codeSnippet =
    schema.generated !== null
      ? JSON.stringify(schema.generated, null, 2)
      : undefined;

  // ARU-13 (sprint 8): ALL schema issues collapse into ONE finding. The
  // missing properties travel as `details` and the JSON-LD snippet is emitted
  // exactly once instead of once per issue.
  if (schema.issues.length > 0) {
    findings.push({
      id: "schema-issues",
      title: "Datos estructurados: faltan estas propiedades",
      severity: schemaBand,
      category: "Datos estructurados",
      description:
        "El marcado JSON-LD detectado omite propiedades que los asistentes de IA usan para corroborar entidades y hechos.",
      details: schema.issues,
      impactScore: null,
      ...(codeSnippet !== undefined
        ? { codeSnippet, codeLanguage: "json" as const }
        : {}),
      recommendation:
        "Corrija el marcado JSON-LD para mejorar la elegibilidad en los resultados de IA.",
    });
  }

  for (const [bot, status] of Object.entries(crawlers.perBot)) {
    if (status !== "blocked") continue;
    findings.push({
      id: `bot-${bot}`,
      title: `Bot de IA bloqueado: ${bot}`,
      severity: "critical",
      category: "Crawlers",
      description: `El crawler ${bot} no puede acceder al sitio, lo que limita la citabilidad en los asistentes que dependen de él.`,
      impactScore: null,
      recommendation:
        "Revise las reglas de robots.txt y permita el acceso a este crawler para maximizar la visibilidad en IA.",
    });
  }

  return findings;
}
