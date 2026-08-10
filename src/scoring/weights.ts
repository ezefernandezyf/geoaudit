/**
 * Sprint 1 renormalized GEO Score weights (design D4, RGS-1, RGS-7, RGS-8).
 *
 * Brand Authority (20% in brief §8.1) has no engine in Sprint 1 — per P1 the
 * remaining 80% is renormalized across the five available engines, and the
 * dimension re-enters with a future `scoringModelVersion` bump.
 */

export type DimensionKey =
  "citability" | "eeat" | "technical" | "schema" | "platform";

export interface GeoScoreWeights {
  version: string;
  weights: Record<DimensionKey, number>;
  renormalizationNote: string;
}

export const SPRINT_1_WEIGHTS: GeoScoreWeights = {
  version: "1.0.0",
  weights: {
    citability: 31.25,
    eeat: 25,
    technical: 18.75,
    schema: 12.5,
    platform: 12.5,
  },
  renormalizationNote:
    "Brand Authority 20% re-enters with scoringModelVersion bump; weights renormalized per P1",
};
