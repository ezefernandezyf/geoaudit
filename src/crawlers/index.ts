/**
 * Crawler engine public surface (design: `src/<domain>/index.ts` exposes the
 * engine entry points). The orchestrator (T25) imports from `@/crawlers`.
 */

export { BOTS, NOAI_RESPECTING } from "./bots";
export {
  matchPath,
  parseContentSignal,
  parseRobotsTxt,
  selectGroup,
} from "./robots-parser";
export type { ContentSignalEntry, PathMatch } from "./robots-parser";
export { scoreAccess, toContractResult } from "./access-map";
export { BOT_IMPACTS, BOT_STATUSES, BOT_TIERS } from "./types";
export type {
  BotAccess,
  BotAgent,
  BotImpact,
  BotSignals,
  BotStatus,
  BotTier,
  CrawlerAccessComponents,
  CrawlerAccessResult,
  DirectiveSource,
} from "./types";
