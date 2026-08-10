/**
 * GEO Score calculator public surface (design: `src/<domain>/index.ts` exposes
 * the engine entry points). The orchestrator (T25) imports from `@/scoring`.
 */

export { SPRINT_1_WEIGHTS } from "./weights";
export type { DimensionKey, GeoScoreWeights } from "./weights";
export {
  computeGeoScore,
  composeTechnical,
  severityForScore,
} from "./calculator";
export type { EngineScores, GeoScoreResult } from "./calculator";
