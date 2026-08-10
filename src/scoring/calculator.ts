import type { SeverityBand } from "@/lib/contracts/audit-result";
import {
  SPRINT_1_WEIGHTS,
  type DimensionKey,
  type GeoScoreWeights,
} from "./weights";

/**
 * GEO Score calculator (RGS-1..RGS-10).
 *
 * `computeGeoScore(engineScores, weights)` computes the weighted composite of
 * the five available dimension scores, rounds to the nearest integer, caps at
 * 100, and assigns the P3 severity band. Missing engines are excluded and the
 * remaining weights are re-balanced among the available dimensions (RGS-9).
 * The Technical dimension is composed from `crawler.compositeScore × 0.6 +
 * platform.onPageScore × 0.4` when no standalone technical score is provided
 * (RGS-2, design `src/scoring/`).
 *
 * Pure function: deterministic, no side effects, no I/O.
 */

/** One dimension's score as reported by its engine (missing = `null`). */
export type EngineScores = Partial<Record<DimensionKey, number | null>> & {
  /** crawler.compositeScore — composes `technical` when it is absent (RGS-2). */
  crawler?: number | null;
  /** Engine failure reasons keyed by dimension (RGS-9) — surfaced in notes. */
  failures?: Partial<Record<DimensionKey, string>>;
};

export interface GeoScoreResult {
  /** Rounded (nearest integer) and capped at 100 composite score. */
  geoScore: number;
  /** P3 severity band of the rounded score (RGS-5). */
  severityBand: SeverityBand;
  /** RGS-7: surfaced from the weights config. */
  scoringModelVersion: string;
  /** The weights config used (version + distribution + renormalizationNote). */
  weights: GeoScoreWeights;
  /** Per-dimension score actually used (technical composed when applicable). */
  dimensions: Record<DimensionKey, number | null>;
  /** RGS-8/RGS-9/RGS-10 notes: exclusions, rebalancing, zero-content. */
  notes: string[];
}

export const DIMENSIONS: readonly DimensionKey[] = [
  "citability",
  "eeat",
  "technical",
  "schema",
  "platform",
];

/** P3 severity band mapping: 90-100 Excellent / 75-89 Good / 60-74 Fair / 40-59 Poor / 0-39 Critical. */
export function severityForScore(score: number): SeverityBand {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Poor";
  return "Critical";
}

/** RGS-2: technical = crawler.compositeScore × 0.6 + platform.onPageScore × 0.4. */
export function composeTechnical(
  crawlerScore: number,
  platformScore: number,
): number {
  return crawlerScore * 0.6 + platformScore * 0.4;
}

export function computeGeoScore(
  engineScores: EngineScores = {},
  weights: GeoScoreWeights = SPRINT_1_WEIGHTS,
): GeoScoreResult {
  const notes: string[] = [];

  const rawTechnical = engineScores.technical ?? null;
  const rawPlatform = engineScores.platform ?? null;
  const rawCrawler = engineScores.crawler ?? null;

  // RGS-2: compose the Technical dimension when no standalone score is given
  // and both crawler + platform scores are available.
  const technical =
    rawTechnical !== null
      ? rawTechnical
      : rawCrawler !== null && rawPlatform !== null
        ? composeTechnical(rawCrawler, rawPlatform)
        : null;

  const dimensions: Record<DimensionKey, number | null> = {
    citability: engineScores.citability ?? null,
    eeat: engineScores.eeat ?? null,
    technical,
    schema: engineScores.schema ?? null,
    platform: rawPlatform,
  };

  const available = DIMENSIONS.filter(
    (key) => dimensions[key] !== null && dimensions[key] !== undefined,
  );

  // RGS-10: no engine produced a score → valid result, never NaN.
  if (available.length === 0) {
    return {
      geoScore: 0,
      severityBand: severityForScore(0),
      scoringModelVersion: weights.version,
      weights,
      dimensions,
      notes: [...notes, "No engine scores available; composite defaults to 0"],
    };
  }

  // RGS-9: re-balance weights among the available dimensions.
  const availableWeight = available.reduce(
    (sum, key) => sum + weights.weights[key],
    0,
  );
  const weighted = available.reduce(
    (sum, key) => sum + (dimensions[key] as number) * weights.weights[key],
    0,
  );
  const composite = weighted / availableWeight;

  // RGS-9: note each excluded engine with its failure reason when known.
  const missing = DIMENSIONS.filter(
    (key) => dimensions[key] === null || dimensions[key] === undefined,
  );
  for (const key of missing) {
    const reason = engineScores.failures?.[key];
    notes.push(
      reason
        ? `${key} excluded (${reason}); weights rebalanced among available engines`
        : `${key} excluded; weights rebalanced among available engines`,
    );
  }

  // RGS-10: zero extractable content blocks is documented on the citability score.
  if (dimensions.citability === 0) {
    notes.push("citability 0: no extractable content blocks");
  }

  // RGS-4: round to nearest integer, cap at 100.
  const geoScore = Math.min(100, Math.round(composite));

  return {
    geoScore,
    severityBand: severityForScore(geoScore),
    scoringModelVersion: weights.version,
    weights,
    dimensions,
    notes,
  };
}
