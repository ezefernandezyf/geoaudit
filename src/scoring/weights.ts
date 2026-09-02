/**
 * GEO Score weights (design D4/D5, RGS-1, RGS-7, RGS-8).
 *
 * Brand Authority (20% in brief §8.1) was renormalized out of v1/v2 because no
 * engine measured it; v3.0.0 re-enters the dimension at 20% (design D5,
 * RGS-8). The 6-dimension distribution re-calibrates citability down from 28%
 * to 22.4% while keeping it dominant.
 *
 * Three configurations exist:
 * - `SPRINT_1_WEIGHTS` (1.0.0): citability 31.25 / eeat 25 / technical 18.75 /
 *   schema 12.5 / platform 12.5 - kept for historical regression tests.
 * - `GEO_SCORE_V2_WEIGHTS` (2.0.0): citability 28 / eeat 24 / technical 20 /
 *   schema 14 / platform 14 - the WU-2 calibration decision (sprint 9):
 *   citability stays dominant, the two healthiest dimensions (crawler/content)
 *   yield weight to the dimensions that crushed the total (schema/citability).
 * - `GEO_SCORE_V3_WEIGHTS` (3.0.0): citability 22.4 / eeat 19.2 / technical 16 /
 *   schema 11.2 / platform 11.2 / brand_authority 20 - Brand Authority
 *   re-enters at its brief §8.1 weight (design D5, RGS-1/8).
 */

export type DimensionKey =
  | "citability"
  | "eeat"
  | "technical"
  | "schema"
  | "platform"
  | "brand_authority";

export interface GeoScoreWeights {
  version: string;
  /**
   * Partial so historical configs (SPRINT_1/V2) keep 5 keys - the absent
   * brand_authority key documents "renormalized out" (design D5, RGS-8).
   */
  weights: Partial<Record<DimensionKey, number>>;
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

/**
 * v2.0.0 calibrated weights (RGS-1, WU-2 decision, sprint 9). Citability stays
 * the dominant dimension (28%); technical/content yield weight to schema and
 * platform so partial structured data and platform readiness count more.
 */
export const GEO_SCORE_V2_WEIGHTS: GeoScoreWeights = {
  version: "2.0.0",
  weights: {
    citability: 28,
    eeat: 24,
    technical: 20,
    schema: 14,
    platform: 14,
  },
  renormalizationNote:
    "Brand Authority 20% re-enters with scoringModelVersion bump; weights renormalized per P1",
};

/**
 * v3.0.0 calibrated weights (RGS-1, design D5, sprint 13). Brand Authority
 * re-enters the model at its brief §8.1 weight (20%) - the 5-dimension
 * distribution is re-scaled to make room while citability stays dominant
 * (22.4% > 19.2%). Six weights sum to 100%.
 */
export const GEO_SCORE_V3_WEIGHTS: GeoScoreWeights = {
  version: "3.0.0",
  weights: {
    citability: 22.4,
    eeat: 19.2,
    technical: 16,
    schema: 11.2,
    platform: 11.2,
    brand_authority: 20,
  },
  renormalizationNote:
    "Brand Authority re-enters in v3.0.0 at 20% (brief §8.1); six-dimension distribution re-calibrated, citability stays dominant",
};
