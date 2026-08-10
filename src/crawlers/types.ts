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

export const BOT_STATUSES = ["Allowed", "Blocked", "NotMentioned"] as const;
export type BotStatus = (typeof BOT_STATUSES)[number];

/** Origin of a page-level directive (RCR-5 header vs RCR-6 meta). */
export type DirectiveSource = "header" | "meta";

/**
 * Page-level directives that apply to a bot (RCR-5/RCR-6). A present key means
 * the directive was found; the value records where it came from. Access-level
 * status is unaffected (these are index/training flags, not fetch blocks).
 */
export interface BotSignals {
  noindex?: DirectiveSource;
  nofollow?: DirectiveSource;
  noai?: DirectiveSource;
  noimageai?: DirectiveSource;
}

/** Per-bot access row (RCR-9). */
export interface BotAccess {
  userAgent: string;
  tier: BotTier;
  status: BotStatus;
  /** Matched directive line (e.g. `Disallow: /private`); null when none applies. */
  matchedRule: string | null;
  impact: BotImpact;
  /** Deterministic advisory text built from status + signals. */
  recommendation: string;
  signals: BotSignals;
}

/** Composite score breakdown (RCR-8 weights). */
export interface CrawlerAccessComponents {
  /** Tier1 accessibility, 0-50 (10 per bot, 5 bots). */
  tier1: number;
  /** Tier2 accessibility, 0-25 (proportional across Tier2 bots). */
  tier2: number;
  /** No-blanket-block bonus, 0 or 15. */
  blanketBonus: number;
  /** AI-files presence, 0-10 (5 sitemap + 5 llms.txt link). */
  aiFiles: number;
}

/** Engine-local crawler output — richer than the shared contract (RCR-9). */
export interface CrawlerAccessResult {
  compositeScore: number;
  perBot: BotAccess[];
  components: CrawlerAccessComponents;
}
