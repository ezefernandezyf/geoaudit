/**
 * Engine-local crawler I/O types (design: engine-local types keep engines
 * self-contained and avoid contract-bloat). Cross-engine shapes live in
 * `src/lib/contracts/` — the crawler engine maps to `CrawlerResult` there via
 * `toContractResult` (see access-map.ts).
 */

export const BOT_TIERS = ["Tier1", "Tier2", "Other"] as const;
export type BotTier = (typeof BOT_TIERS)[number];

export const BOT_IMPACTS = ["Critical", "High", "Medium"] as const;
export type BotImpact = (typeof BOT_IMPACTS)[number];

/** One registered AI crawler (RCR-1). */
export interface BotAgent {
  userAgent: string;
  tier: BotTier;
  impact: BotImpact;
}
